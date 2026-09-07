"""
Generates real, loadable model files covering every conversion path OmniModel
supports, so they can be dragged into the UI by hand for manual verification.
Run once with the project's venv:  ..\venv\Scripts\python.exe generate_test_models.py
"""
import os
import shutil

import torch
import torch.nn as nn
import tensorflow as tf
from safetensors.torch import save_file

HERE = os.path.dirname(os.path.abspath(__file__))


class TinyNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Conv2d(3, 4, 3, padding=1)
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Linear(4, 2)

    def forward(self, x):
        x = self.conv(x)
        x = self.pool(x).flatten(1)
        return self.fc(x)


net = TinyNet().eval()
example = torch.randn(1, 3, 224, 224)
traced = torch.jit.trace(net, example)

# 1. PyTorch traced graph -> feeds: onnx, pt/pth, safetensors, mlmodel targets
traced.save(os.path.join(HERE, "sample_traced.pt"))
print("wrote sample_traced.pt")

# 2. Raw PyTorch state_dict -> should be REJECTED for onnx/mlmodel, but works for safetensors
torch.save(net.state_dict(), os.path.join(HERE, "sample_raw_weights.pth"))
print("wrote sample_raw_weights.pth  (raw weights only - use to test the error case)")

# 3. Safetensors -> feeds: pt/pth target
flat = {k: v.contiguous() for k, v in net.state_dict().items()}
save_file(flat, os.path.join(HERE, "sample_weights.safetensors"))
print("wrote sample_weights.safetensors")

# 4. Keras model -> feeds: h5, keras, tflite, onnx targets
keras_model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(224, 224, 3)),
    tf.keras.layers.Conv2D(4, 3, padding="same", activation="relu"),
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dense(2),
])
keras_model.save(os.path.join(HERE, "sample_model.h5"))
keras_model.save(os.path.join(HERE, "sample_model.keras"))
print("wrote sample_model.h5 / sample_model.keras")

# 5. ONNX model -> feeds: tflite, pb(zip) targets
torch.onnx.export(
    net, example, os.path.join(HERE, "sample_model.onnx"),
    export_params=True, opset_version=15,
    input_names=["input_node"], output_names=["output_node"],
    dynamo=False,
)
print("wrote sample_model.onnx")

# 6. TensorFlow SavedModel bundle, zipped -> feeds: onnx, tflite targets
savedmodel_dir = os.path.join(HERE, "_savedmodel_tmp")
if os.path.exists(savedmodel_dir):
    shutil.rmtree(savedmodel_dir)
keras_model.export(savedmodel_dir)
shutil.make_archive(os.path.join(HERE, "sample_savedmodel"), "zip", savedmodel_dir)
shutil.rmtree(savedmodel_dir)
print("wrote sample_savedmodel.zip")

print("\nAll test files generated in:", HERE)
