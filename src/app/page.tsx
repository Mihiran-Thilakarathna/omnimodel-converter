import TopNavigationBar from "@/components/Header";
import ConverterCard from "@/components/ConverterCard";

export default function ApplicationHome() {
  return (
    <main className="min-h-screen bg-[#04040a] text-white flex flex-col font-sans relative overflow-hidden">
      <TopNavigationBar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col items-center justify-center pt-16 pb-4 px-4 z-10 w-full">

        {/* Page title and animations */}
        <div className="relative w-full max-w-4xl mx-auto flex justify-center items-center py-2 mb-2">
          <div className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 w-[250px] md:w-[350px] h-[150px] bg-blue-700/50 blur-[80px] rounded-full pointer-events-none -z-10" />
          <div className="absolute top-1/2 left-[65%] -translate-x-1/2 -translate-y-1/2 w-[250px] md:w-[350px] h-[150px] bg-purple-600/40 blur-[90px] rounded-full pointer-events-none -z-10" />

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-center relative z-10 text-white">
            One model. <br /> <span>10+ formats.</span>
          </h1>
        </div>

        {/* Subheading */}
        <p className="text-[#a1a1aa] text-sm md:text-base text-center max-w-lg mb-4 leading-relaxed">
          The complete cross-framework utility — effortlessly convert deep learning models and deploy anywhere.
        </p>

        {/* Supported frameworks */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {["PyTorch", "TensorFlow", "ONNX", "CoreML", "+ more"].map((name) => (
            <span
              key={name}
              className="px-3 py-1 rounded-full border border-slate-700/60 bg-slate-800/50 text-xs font-medium text-slate-300 tracking-wide"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Main Conversion Component */}
        <div className="w-full max-w-3xl">
          <p className="text-[#71717a] text-xs md:text-sm tracking-[0.15em] font-mono uppercase text-center mb-5">
            Fast &middot; Secure &middot; Completely Free &middot; No Account Required
          </p>

          <div className="w-full">
            <ConverterCard />
          </div>
        </div>

      </div>

      {/* Copyright Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#555] bg-[#020205]">
        © 2026 OmniModel by Mihiran Thilakarathna. All rights reserved.
      </footer>
    </main>
  );
}
