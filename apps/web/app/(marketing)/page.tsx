"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PenTool,
  FileJson,
  ImagePlus,
  Shield,
  Target,
  ArrowRight,
  Sparkles,
  Calculator,
  Crosshair,
  Ruler,
  Grid3X3,
  ChevronRight,
} from "lucide-react";

// Animated grid background component
function BlueprintGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00D4AA 1px, transparent 1px),
            linear-gradient(to bottom, #00D4AA 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Fine grid */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00D4AA 1px, transparent 1px),
            linear-gradient(to bottom, #00D4AA 1px, transparent 1px)
          `,
          backgroundSize: '12px 12px',
        }}
      />
      {/* Radial fade */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, transparent 0%, #0A0F14 70%)',
        }}
      />
    </div>
  );
}

// Animated measurement line
function MeasurementLine({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="absolute h-px bg-gradient-to-r from-transparent via-accent-500/40 to-transparent animate-pulse"
      style={{
        animationDelay: `${delay}ms`,
        width: '200px',
      }}
    />
  );
}

// Technical corner decoration
function TechnicalCorner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const positionClasses = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0 rotate-90',
    bl: 'bottom-0 left-0 -rotate-90',
    br: 'bottom-0 right-0 rotate-180',
  };

  return (
    <div className={`absolute ${positionClasses[position]} w-8 h-8 opacity-20`}>
      <svg viewBox="0 0 32 32" className="w-full h-full text-accent-500">
        <path d="M0 8 L0 0 L8 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="2" fill="currentColor" />
      </svg>
    </div>
  );
}

// Animated counter component
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}{suffix}</span>;
}

// Feature card with technical styling
function FeatureCard({
  icon: Icon,
  title,
  description,
  index
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <div
      className="group relative bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 p-6 hover:border-accent-500/30 transition-all duration-500"
      style={{
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-700 group-hover:border-accent-500/50 transition-colors" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-700 group-hover:border-accent-500/50 transition-colors" />

      {/* Index number */}
      <div className="absolute top-3 right-4 font-mono text-xs text-slate-700 group-hover:text-accent-500/50 transition-colors">
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className="relative">
        <div className="w-12 h-12 rounded border border-slate-700 bg-slate-800/50 flex items-center justify-center mb-4 group-hover:border-accent-500/50 group-hover:bg-accent-500/5 transition-all duration-300">
          <Icon className="w-5 h-5 text-slate-400 group-hover:text-accent-500 transition-colors" />
        </div>
        <h3 className="font-mono text-lg font-semibold text-slate-100 mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F14] text-slate-100 overflow-hidden">
      <BlueprintGrid />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-[#0A0F14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded border border-slate-700 bg-slate-900 flex items-center justify-center group-hover:border-accent-500/50 transition-colors">
              <Crosshair className="w-5 h-5 text-accent-500" />
              <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-accent-500/50" />
              <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-accent-500/50" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono font-bold text-sm tracking-wider text-slate-100">
                DATUMPILOT
              </span>
              <span className="font-mono text-[10px] text-slate-500 tracking-widest">
                GD&T PRECISION
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-8">
            <Link href="#features" className="font-mono text-xs text-slate-400 hover:text-accent-500 transition-colors tracking-wide">
              FEATURES
            </Link>
            <Link href="#process" className="font-mono text-xs text-slate-400 hover:text-accent-500 transition-colors tracking-wide">
              PROCESS
            </Link>
            <Link
              href="/app"
              className="relative font-mono text-xs font-medium px-5 py-2.5 bg-accent-500 text-slate-950 hover:bg-accent-400 transition-colors tracking-wide"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
              }}
            >
              LAUNCH APP
              <ChevronRight className="inline w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className={`space-y-8 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-accent-500/30 bg-accent-500/5 font-mono text-xs text-accent-500 tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
                ASME Y14.5-2018 COMPLIANT
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h1 className="font-mono text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                  <span className="text-slate-100">PRECISION</span>
                  <br />
                  <span className="text-slate-100">GD&T</span>
                  <br />
                  <span className="relative inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-cyan-300">
                      INTERPRETATION
                    </span>
                    <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-accent-500 to-transparent" />
                  </span>
                </h1>
              </div>

              {/* Description */}
              <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                Build, validate, and interpret Feature Control Frames with AI-powered precision.
                The definitive tool for manufacturing engineers and quality teams.
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-4 pt-4">
                <Link
                  href="/app/builder"
                  className="group relative inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-slate-950 font-mono text-sm font-semibold hover:bg-accent-400 transition-all"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                  }}
                >
                  <PenTool className="w-4 h-4" />
                  START BUILDING
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/app/image-interpreter"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 font-mono text-sm font-medium hover:border-slate-600 hover:text-slate-100 transition-all"
                >
                  <ImagePlus className="w-4 h-4" />
                  EXTRACT FROM DRAWING
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-8 pt-8 border-t border-slate-800/50">
                {[
                  { value: 30, suffix: '+', label: 'Validation Rules' },
                  { value: 98, suffix: '%', label: 'Accuracy Rate' },
                  { value: 4, suffix: '', label: 'Characteristics' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="font-mono text-2xl font-bold text-accent-500">
                      {mounted && <AnimatedNumber target={stat.value} suffix={stat.suffix} />}
                    </div>
                    <div className="font-mono text-xs text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - FCF Preview */}
            <div className={`relative ${mounted ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
              {/* Technical frame */}
              <div className="relative bg-slate-900/60 backdrop-blur border border-slate-800 p-8">
                <TechnicalCorner position="tl" />
                <TechnicalCorner position="tr" />
                <TechnicalCorner position="bl" />
                <TechnicalCorner position="br" />

                {/* Label */}
                <div className="absolute -top-3 left-6 px-2 bg-[#0A0F14] font-mono text-xs text-slate-500 tracking-wider">
                  FEATURE CONTROL FRAME
                </div>

                {/* FCF Visualization */}
                <div className="relative py-8">
                  <svg viewBox="0 0 400 80" className="w-full">
                    {/* Main frame */}
                    <rect x="20" y="15" width="360" height="50" fill="#0D1117" stroke="#1E293B" strokeWidth="2" />

                    {/* Dividers */}
                    <line x1="80" y1="15" x2="80" y2="65" stroke="#1E293B" strokeWidth="2" />
                    <line x1="180" y1="15" x2="180" y2="65" stroke="#1E293B" strokeWidth="2" />
                    <line x1="250" y1="15" x2="250" y2="65" stroke="#1E293B" strokeWidth="2" />
                    <line x1="310" y1="15" x2="310" y2="65" stroke="#1E293B" strokeWidth="2" />

                    {/* Position symbol */}
                    <circle cx="50" cy="40" r="12" fill="none" stroke="#3B82F6" strokeWidth="2" />
                    <line x1="50" y1="28" x2="50" y2="52" stroke="#3B82F6" strokeWidth="2" />
                    <line x1="38" y1="40" x2="62" y2="40" stroke="#3B82F6" strokeWidth="2" />

                    {/* Tolerance */}
                    <text x="130" y="46" textAnchor="middle" fill="#F8FAFC" fontSize="16" fontFamily="monospace" fontWeight="600">
                      ⌀0.250
                    </text>

                    {/* Datum references */}
                    <text x="215" y="46" textAnchor="middle" fill="#00D4AA" fontSize="18" fontFamily="monospace" fontWeight="bold">A</text>
                    <text x="280" y="46" textAnchor="middle" fill="#00D4AA" fontSize="18" fontFamily="monospace" fontWeight="bold">B</text>
                    <text x="345" y="46" textAnchor="middle" fill="#00D4AA" fontSize="18" fontFamily="monospace" fontWeight="bold">C</text>

                    {/* MMC modifier */}
                    <circle cx="163" cy="40" r="6" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                    <text x="163" y="44" textAnchor="middle" fill="#F59E0B" fontSize="10" fontFamily="monospace" fontWeight="bold">M</text>
                  </svg>

                  {/* Annotation lines */}
                  <div className="absolute top-0 left-[12%] flex flex-col items-center opacity-50">
                    <div className="w-px h-4 bg-slate-600" />
                    <span className="font-mono text-[10px] text-slate-500 mt-1">SYM</span>
                  </div>
                  <div className="absolute top-0 left-[32%] flex flex-col items-center opacity-50">
                    <div className="w-px h-4 bg-slate-600" />
                    <span className="font-mono text-[10px] text-slate-500 mt-1">TOL</span>
                  </div>
                  <div className="absolute top-0 left-[68%] flex flex-col items-center opacity-50">
                    <div className="w-px h-4 bg-slate-600" />
                    <span className="font-mono text-[10px] text-slate-500 mt-1">DATUM REF</span>
                  </div>
                </div>

                {/* Info bar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success-500" />
                      <span className="font-mono text-xs text-slate-400">VALID</span>
                    </div>
                    <div className="font-mono text-xs text-slate-500">
                      Position @ MMC
                    </div>
                  </div>
                  <div className="font-mono text-xs text-slate-600">
                    REF: ASME Y14.5-2018 §7.2
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 border border-accent-500/20 bg-accent-500/5 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="font-mono text-2xl font-bold text-accent-500">⊕</div>
                  <div className="font-mono text-[10px] text-slate-500 mt-1">POSITION</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-accent-500" />
              <span className="font-mono text-xs text-accent-500 tracking-widest">01</span>
            </div>
            <h2 className="font-mono text-3xl font-bold tracking-tight">CAPABILITIES</h2>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: PenTool,
                title: "FCF Builder",
                description: "Build feature control frames with an intuitive visual interface and live ASME Y14.5-2018 validation feedback.",
              },
              {
                icon: FileJson,
                title: "JSON Interpreter",
                description: "Import FCF data from JSON format and get instant validation, tolerance calculations, and AI explanations.",
              },
              {
                icon: ImagePlus,
                title: "Image Extraction",
                description: "Upload engineering drawings and extract FCF data automatically using advanced AI vision processing.",
              },
              {
                icon: Calculator,
                title: "Tolerance Calculator",
                description: "Calculate bonus tolerances, virtual conditions, and available tolerances with precision accuracy.",
              },
              {
                icon: Shield,
                title: "ASME Validation",
                description: "30+ validation rules based on ASME Y14.5-2018 standard with detailed error messages and suggestions.",
              },
              {
                icon: Sparkles,
                title: "AI Explanations",
                description: "Get plain-language explanations of what each FCF means and how to interpret it correctly.",
              },
            ].map((feature, index) => (
              <FeatureCard key={index} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="relative py-24 px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="flex items-center gap-4 mb-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-px bg-accent-500" />
              <span className="font-mono text-xs text-accent-500 tracking-widest">02</span>
            </div>
            <h2 className="font-mono text-3xl font-bold tracking-tight">PROCESS</h2>
          </div>

          {/* Process steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "INPUT",
                description: "Build visually, paste JSON, or upload engineering drawings",
                icon: Grid3X3,
              },
              {
                step: "02",
                title: "VALIDATE",
                description: "Instant ASME Y14.5 validation and tolerance calculations",
                icon: Shield,
              },
              {
                step: "03",
                title: "INTERPRET",
                description: "AI-powered explanations and validated JSON export",
                icon: Sparkles,
              },
            ].map((item, index) => (
              <div key={index} className="relative group">
                {/* Connection line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-slate-700 to-transparent z-0" />
                )}

                <div className="relative bg-[#0A0F14] border border-slate-800 p-8 group-hover:border-accent-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-6">
                    <div className="font-mono text-5xl font-bold text-slate-800 group-hover:text-accent-500/20 transition-colors">
                      {item.step}
                    </div>
                    <item.icon className="w-6 h-6 text-slate-600 group-hover:text-accent-500 transition-colors" />
                  </div>
                  <h3 className="font-mono text-xl font-semibold text-slate-100 mb-3 tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative inline-block mb-8">
            <Crosshair className="w-16 h-16 text-accent-500/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-accent-500 animate-ping" />
            </div>
          </div>

          <h2 className="font-mono text-4xl font-bold tracking-tight mb-6">
            READY TO BEGIN?
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            Start building and validating Feature Control Frames with precision.
            No credit card required.
          </p>

          <Link
            href="/app"
            className="inline-flex items-center gap-3 px-8 py-4 bg-accent-500 text-slate-950 font-mono text-sm font-bold hover:bg-accent-400 transition-colors tracking-wide"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
            }}
          >
            LAUNCH DATUMPILOT
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-6 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crosshair className="w-5 h-5 text-slate-600" />
              <span className="font-mono text-sm text-slate-500 tracking-wider">DATUMPILOT</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="font-mono text-xs text-slate-600">
                ASME Y14.5-2018
              </span>
              <span className="font-mono text-xs text-slate-600">
                © {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
