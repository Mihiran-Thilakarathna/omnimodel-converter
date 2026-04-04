# 🚀 OmniModel Converter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![Hugging Face Spaces](https://img.shields.io/badge/Backend-HuggingFace%20Spaces-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://huggingface.co/spaces)
![Next.js](https://img.shields.io/badge/Next.js-18-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)
![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=flat-square&logo=pytorch)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.16+-FF6F00?style=flat-square&logo=tensorflow)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)

> A production-grade, full-stack ML model conversion platform engineered to eliminate cross-framework deployment barriers. OmniModel automates the translation of trained neural networks across PyTorch, TensorFlow/Keras, ONNX, and TFLite — combining a FastAPI backend orchestration engine with a modern Next.js interface to solve real-world ML pipeline compatibility challenges at scale.

🔴 **Live Demo:** [https://omnimodel-converter.vercel.app/](https://omnimodel-converter.vercel.app/)

---

## 📌 Key Highlights

- Designed and built a **full-stack ML conversion system** using Next.js + FastAPI
- Implemented **cross-framework model translation pipelines** (PyTorch ↔ ONNX ↔ TensorFlow)
- Engineered a **dynamic preprocessing layer** to fix legacy model compatibility issues
- Solved **TensorFlow–ONNX serialization constraints** using subprocess-based pipelines
- Developed a **scalable backend architecture** deployable on Hugging Face Spaces
- Built an intuitive UI with **real-time simulated progress tracking** for long-running tasks

---

## 🔄 Supported Conversions Matrix

OmniModel dynamically detects the uploaded model format and routes it through the appropriate backend translation pipeline:

| Source Format | Target Formats | Engine Processing Architecture |
| :--- | :--- | :--- |
| **`.h5`** (Legacy Keras) | `.tflite`, `.onnx`, `.keras` | Universal Patcher + TF Native |
| **`.keras`** (Keras v3) | `.tflite`, `.onnx` | Universal Patcher + TF Native |
| **`.pt`** (PyTorch) | `.onnx`, `.pth` | PyTorch JIT / TorchScript |
| **`.pth`** (PyTorch) | `.onnx`, `.pt` | PyTorch JIT / TorchScript |
| **`.onnx`** (Open Neural Network Exchange) | `.tflite`, `.pb` | ONNX Runtime / tf2onnx |

---

## 🧠 Core Engineering Contributions

### 1. Smart Universal Model Patcher
- Automatically intercepts outdated `.h5` and modern `.keras` ZIP archives
- Parses internal JSON configurations and dynamically patches deprecated parameters (e.g., `batch_shape` → `batch_input_shape`, removes `quantization_config` keys, simplifies `DTypePolicy`)
- Ensures seamless compatibility with TensorFlow 2.x runtime before model loading

### 2. ONNX Tensor-Bypass Protocol
- Solves the notorious `keras_tensor` serialization issue in TensorFlow 2.16+
- Exports Keras 3 models to an intermediate raw `SavedModel` directory
- Leverages `tf2onnx` CLI via subprocess execution for bulletproof conversions

### 3. PyTorch Export Engine
- Supports `.pt` and `.pth` checkpoint formats
- Uses TorchScript / JIT tracing for ONNX export
- Dynamically bypasses `weights_only` security restrictions introduced in PyTorch 2.4+
- Allows custom input shape configuration per model

### 4. User Experience Optimization
- Custom mathematical progression algorithm for simulated progress bar during heavy backend operations
- Drag-and-drop upload interface with format validation
- Clear stage-by-stage feedback throughout the conversion process

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────┐
│         Frontend (Next.js)          │
│   Drag & Drop UI + Progress Tracker │
└────────────────┬────────────────────┘
                 │ HTTP / Multipart Form
┌────────────────▼────────────────────┐
│         Backend (FastAPI)           │
│      /api/convert  endpoint         │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│        Conversion Engine            │
│  PyTorch JIT │ TF SavedModel │ ONNX │
└─────────────────────────────────────┘
```

---

## 📁 Project Structure

```text
OmniModel/
├── backend/                  # FastAPI backend engine
│   ├── main.py               # Core conversion logic & API endpoints
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Container config for Hugging Face Spaces
├── src/                      # Next.js frontend (App Router)
│   ├── app/                  # Pages, layouts, and global styles
│   └── components/           # Reusable React UI components (ConverterCard)
├── public/                   # Static assets and icons
├── tailwind.config.ts        # Tailwind CSS configuration
├── .env.local.example        # Environment variable template
└── package.json              # Node.js dependencies and scripts
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js (React 18), Tailwind CSS, Lucide React, React Dropzone |
| **Backend** | FastAPI, Uvicorn (ASGI) |
| **ML Frameworks** | PyTorch 2.x (CPU), TensorFlow 2.16+, ONNX Runtime |
| **Conversion Tools** | `tf2onnx`, `h5py`, TorchScript / JIT |
| **Frontend Deploy** | Vercel |
| **Backend Deploy** | Hugging Face Spaces (Docker) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Python** 3.10+
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

Create a `.env.local` file in the project root:

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

---

## ⚠️ Known Limitations

- Large models (>500MB) may result in extended processing times on free-tier hosting
- Custom layers and non-standard architectures are not fully supported
- Some ONNX → TFLite conversions may fail for complex computational graphs
- PyTorch models require a compatible dummy input shape to be provided at conversion time

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a new feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please ensure your code follows the existing style and includes relevant comments for any new conversion logic.

---

## 👤 Author

**Mihiran Thilakarathna**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/mihiran-thilakarathna-9478302a8)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat-square&logo=github)](https://github.com/Mihiran-Thilakarathna)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.