# OmniModel Converter

<p align="center">
  <strong>One model. 10+ formats.</strong><br/>
  The complete cross-framework utility for converting deep learning models — effortlessly.
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square"></a>
  <a href="https://vercel.com/"><img alt="Deploy with Vercel" src="https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel"></a>
  <a href="https://huggingface.co/spaces"><img alt="Hugging Face Spaces" src="https://img.shields.io/badge/Backend-HuggingFace%20Spaces-FFD21E?style=flat-square&logo=huggingface&logoColor=black"></a>
  <br/>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi">
  <img alt="PyTorch" src="https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=flat-square&logo=pytorch">
  <img alt="TensorFlow" src="https://img.shields.io/badge/TensorFlow-2.20+-FF6F00?style=flat-square&logo=tensorflow">
  <img alt="ONNX" src="https://img.shields.io/badge/ONNX-1.18+-005CED?style=flat-square&logo=onnx">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white">
</p>

<p align="center">
  🔴 <a href="https://omnimodel-converter.vercel.app/"><strong>Live Demo</strong></a>
</p>

---
## Overview

OmniModel is a production-grade, full-stack ML model conversion platform built to eliminate cross-framework deployment friction. It automates the translation of trained neural networks across **PyTorch, TensorFlow/Keras, ONNX, TFLite, CoreML, and Safetensors** — pairing a FastAPI conversion engine with a modern Next.js interface so a model trained in one ecosystem can be deployed in another without hand-rolled export scripts.

## Key Highlights

- Full-stack ML conversion system built with **Next.js + FastAPI**
- Cross-framework translation pipelines spanning **PyTorch ↔ ONNX ↔ TensorFlow ↔ CoreML ↔ Safetensors**
- A **dynamic preprocessing layer** that patches legacy Keras/H5 model configs before load
- **TensorFlow ⇄ ONNX** conversion via `onnx2tf` and `tf2onnx`, including full SavedModel bundle packaging
- Native **CoreML (`.mlmodel`)** export for PyTorch models via `coremltools`
- **Safetensors** import/export for fast, safe PyTorch weight interchange
- Accepts a zipped **TensorFlow SavedModel bundle** as an upload source, not just as an output
- Real upload-progress tracking (`XMLHttpRequest`) instead of a purely simulated bar
- Contextual in-UI guidance for format-specific constraints (e.g. CoreML's macOS-only runtime, ONNX/CoreML needing a traced graph rather than raw weights)

## Supported Conversions

OmniModel detects the uploaded file's extension and offers only the target formats that are actually implemented for it:

| Source Format | Target Formats | Engine / Notes |
| :--- | :--- | :--- |
| **`.h5`** (Legacy Keras) | `.tflite`, `.onnx`, `.keras` | Universal config patcher + TF native |
| **`.keras`** (Keras v3) | `.tflite`, `.onnx` | Universal config patcher + TF native |
| **`.pt`** / **`.pth`** (PyTorch) | `.onnx`, `.pt`/`.pth`, `.safetensors`, `.mlmodel` | TorchScript / JIT, `coremltools`, `safetensors` |
| **`.safetensors`** | `.pt`, `.pth` | `safetensors.torch` |
| **`.onnx`** | `.tflite`, `.pb` (SavedModel, delivered as `.zip`) | `onnx2tf` |
| **`.zip`** (TensorFlow SavedModel bundle) | `.onnx`, `.tflite` | `tf2onnx`, `tf.lite` |

> **Note:** ONNX and CoreML export require a *traced or scripted* PyTorch model (`torch.jit.trace` / `torch.jit.script`) — a raw `state_dict` alone has no computation graph to trace, so it can only convert to `.safetensors` or be re-saved as `.pt`/`.pth`.

## Core Engineering Contributions

### 1. Smart Universal Model Patcher
Intercepts outdated `.h5` and modern `.keras` ZIP archives, parses their internal JSON configs, and patches deprecated parameters (`batch_shape` → `batch_input_shape`, strips `quantization_config`, simplifies `DTypePolicy`) so older exported models still load cleanly on current Keras/TensorFlow.

### 2. TensorFlow ⇄ ONNX Bridge
- **TF → ONNX:** exports Keras 3 models to an intermediate `SavedModel`, then shells out to the `tf2onnx` CLI for a robust, version-tolerant conversion.
- **ONNX → TF:** uses `onnx2tf` to translate an ONNX graph into a TensorFlow `SavedModel` / `.tflite`, packaging the resulting `saved_model.pb` + `variables/` as a single downloadable ZIP rather than an unusable bare `.pb`.
- **SavedModel ZIP as a source:** unpacks an uploaded SavedModel bundle (including one nested inside an extra folder) and feeds it straight into the same ONNX/TFLite pipelines.

### 3. PyTorch Export Engine
- Supports `.pt` / `.pth` checkpoints, using TorchScript/JIT tracing for ONNX and CoreML export
- Dynamically bypasses the `weights_only` restriction introduced in PyTorch 2.4+
- Distinguishes a full traced graph from a raw `state_dict` and routes each to the conversions that are actually possible for it
- Custom input-shape configuration per model (with common presets for image classifiers, YOLO, MNIST, etc.)

### 4. CoreML & Safetensors Support
- Exports PyTorch graphs to `.mlmodel` via `coremltools`'s legacy neural-network backend, producing a single portable file
- Reads/writes `.safetensors` directly against a model's `state_dict`, independent of whether the source PyTorch file was a full traced graph or raw weights

### 5. User Experience
- Real upload-progress reporting via `XMLHttpRequest`, blended with a bounded simulated phase for server-side processing (which has no progress signal of its own)
- Drag-and-drop upload with client-side size/type rejection feedback
- Contextual hints surfaced next to the format picker for constraints that would otherwise only appear as a post-conversion error

## System Architecture

```
┌─────────────────────────────────────┐
│         Frontend (Next.js)          │
│  Drag & Drop UI + Progress Tracker  │
└────────────────┬────────────────────┘
                  │ HTTP / Multipart Form
┌─────────────────▼────────────────────┐
│          Backend (FastAPI)           │
│        /api/convert  endpoint        │
└────────────────┬────────────────────┘
                  │
┌─────────────────▼────────────────────┐
│           Conversion Engine          │
│ PyTorch JIT │ TF SavedModel │ ONNX   │
│  CoreML (coremltools) │ Safetensors  │
└───────────────────────────────────────┘
```

## Project Structure

```text
OmniModel/
├── backend/                  # FastAPI backend engine
│   ├── main.py               # Core conversion logic & API endpoints
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Container config for Hugging Face Spaces
├── src/                      # Next.js frontend (App Router)
│   ├── app/                  # Pages, layouts, and global styles
│   └── components/           # Reusable React UI components (ConverterCard, Header)
├── test/                     # Sample model files + generator script for manual testing
├── tailwind.config.ts        # Tailwind CSS configuration
├── .env.local                # Environment variable config (production API URL)
├── .env.development.local    # Local-dev override, loaded automatically by `npm run dev`
└── package.json              # Node.js dependencies and scripts
```

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js (React 18), Tailwind CSS, Lucide React, React Dropzone |
| **Backend** | FastAPI, Uvicorn (ASGI) |
| **ML Frameworks** | PyTorch 2.x (CPU), TensorFlow 2.20+, ONNX Runtime |
| **Conversion Tools** | `tf2onnx`, `onnx2tf`, `coremltools`, `safetensors`, `h5py`, TorchScript / JIT |
| **Frontend Deploy** | Vercel |
| **Backend Deploy** | Hugging Face Spaces (Docker) |

## Getting Started

### Prerequisites

- **Node.js** v18+
- **Python** 3.9+ (matches `backend/Dockerfile`'s production base image; developed and tested locally on 3.11)
- `git`

### 1. Clone the Repository

```bash
git clone https://github.com/Mihiran-Thilakarathna/OmniModel.git
cd OmniModel
```

### 2. Frontend Setup

Install dependencies:

```bash
npm install
```

For local development against your own backend, create a `.env.development.local` file (Next.js loads this automatically for `npm run dev`, without touching the production URL in `.env.local`):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/convert
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 3. Backend Setup

Open a new terminal and navigate to the backend:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# macOS / Linux
python -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`.

### 4. Try it with sample models

The `test/` directory ships a generator script that produces real, loadable model files covering every supported conversion path:

```bash
cd test
../venv/Scripts/python.exe generate_test_models.py   # Windows
# or: ../venv/bin/python generate_test_models.py      # macOS/Linux
```

Drop the generated files into the running app to exercise each conversion.

## Known Limitations

- Large models (>500MB) may result in extended processing times on free-tier hosting
- Custom layers and non-standard architectures are not fully supported
- ONNX and CoreML export require a traced/scripted PyTorch model — a raw `state_dict` cannot be converted to either
- CoreML (`.mlmodel`) output can only be opened, validated, or deployed on macOS/iOS
- A `.zip` upload must be a genuine TensorFlow SavedModel bundle (`saved_model.pb` + `variables/`); other ZIP contents will be rejected
- PyTorch → ONNX/CoreML conversions require a compatible input shape to be provided at conversion time
- GGUF and TensorFlow.js are not yet supported — GGUF needs a full HuggingFace model repo rather than a single file, and TensorFlow.js's Python converter currently pulls in a Windows-incompatible, version-pinning dependency chain

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a new feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please ensure your code follows the existing style and includes relevant comments for any new conversion logic.

## Author

**Mihiran Thilakarathna**

<p>
  <a href="https://www.linkedin.com/in/mihiran-thilakarathna-9478302a8"><img alt="LinkedIn" src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin"></a>
  <a href="https://github.com/Mihiran-Thilakarathna"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-Follow-181717?style=flat-square&logo=github"></a>
</p>

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
