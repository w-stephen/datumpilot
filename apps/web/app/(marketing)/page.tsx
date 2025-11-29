import Link from "next/link";
import {
  PenTool,
  FileJson,
  ImagePlus,
  Shield,
  Zap,
  Target,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calculator,
} from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="font-mono font-bold text-lg text-slate-100">
              DatumPilot
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/app"
              className="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-sm text-primary-400 mb-8">
              <Sparkles className="w-4 h-4" />
              ASME Y14.5-2018 Compliant
            </div>
            <h1 className="text-5xl md:text-6xl font-mono font-bold text-slate-50 leading-tight mb-6">
              GD&T Interpretation
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
                Made Precise
              </span>
            </h1>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Build, validate, and interpret Feature Control Frames with AI-powered
              assistance. The professional tool for manufacturing engineers and
              quality teams.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/app/builder"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                <PenTool className="w-5 h-5" />
                Start Building FCFs
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/app/image-interpreter"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-200 font-medium rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                <ImagePlus className="w-5 h-5" />
                Extract from Drawing
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Mock app screenshot */}
              <div className="p-6 bg-slate-900">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-error-500" />
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {/* Builder panel mock */}
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h3 className="text-sm font-mono text-slate-400 mb-4">
                      FCF Builder
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                          <span className="text-xl text-primary-400">&#x2295;</span>
                        </div>
                        <span className="text-slate-300">Position</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-success-500/20 flex items-center justify-center">
                          <span className="text-xl text-success-400">&#x23E5;</span>
                        </div>
                        <span className="text-slate-300">Flatness</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                          <span className="text-xl text-accent-400">&#x22A5;</span>
                        </div>
                        <span className="text-slate-300">Perpendicularity</span>
                      </div>
                    </div>
                  </div>
                  {/* Preview mock */}
                  <div className="bg-slate-950 rounded-lg p-4 flex items-center justify-center">
                    <svg viewBox="0 0 200 50" className="w-full max-w-xs">
                      <rect
                        x="10"
                        y="10"
                        width="180"
                        height="30"
                        fill="#1A2332"
                        stroke="#334155"
                        strokeWidth="2"
                        rx="2"
                      />
                      <rect x="10" y="10" width="35" height="30" fill="transparent" stroke="#334155" />
                      <text x="27" y="30" textAnchor="middle" fill="#3B82F6" fontSize="18" fontFamily="monospace">&#x2295;</text>
                      <rect x="45" y="10" width="55" height="30" fill="transparent" stroke="#334155" />
                      <text x="72" y="30" textAnchor="middle" fill="#F8FAFC" fontSize="12" fontFamily="monospace">&#x2300;0.250</text>
                      <rect x="100" y="10" width="30" height="30" fill="transparent" stroke="#334155" />
                      <text x="115" y="30" textAnchor="middle" fill="#00D4AA" fontSize="14" fontWeight="bold" fontFamily="monospace">A</text>
                      <rect x="130" y="10" width="30" height="30" fill="transparent" stroke="#334155" />
                      <text x="145" y="30" textAnchor="middle" fill="#00D4AA" fontSize="14" fontWeight="bold" fontFamily="monospace">B</text>
                      <rect x="160" y="10" width="30" height="30" fill="transparent" stroke="#334155" />
                      <text x="175" y="30" textAnchor="middle" fill="#00D4AA" fontSize="14" fontWeight="bold" fontFamily="monospace">C</text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-mono font-bold text-slate-50 mb-4">
              Everything You Need for GD&T
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Professional-grade tools for building, validating, and interpreting
              Feature Control Frames
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: PenTool,
                title: "FCF Builder",
                description:
                  "Build feature control frames with an intuitive visual interface and live ASME Y14.5 validation",
                color: "primary",
              },
              {
                icon: FileJson,
                title: "JSON Interpreter",
                description:
                  "Import FCF data from JSON and get instant validation, calculations, and AI explanations",
                color: "success",
              },
              {
                icon: ImagePlus,
                title: "Image Extraction",
                description:
                  "Upload engineering drawings and extract FCF data automatically using AI vision",
                color: "purple",
              },
              {
                icon: Calculator,
                title: "Tolerance Calculator",
                description:
                  "Calculate bonus tolerances, virtual conditions, and available tolerances automatically",
                color: "accent",
              },
              {
                icon: Shield,
                title: "ASME Validation",
                description:
                  "30+ validation rules based on ASME Y14.5-2018 standard with detailed error messages",
                color: "warning",
              },
              {
                icon: Sparkles,
                title: "AI Explanations",
                description:
                  "Get plain-language explanations of what each FCF means and how to interpret it",
                color: "primary",
              },
            ].map((feature, index) => {
              const colorClasses = {
                primary: "text-primary-500 bg-primary-500/10",
                success: "text-success-500 bg-success-500/10",
                purple: "text-purple-500 bg-purple-500/10",
                accent: "text-accent-500 bg-accent-500/10",
                warning: "text-warning-500 bg-warning-500/10",
              };
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[feature.color as keyof typeof colorClasses]}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-mono font-semibold text-slate-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-mono font-bold text-slate-50 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              From drawing to validated FCF in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Input Your FCF",
                description:
                  "Build visually, paste JSON, or upload a drawing image",
              },
              {
                step: "02",
                title: "Validate & Calculate",
                description:
                  "Get instant ASME Y14.5 validation and tolerance calculations",
              },
              {
                step: "03",
                title: "Interpret & Export",
                description:
                  "Read AI explanations and export validated FCF JSON",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-7xl font-mono font-bold text-slate-800 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-mono font-semibold text-slate-100 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-400">{item.description}</p>
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-12 -right-4 w-8 h-8 text-slate-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-mono font-bold text-slate-50 mb-4">
              Trusted by Engineers
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "DatumPilot has dramatically reduced our FCF review time. The validation catches issues before they reach the shop floor.",
                name: "Sarah Chen",
                title: "Quality Engineer, Aerospace Corp",
              },
              {
                quote:
                  "The image extraction feature is a game-changer. We can digitize legacy drawings in minutes instead of hours.",
                name: "Mike Rodriguez",
                title: "Manufacturing Lead, Auto Parts Inc",
              },
              {
                quote:
                  "Finally a tool that speaks GD&T fluently. The AI explanations help our newer engineers learn faster.",
                name: "Dr. James Park",
                title: "Director of Quality, Medical Devices Co",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6"
              >
                <p className="text-slate-300 mb-6 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="font-medium text-slate-100">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-mono font-bold text-slate-50 mb-4">
            Ready to Streamline Your GD&T Workflow?
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            Start building and validating Feature Control Frames in minutes.
            No credit card required.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="font-mono font-bold text-slate-400">
                DatumPilot
              </span>
            </div>
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} DatumPilot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
