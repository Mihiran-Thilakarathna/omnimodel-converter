"use client";

import React, { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, CheckCircle2, ArrowRight, AlertTriangle, Info } from "lucide-react";

type ProcessStage = "idle" | "options" | "converting" | "done" | "error";

// Mapping of input extensions to available output targets
const SUPPORTED_CONVERSIONS: Record<string, string[]> = {
  ".keras": [".tflite", ".onnx"],
  ".h5": [".tflite", ".onnx", ".keras"],
  ".pth": [".onnx", ".pt"],
  ".pt": [".onnx", ".pth"],
  ".onnx": [".tflite", ".pb"],
};

export default function ConverterCard() {
  const [currentStage, setCurrentStage] = useState<ProcessStage>("idle");
  const [uploadedFileObj, setUploadedFileObj] = useState<File | null>(null);
  const [sourceExtension, setSourceExtension] = useState<string>("");
  const [destinationFormat, setDestinationFormat] = useState<string>("");

  const [shapeMode, setShapeMode] = useState<"preset" | "custom">("preset");
  const [inputShape, setInputShape] = useState<string>("1, 3, 224, 224");
  const [shapeError, setShapeError] = useState<string>("");

  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [downloadSize, setDownloadSize] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Progress state variables
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileDrop = useCallback((incomingFiles: File[]) => {
    if (incomingFiles.length === 0) return;

    const incoming = incomingFiles[0];
    const matchExt = incoming.name.match(/\.[0-9a-z]+$/i);
    const resolvedExt = matchExt ? matchExt[0].toLowerCase() : "";

    setUploadedFileObj(incoming);
    setSourceExtension(resolvedExt);
    setCurrentStage("options");

    setShapeMode("preset");
    setInputShape("1, 3, 224, 224");
    setShapeError("");

    if (resolvedExt && SUPPORTED_CONVERSIONS[resolvedExt]) {
      setDestinationFormat(SUPPORTED_CONVERSIONS[resolvedExt][0]);
    } else {
      setDestinationFormat("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    multiple: false,
    maxSize: 5 * 1024 * 1024 * 1024,
  });

  const executeConversion = async () => {
    if (!destinationFormat || !uploadedFileObj) return;

    const isPyTorchToOnnx = (sourceExtension === ".pt" || sourceExtension === ".pth") && destinationFormat === ".onnx";

    if (isPyTorchToOnnx && shapeMode === "custom") {
      const shapeRegex = /^(\s*\d+\s*,)+\s*\d+\s*$/;
      if (!shapeRegex.test(inputShape)) {
        setShapeError("Invalid format! Please use comma-separated numbers only (e.g., 1, 3, 224, 224).");
        return;
      }
    }

    // Initialize conversion state
    setCurrentStage("converting");
    setErrorMessage("");
    setProgress(0);
    setProgressMessage("Uploading securely to node...");

    // Simulate progress bar updates
    let currentP = 0;
    intervalRef.current = setInterval(() => {
      // Increment progress by a random amount between 2% and 8%
      currentP += Math.random() * 6 + 2;

      // Pause at 95% until server response is received
      if (currentP > 95) currentP = 95;

      setProgress(Math.floor(currentP));

      // Update user message based on conversion progress
      if (currentP < 25) setProgressMessage("Uploading securely to node...");
      else if (currentP < 50) setProgressMessage("Analyzing model architecture...");
      else if (currentP < 75) setProgressMessage("Translating network layers...");
      else if (currentP < 95) setProgressMessage("Optimizing engine operations...");
      else setProgressMessage("Finalizing output (this can take a moment)...");
    }, 1200);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFileObj);
      formData.append("target_format", destinationFormat);

      if (isPyTorchToOnnx) {
        formData.append("input_shape", inputShape);
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/convert';

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errDetail = `Server raised error with status: ${response.status}`;
        try {
          const errData = await response.json();
          errDetail = errData.detail || errDetail;
        } catch (_) { }
        throw new Error(errDetail);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Complete progress and clear interval on success
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      setProgressMessage("Conversion Complete!");

      setTimeout(() => {
        setDownloadUrl(objectUrl);
        setDownloadSize(calculateSizeString(blob.size));
        setCurrentStage("done");
      }, 600);

    } catch (error: any) {
      console.error("Pipeline failure in structural network request:", error);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setErrorMessage(error.message || "An unexpected network error occurred executing translation.");
      setCurrentStage("error");
    }
  };

  const triggerReset = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    if (intervalRef.current) clearInterval(intervalRef.current);

    setCurrentStage("idle");
    setUploadedFileObj(null);
    setSourceExtension("");
    setDestinationFormat("");
    setShapeMode("preset");
    setInputShape("1, 3, 224, 224");
    setShapeError("");
    setDownloadUrl("");
    setDownloadSize("");
    setErrorMessage("");
    setProgress(0);
    setProgressMessage("");
  };

  const calculateSizeString = (bytesCount: number, fixedDms = 2) => {
    if (!+bytesCount) return "0 Bytes";
    const kFactor = 1024;
    const decimals = fixedDms < 0 ? 0 : fixedDms;
    const unitsList = ["Bytes", "KB", "MB", "GB", "TB"];
    const index = Math.floor(Math.log(bytesCount) / Math.log(kFactor));
    return `${parseFloat((bytesCount / Math.pow(kFactor, index)).toFixed(decimals))} ${unitsList[index]}`;
  };

  const allowedFormats = SUPPORTED_CONVERSIONS[sourceExtension] || [];
  const isPyTorchToOnnx = (sourceExtension === ".pt" || sourceExtension === ".pth") && destinationFormat === ".onnx";

  return (
    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-8 transition-all duration-300">

      {currentStage === "idle" && (
        <div
          {...getRootProps()}
          className={`rounded-[2rem] p-12 text-center cursor-pointer transition-all duration-300 ease-in-out flex flex-col items-center justify-center min-h-[300px] border border-gray-700 bg-transparent backdrop-blur-sm ${isDragActive ? "bg-white/10" : "hover:bg-white/5"
            }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-blue-500/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <UploadCloud className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-200 mb-3">Upload your file</h3>
          <p className="text-[15px] font-medium text-gray-500 tracking-wide mb-8">
            Click Choose File button to get started or drag and drop files to upload.
          </p>

          <button className="flex items-center gap-3 px-10 py-3.5 rounded-full border border-blue-500/80 bg-[#081836]/60 backdrop-blur-md text-blue-400 font-semibold text-sm hover:bg-[#0c2045] transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            Choose File
          </button>
        </div>
      )}

      {currentStage === "options" && uploadedFileObj && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
            <div className="truncate max-w-[70%]">
              <p className="text-sm font-medium text-slate-200 truncate">
                {uploadedFileObj.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {calculateSizeString(uploadedFileObj.size)}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-700 text-slate-300 rounded-md uppercase">
              {sourceExtension || "Unknown"}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 block">
              Convert to
            </label>

            {allowedFormats.length > 0 ? (
              <div className="relative">
                <select
                  value={destinationFormat}
                  onChange={(e) => setDestinationFormat(e.target.value)}
                  className="w-full appearance-none bg-slate-800 border border-slate-600 text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3 outline-none transition-all cursor-pointer"
                >
                  {destinationFormat === "" && (
                    <option value="" disabled>Select target format</option>
                  )}
                  {allowedFormats.map((itemValue) => (
                    <option key={itemValue} value={itemValue}>
                      {itemValue.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-sm text-orange-200 leading-relaxed">
                  <span className="font-semibold text-orange-400">{sourceExtension.toUpperCase()}</span> is an end-stage deployment format or currently unsupported for further conversion.
                </p>
              </div>
            )}
          </div>

          {isPyTorchToOnnx && (
            <div className="space-y-2 mt-4 animate-in fade-in duration-300">
              <label className="text-sm font-medium text-slate-300 block">
                Model Input Shape (PyTorch Only)
              </label>
              <div className="relative">
                <select
                  value={shapeMode === "custom" ? "custom" : inputShape}
                  onChange={(e) => {
                    setShapeError("");
                    if (e.target.value === "custom") {
                      setShapeMode("custom");
                      setInputShape("");
                    } else {
                      setShapeMode("preset");
                      setInputShape(e.target.value);
                    }
                  }}
                  className="w-full appearance-none bg-slate-800 border border-slate-600 text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3 outline-none transition-all cursor-pointer"
                >
                  <option value="1, 3, 224, 224">Standard Image (1, 3, 224, 224) - ResNet, VGG</option>
                  <option value="1, 3, 640, 640">High-Res Image (1, 3, 640, 640) - YOLO</option>
                  <option value="1, 1, 28, 28">Grayscale/MNIST (1, 1, 28, 28)</option>
                  <option value="1, 3, 256, 256">Square Image (1, 3, 256, 256)</option>
                  <option value="custom">Custom Shape...</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              {shapeMode === "custom" && (
                <div className="space-y-1 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <input
                    type="text"
                    value={inputShape}
                    onChange={(e) => {
                      setInputShape(e.target.value);
                      setShapeError("");
                    }}
                    placeholder="e.g., 1, 3, 224, 224"
                    className={`w-full bg-slate-800/80 text-white text-sm rounded-xl block px-4 py-3 outline-none transition-all placeholder:text-slate-500 ${shapeError
                      ? "border-2 border-red-500 focus:ring-2 focus:ring-red-500"
                      : "border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      }`}
                  />
                  {shapeError ? (
                    <p className="text-xs text-red-400 mt-1 pl-1 font-medium">{shapeError}</p>
                  ) : (
                    <>
                      <p className="text-xs text-blue-400 mt-1 pl-1">Format: Batch, Channels, Height, Width (Comma separated numbers only)</p>
                      <div className="text-xs text-slate-500 italic pl-1 flex items-center gap-1">
                        <span>(e.g., standard images use 1, 3, 224, 224)</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              onClick={triggerReset}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={executeConversion}
              disabled={allowedFormats.length === 0 || !destinationFormat || (isPyTorchToOnnx && shapeMode === "custom" && !inputShape.trim())}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Convert <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar UI */}
      {currentStage === "converting" && (
        <div className="py-10 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-sm mx-auto">

          <div className="w-full mb-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-slate-300 animate-pulse">{progressMessage}</span>
              <span className="text-sm font-bold text-blue-400">{progress}%</span>
            </div>

            {/* Progress track */}
            <div className="w-full bg-slate-800/80 rounded-full h-3 shadow-inner ring-1 ring-slate-700/50 overflow-hidden">
              {/* Progress fill */}
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full transition-all duration-[1200ms] ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Shine effect overlay */}
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 rounded-full"></div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium">Please do not close this window</p>
        </div>
      )}

      {currentStage === "error" && (
        <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-red-500/30">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Conversion Errored</h3>
            <p className="text-sm text-red-400 max-w-sm mx-auto">{errorMessage}</p>
          </div>
          <div className="pt-4 flex justify-center">
            <button
              onClick={triggerReset}
              className="w-full max-w-xs px-4 py-3 bg-red-600/20 border border-red-500/50 hover:bg-red-600/40 text-white text-sm font-semibold rounded-xl transition-colors focus:ring-2 focus:ring-red-400 focus:outline-none"
            >
              Acknowledge & Try Again
            </button>
          </div>
        </div>
      )}

      {currentStage === "done" && (
        <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Conversion Complete!</h3>
            <p className="text-sm text-slate-400">Your model has been successfully converted to {destinationFormat} mapping.</p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <a
              href={downloadUrl}
              download={`${uploadedFileObj?.name.replace(/\.[^/.]+$/, "")}${destinationFormat}`}
              className="w-full px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all focus:ring-2 focus:ring-emerald-400 flex items-center justify-center gap-2 no-underline"
            >
              <UploadCloud className="w-4 h-4 rotate-180" />
              Download {destinationFormat.toUpperCase()} ({downloadSize})
            </a>
            <button
              onClick={triggerReset}
              className="w-full px-4 py-3 bg-transparent hover:bg-white/5 text-slate-300 text-sm font-semibold rounded-xl transition-colors"
            >
              Convert Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}