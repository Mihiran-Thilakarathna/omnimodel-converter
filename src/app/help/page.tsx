import TopNavigationBar from "@/components/Header";
import { HelpCircle, ChevronRight } from "lucide-react";

export default function HelpDocumentationPage() {
  return (
    <main className="min-h-screen bg-[#04040a] text-white flex flex-col font-sans">
      <TopNavigationBar />

      {/* Visual lighting accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-[30rem] bg-gradient-to-b from-blue-500/40 to-transparent -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[10rem] bg-blue-500/10 blur-[100px] -z-10" />

      {/* Step-by-step instructions */}
      <div className="flex-1 flex flex-col items-center pt-32 px-4 max-w-4xl mx-auto z-10 w-full mb-20">
        <div className="bg-[#111116] border border-gray-800 rounded-2xl p-10 shadow-xl w-full">

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <HelpCircle className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">How to use OmniModel</h1>
          </div>

          <div className="space-y-8 text-gray-300 leading-relaxed">

            {/* Step 1 */}
            <section className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-sm font-bold text-white">1</span>
                Upload Your Model
              </h2>
              <p>
                Drag and drop your model file directly into the designated drop zone on the home page, or click <strong>'Choose File'</strong> to launch your file browser.
              </p>
            </section>

            {/* Step 2 */}
            <section className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-sm font-bold text-white">2</span>
                Choose the Target Format
              </h2>
              <p className="mb-4">
                OmniModel intelligently detects your source format. Selecting the exact target format dictates where your AI model can run effectively:
              </p>

              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-blue-500 shrink-0" />
                  <span><strong>ONNX (.onnx):</strong> Choose this to export an agnostic graph that can run anywhere across Python, C++, and hardware accelerators (TensorRT, DirectML).</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-blue-500 shrink-0" />
                  <span><strong>TFLite (.tflite):</strong> Essential for Mobile Developers! Choose this to compress and shrink your model to deploy natively in Android Studio, iOS apps, or IoT architectures.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-blue-500 shrink-0" />
                  <span><strong>PyTorch (.pt, .pth):</strong> Re-import standard PyTorch structures for further training loops or state dictionaries.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-5 h-5 text-blue-500 shrink-0" />
                  <span><strong>Keras (.keras, .h5):</strong> Standard deployment artifacts for TensorFlow pipelines and JavaScript mapping.</span>
                </li>
              </ul>
            </section>

            {/* Step 3 */}
            <section className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-sm font-bold text-white">3</span>
                Convert & Download
              </h2>
              <p>
                Hit the 'Convert' button and wait for the optimizing spinner to complete the underlying graph mapping. Once you see the success icon, click download to grab your deployment-ready model. It is completely secure and executes lightning fast!
              </p>
            </section>

          </div>
        </div>
      </div>

      <footer className="w-full mt-auto py-8 text-center text-xs text-[#555]">
        © 2026 OmniModel by Mihiran Thilakarathna. All rights reserved.
      </footer>
    </main>
  );
}
