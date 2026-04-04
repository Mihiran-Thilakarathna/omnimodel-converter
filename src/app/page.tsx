import TopNavigationBar from "@/components/Header";
import ConverterCard from "@/components/ConverterCard";

export default function ApplicationHome() {
  return (
    <main className="min-h-screen bg-[#04040a] text-white flex flex-col font-sans relative overflow-hidden">
      <TopNavigationBar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col items-center justify-start pt-24 px-4 z-10 w-full mb-32">

        {/* Page title and animations */}
        <div className="relative w-full max-w-4xl mx-auto flex justify-center items-center py-6 mb-4">
          <div className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 w-[250px] md:w-[350px] h-[150px] bg-blue-700/50 blur-[80px] rounded-full pointer-events-none -z-10" />
          <div className="absolute top-1/2 left-[65%] -translate-x-1/2 -translate-y-1/2 w-[250px] md:w-[350px] h-[150px] bg-purple-600/40 blur-[90px] rounded-full pointer-events-none -z-10" />

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-center relative z-10 text-white">
            One model. <br /> <span>15+ formats.</span>
          </h1>
        </div>

        {/* Subheading */}
        <p className="text-[#a1a1aa] tracking-[0.2em] font-mono text-xs md:text-sm uppercase text-center max-w-3xl mb-16 leading-relaxed">
          OmniModel is the complete cross-framework utility. Effortlessly convert your deep learning models between 15+ file formats and unlock instant deployment across all platforms.
        </p>

        {/* Main Conversion Component */}
        <div className="w-full max-w-3xl mb-12">
          <h2 className="text-[40px] font-bold tracking-tight text-center mb-4">OmniModel Converter</h2>
          <p className="text-[#a1a1aa] text-center mb-10 text-[18px]">
            Seamlessly convert your ML models between 15+ formats. Fast, secure, and completely free.<br />No account required.
          </p>

          <div className="w-full">
            <ConverterCard />
          </div>
        </div>

      </div>

      {/* Copyright Footer */}
      <footer className="w-full py-8 text-center text-xs text-[#555] bg-[#020205]">
        © 2026 OmniModel by Mihiran Thilakarathna. All rights reserved.
      </footer>
    </main>
  );
}
