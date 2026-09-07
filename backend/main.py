import os
import sys
import shutil
import tempfile
import logging
import inspect
import subprocess # Process execution utility
import json
import zipfile
from typing import Optional
import packaging.version

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

# Machine Learning Frameworks
import numpy as np
import tensorflow as tf
import torch
try:
    import h5py
except ImportError:
    h5py = None

# Initialize tracking and logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI Application
app = FastAPI(title="OmniModel Core Conversion Engine v5.0 (Ultimate)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- UTILITY FUNCTIONS ---

def get_torch_version() -> packaging.version.Version:
    return packaging.version.parse(torch.__version__)

def robust_torch_loader(file_path: str):
    current_version = get_torch_version()
    try:
        if current_version >= packaging.version.parse("2.4.0"):
            return torch.load(file_path, map_location='cpu', weights_only=False)
        return torch.load(file_path, map_location='cpu')
    except Exception:
        return torch.jit.load(file_path, map_location='cpu')

def patch_onnx2tf_sample_data():
    # onnx2tf normally downloads a bundled sample image dataset to sanity-check
    # per-op accuracy during ONNX->TF conversion. That .npy was pickled under an
    # older numpy and fails to load under numpy>=2's stricter allow_pickle default,
    # and the download is an avoidable network call on a headless server. Swap in
    # synthetic data of the same shape; it only feeds the internal accuracy check.
    import onnx2tf.onnx2tf as onnx2tf_module
    onnx2tf_module.download_test_image_data = lambda: np.random.rand(20, 128, 128, 3).astype(np.float32)

def cleanup_temporary_files(file_paths: list):
    for path in file_paths:
        if os.path.exists(path):
            try:
                if os.path.isdir(path):
                    shutil.rmtree(path)
                else:
                    os.remove(path)
            except Exception:
                pass

def clean_keras_config(config_data):
    # Recursively removes unsupported keys and fixes legacy parameter names
    if isinstance(config_data, dict):
        cleaned = {}
        for k, v in config_data.items():
            # Drop unsupported quantization configs that fail in modern TF
            if k == 'quantization_config':
                continue
            # Simplify modern DTypePolicy back to standard strings
            if k == 'dtype' and isinstance(v, dict) and v.get('class_name') == 'DTypePolicy':
                cleaned[k] = v.get('config', {}).get('name', 'float32')
                continue
            # Fix legacy batch_shape parameter
            if k == 'batch_shape':
                cleaned['batch_input_shape'] = clean_keras_config(v)
                continue
            cleaned[k] = clean_keras_config(v)
        return cleaned
    elif isinstance(config_data, list):
        return [clean_keras_config(item) for item in config_data]
    else:
        return config_data

def apply_universal_patch(file_path: str, ext: str):
    # Unpacks and patches the structural configuration of model files before loading
    if ext == ".h5" and h5py is not None:
        try:
            with h5py.File(file_path, 'r+') as f:
                if 'model_config' in f.attrs:
                    config = f.attrs['model_config']
                    config_str = config.decode('utf-8') if isinstance(config, bytes) else str(config)
                    try:
                        config_dict = json.loads(config_str)
                        cleaned_dict = clean_keras_config(config_dict)
                        f.attrs['model_config'] = json.dumps(cleaned_dict).encode('utf-8')
                        logger.info("H5 structural patch applied successfully.")
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            logger.warning(f"H5 patch skipped: {e}")

    elif ext == ".keras":
        try:
            # Extract the .keras ZIP archive to edit the internal config.json
            temp_dir = tempfile.mkdtemp()
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            config_path = os.path.join(temp_dir, 'config.json')
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as f:
                    config_dict = json.load(f)
                
                cleaned_dict = clean_keras_config(config_dict)
                
                with open(config_path, 'w', encoding='utf-8') as f:
                    json.dump(cleaned_dict, f)
                
                # Repackage the archive with the cleaned configuration
                with zipfile.ZipFile(file_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for root, _, files in os.walk(temp_dir):
                        for file in files:
                            abs_path = os.path.join(root, file)
                            rel_path = os.path.relpath(abs_path, temp_dir)
                            zipf.write(abs_path, rel_path)
                logger.info("Keras ZIP configuration patch applied successfully.")
            shutil.rmtree(temp_dir)
        except Exception as e:
            logger.warning(f"Keras ZIP patch skipped: {e}")

# --- CORE API ENDPOINTS ---

@app.post("/api/convert")
async def process_model_conversion(
    bg_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_format: str = Form(...),
    input_shape: Optional[str] = Form(None)
):
    target_ext = target_format.lower().replace(".", "")
    source_ext = os.path.splitext(file.filename)[1].lower()
    # Some targets are delivered as an archive rather than a raw single-file artifact
    # (e.g. a TensorFlow SavedModel bundle); download_ext tracks the real file
    # extension of what actually gets streamed back, independent of target_ext.
    download_ext = target_ext

    artifact_tracker = []
    source_disk_path = ""
    result_disk_path = ""

    try:
        fd_in, source_disk_path = tempfile.mkstemp(suffix=source_ext)
        with os.fdopen(fd_in, 'wb') as stream:
            stream.write(await file.read())
        artifact_tracker.append(source_disk_path)

        fd_out, result_disk_path = tempfile.mkstemp(suffix=f".{target_ext}")
        os.close(fd_out)
        artifact_tracker.append(result_disk_path)

        # Handle PyTorch model conversion
        if source_ext in [".pt", ".pth"]:
            pt_instance = robust_torch_loader(source_disk_path)
            is_raw_weights = isinstance(pt_instance, dict)

            if target_ext == "onnx":
                if is_raw_weights:
                    raise ValueError("Payload contains raw weights only. OmniModel requires a traced or scripted structural graph.")

                tensor_dimensions = (1, 3, 224, 224)
                if input_shape:
                    tensor_dimensions = tuple(int(dim.strip()) for dim in input_shape.split(","))

                synthetic_input = torch.randn(*tensor_dimensions)
                if hasattr(pt_instance, 'eval'):
                    pt_instance.eval()

                export_parameters = {
                    "export_params": True,
                    "opset_version": 15,
                    "do_constant_folding": True,
                    "input_names": ['input_node'],
                    "output_names": ['output_node']
                }

                if "dynamo" in inspect.signature(torch.onnx.export).parameters:
                    export_parameters["dynamo"] = False

                logger.info("Initiating ONNX graph compilation via stable legacy exporter...")
                torch.onnx.export(pt_instance, synthetic_input, result_disk_path, **export_parameters)

            elif target_ext == "mlmodel":
                if is_raw_weights:
                    raise ValueError("Payload contains raw weights only. OmniModel requires a traced or scripted structural graph to export CoreML.")

                import coremltools as ct

                tensor_dimensions = (1, 3, 224, 224)
                if input_shape:
                    tensor_dimensions = tuple(int(dim.strip()) for dim in input_shape.split(","))

                if hasattr(pt_instance, 'eval'):
                    pt_instance.eval()

                logger.info("Translating PyTorch graph to CoreML via coremltools...")
                mlmodel = ct.convert(
                    pt_instance,
                    inputs=[ct.TensorType(name="input_node", shape=tensor_dimensions)],
                    convert_to="neuralnetwork",
                )
                mlmodel.save(result_disk_path)

            elif target_ext in ["pt", "pth"]:
                if isinstance(pt_instance, (torch.jit.ScriptModule, torch.jit.RecursiveScriptModule)):
                    torch.jit.save(pt_instance, result_disk_path)
                else:
                    torch.save(pt_instance, result_disk_path)

            elif target_ext == "safetensors":
                from safetensors.torch import save_file

                logger.info("Extracting tensor weights to safetensors format...")
                state_dict = pt_instance if is_raw_weights else pt_instance.state_dict()
                flat_tensors = {name: tensor.contiguous() for name, tensor in state_dict.items()}
                save_file(flat_tensors, result_disk_path)

            else:
                raise ValueError(f"Conversion from PyTorch to .{target_ext} is not supported.")

        # Handle Safetensors model conversion
        elif source_ext == ".safetensors":
            if target_ext in ["pt", "pth"]:
                from safetensors.torch import load_file

                logger.info("Reconstructing PyTorch state dict from safetensors payload...")
                state_dict = load_file(source_disk_path)
                torch.save(state_dict, result_disk_path)
            else:
                raise ValueError(f"Conversion from .safetensors to .{target_ext} is not supported.")

        # Handle TensorFlow and Keras model conversion
        elif source_ext in [".keras", ".h5"]:
            
            # Apply pre-load patch to fix quantization_config and legacy serialization issues
            apply_universal_patch(source_disk_path, source_ext)

            logger.info("Loading graph using modern TF/Keras engine...")
            tf_instance = tf.keras.models.load_model(source_disk_path, compile=False)
            
            if target_ext == "tflite":
                converter = tf.lite.TFLiteConverter.from_keras_model(tf_instance)
                tflite_binary = converter.convert()
                with open(result_disk_path, "wb") as output_stream:
                    output_stream.write(tflite_binary)
            
            elif target_ext == "onnx":
                saved_model_dir = tempfile.mkdtemp()
                artifact_tracker.append(saved_model_dir)

                logger.info("Bypassing Keras tensors by exporting to raw SavedModel...")
                try:
                    tf_instance.export(saved_model_dir)
                except AttributeError:
                    tf.saved_model.save(tf_instance, saved_model_dir)

                logger.info("Translating standard SavedModel to ONNX via robust Native CLI...")
                
                # Execute the official tf2onnx CLI
                process = subprocess.run(
                    [sys.executable, "-m", "tf2onnx.convert", "--saved-model", saved_model_dir, "--output", result_disk_path, "--opset", "15"],
                    capture_output=True, text=True
                )
                
                if process.returncode != 0:
                    raise RuntimeError(f"Native ONNX conversion failed: {process.stderr}")
            
            elif target_ext in ["keras", "h5"]:
                logger.info(f"Serializing graph to structural .{target_ext} format...")
                tf_instance.save(result_disk_path)

            else:
                raise ValueError(f"Conversion from {source_ext} to .{target_ext} is not supported.")

        # Handle ONNX model conversion
        elif source_ext == ".onnx":
            if target_ext in ["tflite", "pb"]:
                import onnx2tf
                patch_onnx2tf_sample_data()

                conversion_workdir = tempfile.mkdtemp()
                artifact_tracker.append(conversion_workdir)

                logger.info("Translating ONNX graph to TensorFlow representation via onnx2tf...")
                onnx2tf.convert(
                    input_onnx_file_path=source_disk_path,
                    output_folder_path=conversion_workdir,
                    non_verbose=True,
                )

                if target_ext == "tflite":
                    produced_files = [f for f in os.listdir(conversion_workdir) if f.endswith("_float32.tflite")]
                    if not produced_files:
                        raise RuntimeError("onnx2tf did not produce a .tflite artifact for this graph.")
                    shutil.copyfile(os.path.join(conversion_workdir, produced_files[0]), result_disk_path)
                else:
                    # Deliver the full TensorFlow SavedModel bundle (saved_model.pb + variables/)
                    # as a ZIP, since a bare saved_model.pb is unusable without its variables.
                    # onnx2tf also drops incidental .tflite byproducts in this same folder,
                    # so only the actual SavedModel members are archived.
                    if not os.path.exists(os.path.join(conversion_workdir, "saved_model.pb")):
                        raise RuntimeError("onnx2tf did not produce a SavedModel bundle for this graph.")
                    with zipfile.ZipFile(result_disk_path, "w", zipfile.ZIP_DEFLATED) as archive:
                        for member in ["saved_model.pb", "fingerprint.pb", "assets", "variables"]:
                            member_path = os.path.join(conversion_workdir, member)
                            if not os.path.exists(member_path):
                                continue
                            if os.path.isdir(member_path):
                                for root, _, files in os.walk(member_path):
                                    for filename in files:
                                        abs_path = os.path.join(root, filename)
                                        archive.write(abs_path, os.path.relpath(abs_path, conversion_workdir))
                            else:
                                archive.write(member_path, member)
                    download_ext = "zip"
            else:
                raise ValueError(f"Conversion from ONNX to .{target_ext} is not supported.")

        # Handle a TensorFlow SavedModel bundle uploaded as a ZIP archive
        elif source_ext == ".zip":
            if target_ext in ["onnx", "tflite"]:
                extract_dir = tempfile.mkdtemp()
                artifact_tracker.append(extract_dir)
                with zipfile.ZipFile(source_disk_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_dir)

                saved_model_dir = extract_dir
                if not os.path.exists(os.path.join(saved_model_dir, "saved_model.pb")):
                    nested_dirs = [
                        os.path.join(extract_dir, entry) for entry in os.listdir(extract_dir)
                        if os.path.isdir(os.path.join(extract_dir, entry))
                    ]
                    nested_match = next(
                        (d for d in nested_dirs if os.path.exists(os.path.join(d, "saved_model.pb"))),
                        None,
                    )
                    if nested_match is None:
                        raise ValueError("Uploaded ZIP does not contain a valid TensorFlow SavedModel (missing saved_model.pb).")
                    saved_model_dir = nested_match

                if target_ext == "tflite":
                    logger.info("Translating SavedModel bundle to TFLite...")
                    converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_dir)
                    tflite_binary = converter.convert()
                    with open(result_disk_path, "wb") as output_stream:
                        output_stream.write(tflite_binary)
                else:
                    logger.info("Translating SavedModel bundle to ONNX via robust Native CLI...")
                    process = subprocess.run(
                        [sys.executable, "-m", "tf2onnx.convert", "--saved-model", saved_model_dir, "--output", result_disk_path, "--opset", "15"],
                        capture_output=True, text=True
                    )
                    if process.returncode != 0:
                        raise RuntimeError(f"Native ONNX conversion failed: {process.stderr}")
            else:
                raise ValueError(f"Conversion from a SavedModel ZIP to .{target_ext} is not supported.")

        else:
            raise ValueError(f"Source format '{source_ext}' is not supported by OmniModel.")

        bg_tasks.add_task(cleanup_temporary_files, artifact_tracker)
        
        return FileResponse(
            path=result_disk_path,
            filename=f"{os.path.splitext(file.filename)[0]}.{download_ext}",
            media_type="application/octet-stream"
        )

    except Exception as execution_error:
        logger.error(f"Pipeline Interrupted: {str(execution_error)}")
        cleanup_temporary_files(artifact_tracker)
        raise HTTPException(status_code=400, detail=f"Engine Diagnostic: {str(execution_error)}")

@app.get("/")
def health_check():
    return {
        "status": "Engine Active", 
        "torch_version": torch.__version__, 
        "tf_version": tf.__version__
    }