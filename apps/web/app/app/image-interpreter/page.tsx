"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  FileImage,
  X,
  Sparkles,
  Check,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Download,
  Copy,
  Target,
  Plus,
  Crosshair,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson } from "@/lib/fcf/schema";
import FcfPreview from "@/components/fcf/FcfPreview";
import { ConfidenceBar } from "@/components/gdt/ConfidenceIndicator";

interface ExtractedFcf {
  fcf: Partial<FcfJson>;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ExtractionResult {
  fcfs: ExtractedFcf[];
  metadata: {
    drawingType: string;
    unit: "mm" | "inch";
    scale?: string;
  };
  processingTime: number;
}

// Technical panel wrapper
function TechnicalPanel({
  children,
  label,
  className,
  headerRight,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className={cn("relative bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800", className)}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-300 dark:border-slate-700" />

      {(label || headerRight) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50">
          {label && (
            <span className="font-mono text-[10px] text-slate-500 tracking-widest">{label}</span>
          )}
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

export default function ImageInterpreterPage() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [selectedFcfIndex, setSelectedFcfIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(100);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return;
    }

    setFileName(file.name);
    setExtractionResult(null);
    setSelectedFcfIndex(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle click upload
  const handleClickUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // Clear image
  const handleClear = useCallback(() => {
    setImage(null);
    setFileName(null);
    setExtractionResult(null);
    setSelectedFcfIndex(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Extract FCFs from image
  const handleExtract = useCallback(async () => {
    if (!image) return;

    setIsProcessing(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock extraction result
    const mockResult: ExtractionResult = {
      fcfs: [
        {
          fcf: {
            characteristic: "position",
            featureType: "hole",
            tolerance: { value: 0.25, diameter: true, materialCondition: "MMC" },
            datums: [{ id: "A" }, { id: "B" }, { id: "C" }],
            sourceUnit: "mm",
            source: { inputType: "image" },
            name: "Mounting Hole Position",
          },
          confidence: 0.94,
          boundingBox: { x: 120, y: 80, width: 150, height: 40 },
        },
        {
          fcf: {
            characteristic: "flatness",
            featureType: "surface",
            tolerance: { value: 0.05 },
            datums: [],
            sourceUnit: "mm",
            source: { inputType: "image" },
            name: "Top Surface Flatness",
          },
          confidence: 0.88,
          boundingBox: { x: 200, y: 180, width: 100, height: 35 },
        },
        {
          fcf: {
            characteristic: "perpendicularity",
            featureType: "plane",
            tolerance: { value: 0.1 },
            datums: [{ id: "A" }],
            sourceUnit: "mm",
            source: { inputType: "image" },
            name: "Side Face Perpendicularity",
          },
          confidence: 0.76,
          boundingBox: { x: 50, y: 250, width: 130, height: 38 },
        },
      ],
      metadata: {
        drawingType: "Mechanical Part Drawing",
        unit: "mm",
        scale: "1:1",
      },
      processingTime: 2.4,
    };

    setExtractionResult(mockResult);
    setIsProcessing(false);
  }, [image]);

  // Copy all FCFs as JSON
  const handleCopyAll = useCallback(() => {
    if (!extractionResult) return;
    const json = extractionResult.fcfs.map((f) => f.fcf);
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [extractionResult]);

  // Download all FCFs as JSON
  const handleDownloadAll = useCallback(() => {
    if (!extractionResult) return;
    const json = extractionResult.fcfs.map((f) => f.fcf);
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extracted-fcfs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [extractionResult]);

  const selectedFcf = selectedFcfIndex !== null ? extractionResult?.fcfs[selectedFcfIndex] : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-accent-500" />
            <span className="font-mono text-xs text-accent-500 tracking-widest">EXTRACT.AI</span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            IMAGE INTERPRETER
          </h1>
          <p className="text-slate-500 mt-1 font-mono text-sm">
            Extract FCF data from engineering drawings using AI vision
          </p>
        </div>

        {extractionResult && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 font-mono text-xs transition-colors"
              title="Copy all FCFs"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-accent-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              COPY ALL
            </button>
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 font-mono text-xs transition-colors"
              title="Download all FCFs"
            >
              <Download className="w-3.5 h-3.5" />
              EXPORT
            </button>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4 py-3 px-4 bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          {extractionResult ? (
            <>
              <div className="w-1.5 h-1.5 bg-accent-500 animate-pulse" />
              <span className="font-mono text-xs text-accent-500">
                {extractionResult.fcfs.length} FCF{extractionResult.fcfs.length !== 1 ? 'S' : ''} EXTRACTED
              </span>
            </>
          ) : image ? (
            <>
              <div className="w-1.5 h-1.5 bg-warning-500" />
              <span className="font-mono text-xs text-warning-500">IMAGE LOADED</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 bg-slate-600" />
              <span className="font-mono text-xs text-slate-600">AWAITING IMAGE</span>
            </>
          )}
        </div>
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
        <span className="font-mono text-[10px] text-slate-500">
          MODEL: GPT-5.1-VISION
        </span>
        {extractionResult && (
          <>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">
              TIME: {extractionResult.processingTime.toFixed(1)}s
            </span>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden pt-6">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Panel */}
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Upload area or image preview */}
            {!image ? (
              <TechnicalPanel label="INPUT.IMAGE" className="flex-1">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={handleClickUpload}
                  className={cn(
                    "flex flex-col items-center justify-center min-h-[400px] cursor-pointer",
                    "transition-all duration-200 m-4",
                    isDragging
                      ? "border-2 border-dashed border-accent-500 bg-accent-500/5"
                      : "border-2 border-dashed border-slate-800 hover:border-slate-700"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="relative mb-6">
                    <div className="w-20 h-20 border border-slate-700 flex items-center justify-center">
                      {/* Corner accents */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-600" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-600" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-600" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-600" />
                      <Upload
                        className={cn(
                          "w-8 h-8",
                          isDragging ? "text-accent-500" : "text-slate-600"
                        )}
                      />
                    </div>
                  </div>
                  <h3 className="font-mono text-sm text-slate-300 mb-2">
                    {isDragging ? "DROP TO UPLOAD" : "UPLOAD DRAWING"}
                  </h3>
                  <p className="font-mono text-xs text-slate-600 text-center max-w-xs">
                    Drag and drop an engineering drawing or click to browse
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    {["PNG", "JPG", "PDF"].map((format) => (
                      <span
                        key={format}
                        className="font-mono text-[10px] text-slate-700 px-2 py-1 border border-slate-800"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </TechnicalPanel>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 gap-4">
                <TechnicalPanel
                  label="INPUT.IMAGE"
                  className="flex-1 flex flex-col"
                  headerRight={
                    <div className="flex items-center gap-2">
                      {/* Zoom controls */}
                      <div className="flex items-center gap-1 border border-slate-800 px-2 py-1">
                        <button
                          onClick={() => setZoom(Math.max(25, zoom - 25))}
                          className="p-1 hover:bg-slate-800 transition-colors"
                        >
                          <ZoomOut className="w-3 h-3 text-slate-500" />
                        </button>
                        <span className="font-mono text-[10px] text-slate-500 w-10 text-center">
                          {zoom}%
                        </span>
                        <button
                          onClick={() => setZoom(Math.min(200, zoom + 25))}
                          className="p-1 hover:bg-slate-800 transition-colors"
                        >
                          <ZoomIn className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                      <button
                        onClick={handleClear}
                        className="p-1.5 hover:bg-slate-800 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </div>
                  }
                >
                  {/* File info */}
                  <div className="px-4 py-2 border-b border-slate-800/50 flex items-center gap-2">
                    <FileImage className="w-3.5 h-3.5 text-slate-600" />
                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-[300px]">
                      {fileName}
                    </span>
                  </div>

                  {/* Image container */}
                  <div className="flex-1 relative overflow-auto bg-slate-950/50 m-4">
                    {/* Grid background */}
                    <div
                      className="absolute inset-0 opacity-[0.03]"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, #00D4AA 1px, transparent 1px),
                          linear-gradient(to bottom, #00D4AA 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px',
                      }}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center p-4"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "center center",
                      }}
                    >
                      <img
                        src={image}
                        alt="Uploaded drawing"
                        className="max-w-full max-h-full object-contain"
                      />

                      {/* Bounding boxes for extracted FCFs */}
                      {extractionResult?.fcfs.map((fcf, index) =>
                        fcf.boundingBox ? (
                          <div
                            key={index}
                            onClick={() => setSelectedFcfIndex(index)}
                            className={cn(
                              "absolute border-2 cursor-pointer transition-all",
                              selectedFcfIndex === index
                                ? "border-accent-500 bg-accent-500/20"
                                : "border-accent-500/50 hover:border-accent-500 hover:bg-accent-500/10"
                            )}
                            style={{
                              left: fcf.boundingBox.x,
                              top: fcf.boundingBox.y,
                              width: fcf.boundingBox.width,
                              height: fcf.boundingBox.height,
                            }}
                          >
                            <span className="absolute -top-5 left-0 font-mono text-[10px] text-accent-400">
                              FCF.{String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                </TechnicalPanel>

                {/* Extract button */}
                <button
                  onClick={handleExtract}
                  disabled={isProcessing}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 font-mono text-xs font-semibold transition-all",
                    isProcessing
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-accent-500 text-slate-950 hover:bg-accent-400"
                  )}
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  }}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      EXTRACTING...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      EXTRACT FCFs WITH AI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-4 overflow-auto scrollbar-hide">
            {/* Processing state */}
            {isProcessing && (
              <TechnicalPanel label="PROCESSING" className="flex-1">
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 border border-slate-700" />
                      <div className="absolute inset-2 border border-accent-500/30 animate-pulse" />
                      <Crosshair className="absolute inset-0 m-auto w-8 h-8 text-accent-500 animate-pulse" />
                    </div>
                    <h3 className="font-mono text-sm text-slate-300 mb-2">
                      ANALYZING DRAWING
                    </h3>
                    <p className="font-mono text-xs text-slate-600">
                      AI is extracting feature control frames...
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-4">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-accent-500 animate-pulse"
                          style={{ animationDelay: `${i * 200}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TechnicalPanel>
            )}

            {/* Extraction results */}
            {!isProcessing && extractionResult && (
              <>
                {/* Metadata */}
                <TechnicalPanel label="EXTRACT.META">
                  <div className="p-4 grid grid-cols-3 gap-4">
                    <div>
                      <span className="font-mono text-[10px] text-slate-600 tracking-widest">TYPE</span>
                      <p className="font-mono text-xs text-slate-300 mt-1">
                        {extractionResult.metadata.drawingType.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-slate-600 tracking-widest">UNITS</span>
                      <p className="font-mono text-xs text-slate-300 mt-1">
                        {extractionResult.metadata.unit.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-slate-600 tracking-widest">FOUND</span>
                      <p className="font-mono text-sm text-accent-400 font-bold mt-1">
                        {extractionResult.fcfs.length}
                      </p>
                    </div>
                  </div>
                </TechnicalPanel>

                {/* FCF list */}
                <TechnicalPanel label="EXTRACT.RESULTS" className="flex-1">
                  <div className="p-4 space-y-3">
                    {extractionResult.fcfs.map((item, index) => (
                      <div
                        key={index}
                        onClick={() =>
                          setSelectedFcfIndex(
                            selectedFcfIndex === index ? null : index
                          )
                        }
                        className={cn(
                          "p-4 border cursor-pointer transition-all",
                          selectedFcfIndex === index
                            ? "border-accent-500 bg-accent-500/10"
                            : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[10px] text-slate-600">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <div>
                              <h4 className="font-mono text-xs text-slate-200">
                                {(item.fcf.name || `FCF ${index + 1}`).toUpperCase()}
                              </h4>
                              <p className="font-mono text-[10px] text-slate-500 uppercase mt-0.5">
                                {item.fcf.characteristic} / {item.fcf.featureType || "UNSPECIFIED"}
                              </p>
                            </div>
                          </div>
                          <ConfidenceBar
                            parseConfidence={item.confidence}
                            showValue
                            size="sm"
                          />
                        </div>

                        {/* FCF Preview */}
                        <div className="flex items-center justify-center p-4 bg-slate-950/50 relative">
                          <div
                            className="absolute inset-0 opacity-[0.02]"
                            style={{
                              backgroundImage: `
                                linear-gradient(to right, #00D4AA 1px, transparent 1px),
                                linear-gradient(to bottom, #00D4AA 1px, transparent 1px)
                              `,
                              backgroundSize: '10px 10px',
                            }}
                          />
                          <FcfPreview fcf={item.fcf} scale={1.2} />
                        </div>
                      </div>
                    ))}
                  </div>
                </TechnicalPanel>

                {/* Selected FCF details */}
                {selectedFcf && (
                  <TechnicalPanel
                    label="FCF.DETAIL"
                    headerRight={
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(selectedFcf.fcf, null, 2)
                          );
                        }}
                        className="font-mono text-[10px] text-slate-500 hover:text-accent-500 transition-colors flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        COPY JSON
                      </button>
                    }
                  >
                    <div className="p-4">
                      <pre className="font-mono text-xs text-slate-300 bg-slate-950/50 p-4 overflow-auto max-h-[200px] scrollbar-hide">
                        {JSON.stringify(selectedFcf.fcf, null, 2)}
                      </pre>
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-500 text-slate-950 font-mono text-xs font-semibold hover:bg-accent-400 transition-colors"
                          style={{
                            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          ADD TO PROJECT
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 font-mono text-xs hover:border-slate-600 transition-colors">
                          <Target className="w-3.5 h-3.5" />
                          OPEN IN BUILDER
                        </button>
                      </div>
                    </div>
                  </TechnicalPanel>
                )}
              </>
            )}

            {/* Empty state */}
            {!isProcessing && !extractionResult && (
              <TechnicalPanel label="OUTPUT.PENDING" className="flex-1">
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="w-20 h-20 border border-slate-800 mx-auto mb-6 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-700" />
                    </div>
                    <h3 className="font-mono text-sm text-slate-500 mb-2">
                      NO IMAGE UPLOADED
                    </h3>
                    <p className="font-mono text-xs text-slate-600 max-w-xs">
                      Upload an engineering drawing to extract feature control
                      frames using AI-powered image recognition.
                    </p>
                  </div>
                </div>
              </TechnicalPanel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
