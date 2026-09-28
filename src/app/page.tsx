import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#090A0C] text-[#E2E4EC] selection:bg-[#FF4D36]/20 selection:text-[#FF4D36]">
      {/* Top Studio Header */}
      <header className="border-b border-[#1C1E24] bg-[#0F1013]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          {/* Brand Mark */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#FF4D36] text-white">
              {/* Shutter / Aperture SVG */}
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg font-bold tracking-tight text-white">
                INSTAFLOW
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#A0A5B5] bg-[#17191F] border border-[#23262E] px-1.5 py-0.5 rounded">
                STUDIO V21.0
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden items-center gap-6 md:flex">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer">
              Publishing Engine
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer">
              Carousel Matrix
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer">
              Telemetry
            </span>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 border border-[#23262E] bg-[#121418] px-2.5 py-1 rounded">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 " />
              <span className="font-mono text-[11px] text-zinc-300">
                META GRAPH LIVE
              </span>
            </div>

            <Link
              href="/auth/login"
              className="text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded bg-[#FF4D36] hover:bg-[#E63A23] px-3.5 py-1.5 text-xs font-medium text-white transition-colors"
            >
              <span>Enter Studio</span>
              <span className="font-mono">→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: Asymmetric Editorial Command Center */}
      <section className="relative overflow-hidden border-b border-[#1C1E24] darkroom-grid py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Typography & Intent */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 border border-[#FF4D36]/30 bg-[#FF4D36]/10 px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider text-[#FF755B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF4D36]" />
                Native Publishing Pipeline // Direct Meta Graph API
              </div>

              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.06]">
                Engineered for the visual momentum of Instagram.
              </h1>

              <p className="mt-5 max-w-xl text-base text-zinc-400 sm:text-lg leading-relaxed">
                A distraction-free publishing workstation for creative directors,
                agencies, and high-velocity social brands. Schedule 4:5 portrait
                drops, chain multi-slide carousel containers, and inspect native Meta
                telemetry — with zero compression loss.
              </p>

              {/* Action Triggers */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/signup"
                  className="flex items-center gap-2 rounded bg-[#FF4D36] hover:bg-[#E63A23] px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  <span>Start Publishing</span>
                  <span className="font-mono text-xs">→</span>
                </Link>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded border border-[#2D313B] bg-[#121418] hover:bg-[#1A1D24] px-5 py-2.5 text-sm font-mono text-xs text-zinc-300 transition-colors"
                >
                  <span>Open Studio Workspace</span>
                </Link>

                <Link
                  href="/auth/login"
                  className="rounded border border-transparent px-4 py-2.5 text-sm font-mono text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Existing Account
                </Link>
              </div>

              {/* Technical Spec Ribbon */}
              <div className="mt-10 border-t border-[#1C1E24] pt-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 font-mono text-[11px]">
                  <div>
                    <span className="block text-zinc-500 uppercase">Aspect Ratios</span>
                    <span className="font-semibold text-zinc-200">4:5 / 9:16 / 1:1</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 uppercase">Container</span>
                    <span className="font-semibold text-zinc-200">Dual-Phase Graph</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 uppercase">API Version</span>
                    <span className="font-semibold text-zinc-200">v21.0 Direct</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 uppercase">Security</span>
                    <span className="font-semibold text-zinc-200">AES-256-GCM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Architectural Studio Post Console */}
            <div className="lg:col-span-5">
              <div className="rounded-lg border border-[#23262E] bg-[#121418] p-4 shadow-xl">
                {/* Console Bar */}
                <div className="flex items-center justify-between border-b border-[#1E2028] pb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#FF4D36]" />
                    <span className="font-semibold text-white">HORIZON DROP 04</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-[#1B1D23] border border-[#282B35] px-1.5 py-0.5 text-[10px] text-zinc-400 uppercase">
                      4:5 Portrait
                    </span>
                    <span className="rounded bg-[#FF4D36]/10 border border-[#FF4D36]/30 px-1.5 py-0.5 text-[10px] text-[#FF755B] uppercase">
                      Scheduled
                    </span>
                  </div>
                </div>

                {/* Viewport Frame with Reticle Marks */}
                <div className="relative mt-3 aspect-[4/5] w-full overflow-hidden rounded border border-[#22252F] bg-[#0A0B0D]">
                  {/* Subtle Viewfinder Reticle */}
                  <div className="absolute inset-4 pointer-events-none border border-dashed border-white/10" />
                  <div className="absolute top-2 left-2 font-mono text-[9px] text-zinc-500 tracking-wider">
                    SAFE-ZONE [4:5]
                  </div>
                  <div className="absolute top-2 right-2 font-mono text-[9px] text-zinc-500">
                    SLIDE 02 / 05
                  </div>

                  {/* Visual Content Representation */}
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <div className="h-16 w-16 rounded border border-[#FF4D36]/40 bg-[#FF4D36]/10 flex items-center justify-center text-[#FF4D36] mb-3">
                      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                    <span className="font-display font-bold text-white text-base tracking-tight">
                      HORIZON DROP // LOOKBOOK
                    </span>
                    <span className="font-mono text-xs text-zinc-400 mt-1">
                      1080 × 1350 px · Color Profile sRGB
                    </span>
                  </div>

                  {/* Slide Navigator Dots */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    <span className="h-1.5 w-4 rounded-full bg-[#FF4D36]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                  </div>
                </div>

                {/* Caption & Metadata Strip */}
                <div className="mt-3 border-t border-[#1E2028] pt-3 text-xs">
                  <p className="text-zinc-300 font-sans text-xs line-clamp-2 leading-relaxed">
                    <span className="font-semibold text-white">@adi78287</span> Precision meets pure aesthetic momentum. Calibrated for creator teams redefining visual velocity.
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1 font-mono text-[10px] text-[#FF755B]">
                    <span>#visualidentity</span>
                    <span>#creativedirector</span>
                    <span>#editorial</span>
                  </div>
                </div>

                {/* Telemetry Metric Pill Row */}
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#1E2028] pt-3 font-mono text-center text-[10px]">
                  <div className="rounded bg-[#16181F] p-1.5 border border-[#23262E]">
                    <span className="block text-zinc-500">Reach</span>
                    <span className="font-semibold text-zinc-200">48.2k</span>
                  </div>
                  <div className="rounded bg-[#16181F] p-1.5 border border-[#23262E]">
                    <span className="block text-zinc-500">Saves</span>
                    <span className="font-semibold text-zinc-200">1,840</span>
                  </div>
                  <div className="rounded bg-[#16181F] p-1.5 border border-[#23262E]">
                    <span className="block text-zinc-500">Rate</span>
                    <span className="font-semibold text-emerald-400">8.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Three-Pillar Matrix */}
      <section className="py-16 md:py-20 border-b border-[#1C1E24]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-[#FF755B]">
                [ SYSTEM ARCHITECTURE ]
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Built strictly to Instagram Graph API specifications.
              </h2>
            </div>
            <span className="font-mono text-xs text-zinc-500">
              ZERO SCRAPING // 100% COMPLIANT PIPELINE
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Flagship Panel: Carousel Chaining Engine (Spans 7 cols on lg, rich visual schematic) */}
            <div className="rounded-lg border border-[#242733] bg-[#12141A] p-7 hover:border-[#323645] transition-all lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#1E212B] pb-3 mb-4">
                  <span className="font-mono text-xs font-semibold text-[#FF755B]">
                    01 // FLAGSHIP ARCHITECTURE: MULTI-SLIDE CONTAINERS
                  </span>
                  <span className="rounded bg-[#1B1D25] border border-[#2B2F3D] px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                    DUAL-PHASE GRAPH API
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-white mb-2">
                  Carousel Container Chaining Engine
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed font-sans max-w-xl">
                  Stage up to 10 portrait or square slides with automatic container binding. Native Meta Graph API v21.0 preserves exact color profiles and framing without downscaling or compression artifacts.
                </p>

                {/* Architectural Schematic Visual */}
                <div className="mt-6 rounded border border-[#1E212B] bg-[#0A0B0E] p-4 font-mono text-xs">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                    PIPELINE SCHEMATIC // CONTAINER CHAIRING WORKFLOW
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="rounded bg-[#14161C] border border-[#232630] p-2">
                      <span className="block text-zinc-400">SLIDE_ITEM_01</span>
                      <span className="font-semibold text-zinc-200">1080×1350 (4:5)</span>
                    </div>
                    <div className="rounded bg-[#14161C] border border-[#232630] p-2">
                      <span className="block text-zinc-400">SLIDE_ITEM_02</span>
                      <span className="font-semibold text-zinc-200">1080×1350 (4:5)</span>
                    </div>
                    <div className="rounded bg-[#FF4D36]/10 border border-[#FF4D36]/30 p-2 text-[#FF755B]">
                      <span className="block">CAROUSEL_ROOT</span>
                      <span className="font-semibold">ID: 18029384</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-[#1E212B] pt-3 font-mono text-[11px] text-zinc-400 flex justify-between">
                <span>ASPECT RATIOS: 4:5 PORTRAIT / 1:1 SQUARE</span>
                <span className="text-emerald-400 font-semibold">100% LOSSLESS SPEC</span>
              </div>
            </div>

            {/* Stacked Complementary Panels (5 cols on lg) */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              {/* Panel 2 */}
              <div className="rounded-lg border border-[#202228] bg-[#111215] p-5 hover:border-[#2D313B] transition-colors flex-1 flex flex-col justify-between">
                <div>
                  <div className="font-mono text-xs text-[#F59E0B] mb-2">02 // TEMPORAL DISPATCH</div>
                  <h3 className="font-display text-base font-bold text-white mb-1.5">
                    Predictive Queue &amp; Guards
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Enforces Meta&apos;s mandatory 10-minute lead time and 75-day scheduling horizon automatically. Cryptographic SHA-256 idempotency prevents accidental duplicate publishing.
                  </p>
                </div>
                <div className="mt-4 border-t border-[#1C1E24] pt-2.5 font-mono text-[10px] text-zinc-500 flex justify-between">
                  <span>DISPATCH: CRON DAEMON</span>
                  <span className="text-amber-400 font-semibold">LEAD-TIME: &gt;10 MIN</span>
                </div>
              </div>

              {/* Panel 3 */}
              <div className="rounded-lg border border-[#202228] bg-[#111215] p-5 hover:border-[#2D313B] transition-colors flex-1 flex flex-col justify-between">
                <div>
                  <div className="font-mono text-xs text-cyan-400 mb-2">03 // DIRECT TELEMETRY</div>
                  <h3 className="font-display text-base font-bold text-white mb-1.5">
                    Native Insights &amp; Webhooks
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Direct-from-source Graph API analytics. Monitor 30-day reach trajectories, organic engagement rates, and story impressions without third-party scrapers or latency.
                  </p>
                </div>
                <div className="mt-4 border-t border-[#1C1E24] pt-2.5 font-mono text-[10px] text-zinc-500 flex justify-between">
                  <span>STATUS: V21.0 LIVE</span>
                  <span className="text-cyan-400 font-semibold">HMAC-SHA256 SIGNED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Architectural Footer */}
      <footer className="py-8 bg-[#090A0C]">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="font-bold text-zinc-300">INSTAFLOW STUDIO</span>
            <span>·</span>
            <span>DIRECT META GRAPH API V21.0</span>
          </div>
          <div>
            <span>SYSTEM STATUS: 100% OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
