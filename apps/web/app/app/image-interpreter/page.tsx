"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  FileImage,
  X,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Download,
  Copy,
  Target,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson } from "@/lib/fcf/schema";
import FcfPreview from "@/components/fcf/FcfPreview";
import { ConfidenceBar } from "@/components/gdt/ConfidenceIndicator";
import { ValidationPanel } from "@/components/gdt/ValidationMessage";
import type { ValidationResult } from "@/lib/rules/validateFcf";

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
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-mono font-bold text-slate-50 tracking-tight">
            Image Interpreter
          </h1>
          <p className="text-slate-400 mt-1">
            Upload engineering drawings or screenshots to extract FCF data using AI
          </p>
        </div>
        {extractionResult && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="btn-secondary text-sm"
              title="Copy all FCFs"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Copy All
            </button>
            <button
              onClick={handleDownloadAll}
              className="btn-secondary text-sm"
              title="Download all FCFs"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden pt-6">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Panel */}
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Upload area or image preview */}
            {!image ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={handleClickUpload}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center",
                  "border-2 border-dashed rounded-lg cursor-pointer",
                  "transition-all duration-200",
                  isDragging
                    ? "border-primary-500 bg-primary-500/10"
                    : "border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div
                  className={cn(
                    "flex items-center justify-center w-16 h-16 rounded-full mb-4",
                    isDragging ? "bg-primary-500/20" : "bg-slate-800"
                  )}
                >
                  <Upload
                    className={cn(
                      "w-8 h-8",
                      isDragging ? "text-primary-400" : "text-slate-500"
                    )}
                  />
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  {isDragging ? "Drop to upload" : "Upload Drawing"}
                </h3>
                <p className="text-sm text-slate-500 text-center max-w-xs">
                  Drag and drop an engineering drawing or screenshot, or click to browse.
                  <br />
                  <span className="text-slate-600">
                    Supports PNG, JPG, PDF
                  </span>
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Image header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <FileImage className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{fileName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Zoom controls */}
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1">
                      <button
                        onClick={() => setZoom(Math.max(25, zoom - 25))}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                      >
                        <ZoomOut className="w-4 h-4 text-slate-400" />
                      </button>
                      <span className="text-xs text-slate-400 w-12 text-center">
                        {zoom}%
                      </span>
                      <button
                        onClick={() => setZoom(Math.min(200, zoom + 25))}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                      >
                        <ZoomIn className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    <button
                      onClick={handleClear}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Image container */}
                <div className="flex-1 relative overflow-auto bg-slate-950 rounded-lg border border-slate-800">
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
                            "absolute border-2 rounded cursor-pointer transition-all",
                            selectedFcfIndex === index
                              ? "border-primary-500 bg-primary-500/10"
                              : "border-accent-500/50 hover:border-accent-500 hover:bg-accent-500/10"
                          )}
                          style={{
                            left: fcf.boundingBox.x,
                            top: fcf.boundingBox.y,
                            width: fcf.boundingBox.width,
                            height: fcf.boundingBox.height,
                          }}
                        >
                          <span className="absolute -top-5 left-0 text-xs font-mono text-accent-400">
                            #{index + 1}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>

                {/* Extract button */}
                <div className="mt-4">
                  <button
                    onClick={handleExtract}
                    disabled={isProcessing}
                    className="btn-primary w-full"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Extracting FCFs...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Extract FCFs with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-4 overflow-auto scrollbar-hide">
            {/* Processing state */}
            {isProcessing && (
              <div className="panel flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-slate-700 rounded-full" />
                    <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300 mb-2">
                    Analyzing Drawing
                  </h3>
                  <p className="text-sm text-slate-500">
                    AI is extracting feature control frames...
                  </p>
                </div>
              </div>
            )}

            {/* Extraction results */}
            {!isProcessing && extractionResult && (
              <>
                {/* Metadata */}
                <div className="panel">
                  <div className="panel-header">
                    <h3 className="panel-title">Extraction Results</h3>
                    <span className="text-xs text-slate-500">
                      {extractionResult.processingTime.toFixed(1)}s
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-slate-500">Type:</span>{" "}
                      <span className="text-slate-300">
                        {extractionResult.metadata.drawingType}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Units:</span>{" "}
                      <span className="text-slate-300 font-mono">
                        {extractionResult.metadata.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">FCFs Found:</span>{" "}
                      <span className="text-accent-400 font-bold">
                        {extractionResult.fcfs.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FCF list */}
                <div className="panel flex-1">
                  <div className="panel-header">
                    <h3 className="panel-title">Extracted FCFs</h3>
                  </div>
                  <div className="space-y-3">
                    {extractionResult.fcfs.map((item, index) => (
                      <div
                        key={index}
                        onClick={() =>
                          setSelectedFcfIndex(
                            selectedFcfIndex === index ? null : index
                          )
                        }
                        className={cn(
                          "p-4 rounded-lg border cursor-pointer transition-all",
                          selectedFcfIndex === index
                            ? "border-primary-500 bg-primary-500/10"
                            : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-xs font-mono text-slate-400">
                              #{index + 1}
                            </span>
                            <div>
                              <h4 className="font-medium text-slate-200">
                                {item.fcf.name || `FCF ${index + 1}`}
                              </h4>
                              <p className="text-xs text-slate-500 capitalize">
                                {item.fcf.characteristic} -{" "}
                                {item.fcf.featureType || "unspecified"}
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
                        <div className="flex items-center justify-center p-4 bg-slate-950/50 rounded-lg">
                          <FcfPreview fcf={item.fcf} scale={1.2} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected FCF details */}
                {selectedFcf && (
                  <div className="panel">
                    <div className="panel-header">
                      <h3 className="panel-title">FCF Details</h3>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(selectedFcf.fcf, null, 2)
                          );
                        }}
                        className="text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy JSON
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-slate-300 bg-slate-950/50 p-4 rounded-lg overflow-auto max-h-[200px]">
                      {JSON.stringify(selectedFcf.fcf, null, 2)}
                    </pre>
                    <div className="flex items-center gap-2 mt-3">
                      <button className="btn-primary text-sm flex-1">
                        <Plus className="w-4 h-4" />
                        Add to Project
                      </button>
                      <button className="btn-secondary text-sm">
                        <Target className="w-4 h-4" />
                        Open in Builder
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!isProcessing && !extractionResult && (
              <div className="panel flex-1 flex items-center justify-center">
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-400 mb-2">
                    No Image Uploaded
                  </h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Upload an engineering drawing to extract feature control
                    frames using AI-powered image recognition.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
