import TopNavigationBar from "@/components/Header";
import { Github, Linkedin, Cpu } from "lucide-react";

export default function AboutOmniModelPage() {
  return (
    <main className="min-h-screen bg-[#04040a] text-white flex flex-col font-sans">
      <TopNavigationBar />

      {/* Background ambient lighting overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-[30rem] bg-gradient-to-b from-blue-500/40 to-transparent -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[10rem] bg-blue-500/10 blur-[100px] -z-10" />

      {/* Main content container */}
      <div className="flex-1 flex flex-col items-center pt-32 px-4 max-w-4xl mx-auto z-10">
        <div className="bg-[#111116] border border-gray-800 rounded-2xl p-10 shadow-xl w-full">

          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Cpu className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">About OmniModel</h1>
          </div>

          <div className="space-y-6 text-gray-300 leading-relaxed">
            <p className="text-lg">
              OmniModel is a powerful, seamless utility designed to obliterate the friction between different Machine Learning frameworks. It allows researchers, engineers, and creators to convert deeply complex Neural Network formats instantly and deploy them across any platform.
            </p>

            {/* Supported Formats Section */}
            <div>
              <h3 className="text-white text-xl font-semibold mb-3">What can it convert?</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li><span className="text-white font-medium">TensorFlow & Keras:</span> .h5, .keras, SavedModel (.pb/.zip)</li>
                <li><span className="text-white font-medium">PyTorch:</span> .pt, .pth, .safetensors</li>
                <li><span className="text-white font-medium">ONNX:</span> The universal format for high-speed interoperability</li>
                <li><span className="text-white font-medium">TensorFlow Lite:</span> .tflite for edge and mobile deployment</li>
                <li><span className="text-white font-medium">CoreML:</span> .mlmodel for iOS and macOS deployment</li>
              </ul>
            </div>

            <p>
              By translating operations safely mapping graph nodes across distinct backend compute engines, OmniModel saves you weeks of re-training time.
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-6">Created by</h3>
            <div className="flex flex-col sm:flex-row gap-6">
              <a
                href="https://github.com/Mihiran-Thilakarathna"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-colors group"
              >
                <Github className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                <span className="font-medium">Mihiran Thilakarathna</span>
              </a>

              <a
                href="https://www.linkedin.com/in/mihiran-thilakarathna-9478302a8/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 rounded-xl border border-blue-900/50 bg-blue-900/10 hover:bg-blue-900/30 transition-colors group"
              >
                <Linkedin className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                <span className="font-medium text-blue-100">LinkedIn Profile</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full mt-auto py-8 text-center text-xs text-[#555]">
        © 2026 OmniModel by Mihiran Thilakarathna. All rights reserved.
      </footer>
    </main>
  );
}
