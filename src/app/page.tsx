import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans bg-gradient-to-b from-[#1B0B2E] via-[#2a0e48] to-[#3b0b32] text-white">
      {/* Floating festive emojis for subtle motion */}
      <div className="pointer-events-none absolute inset-0 select-none opacity-60">
        <div className="absolute left-[8%] top-[12%] text-3xl animate-bounce">🪔</div>
        <div className="absolute left-[78%] top-[18%] text-2xl animate-pulse">✨</div>
        <div className="absolute left-[18%] top-[58%] text-3xl animate-bounce [animation-delay:200ms]">🪔</div>
        <div className="absolute left-[65%] top-[68%] text-2xl animate-pulse [animation-delay:400ms]">✨</div>
        <div className="absolute left-[40%] top-[30%] text-3xl animate-bounce [animation-delay:600ms]">🪔</div>
        <div className="absolute left-[88%] top-[72%] text-2xl animate-pulse [animation-delay:800ms]">✨</div>
      </div>

      {/* Soft radial glow behind the content */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.20)_0%,rgba(0,0,0,0)_60%)]" />

      {/* Fireworks background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 fireworks">
        <div className="firework" style={{ top: "18%", left: "20%", animationDelay: "0s" }} />
        <div className="firework" style={{ top: "30%", left: "75%", animationDelay: ".3s" }} />
        <div className="firework" style={{ top: "58%", left: "15%", animationDelay: ".6s" }} />
        <div className="firework" style={{ top: "68%", left: "60%", animationDelay: ".9s" }} />
        <div className="firework" style={{ top: "40%", left: "42%", animationDelay: "1.2s" }} />
        <div className="firework" style={{ top: "72%", left: "88%", animationDelay: "1.5s" }} />
      </div>

      <main className="relative z-10 mx-auto grid max-w-5xl grid-rows-[auto_auto_1fr] items-center gap-8 p-8 sm:p-16">
        {/* Header / Logo */}
        <div className="flex w-full flex-col items-center justify-center gap-4 text-center">
          <Image
            src="/gq-logo.png"
            alt="GQ United CC logo"
            width={180}
            height={38}
            priority
            className="drop-shadow-[0_0_18px_rgba(255,215,0,0.35)]"
          />

          <h1 className="bg-gradient-to-r from-amber-200 via-yellow-300 to-rose-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow sm:text-5xl">
             Diwali 2025 Celebration @ GQ
          </h1>
          <p className="max-w-2xl text-balance text-sm/6 text-amber-100/90 sm:text-base">
            Let the lights, laughter, and mithai fill the night. Celebrate with us at the Diwali party hosted by GQ United CC.
          </p>
        </div>

        {/* Celebration Card */}
        <section className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-400/20 to-fuchsia-500/20 px-4 py-2 text-amber-200 shadow-[0_0_30px_rgba(255,215,0,0.15)] ring-1 ring-white/10">
              <span className="text-xl">🪔</span>
              <span className="font-semibold tracking-wide">Welcome to the Celebration Night</span>
              <span className="text-xl">✨</span>
            </div>

            <ul className="grid w-full gap-3 font-mono text-sm/6 text-amber-100/95 sm:grid-cols-2">
              <li className="">
                Presented by <span className="font-semibold text-amber-300">GQ United CC</span>
              </li>
              <li className="">
                Music, lights, food, and festive vibes
              </li>
              
            </ul>
          </div>
        </section>

        {/* Sponsors grid */}
        <section className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
          <h2 className="mb-4 bg-gradient-to-r from-amber-200 to-rose-200 bg-clip-text text-center text-2xl font-bold tracking-tight text-transparent sm:text-left">
            Special Thanks to 
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            
               <div
                className="flex items-center justify-center rounded-xl bg-black/25 p-4 ring-1 ring-white/10 transition hover:bg-black/35"
                title="Greenford Quay"
              >
                <Image
                  src="/sponsors/gq-event-logo-white.svg"
                  alt="Greenford Quay logo"
                  
                  width={180}
                  height={60}
                  className="h-[42px] w-auto opacity-95 drop-shadow-[0_0_10px_rgba(255,215,0,0.15)] sm:h-[56px]"
                />
              </div>
              
              <div
                className="flex items-center justify-center rounded-xl bg-[#81ea6e] p-4 ring-1 ring-white/10 transition hover:bg-[#72de62]" 
                title="Kiosk"
              >
                <Image
                  src="/sponsors/kiosk-logo.svg"
                  alt="Kiosk logo"
                  
                  width={180}
                  height={60}
                  className="h-[42px] w-auto opacity-95 drop-shadow-[0_0_10px_rgba(255,215,0,0.15)] sm:h-[56px]"
                />
              </div>
            
          </div>
        </section>

        {/* Footer tagline */}
        <div className="mx-auto mt-2 flex items-center justify-center gap-3 text-center text-amber-200/90">
          <span className="text-xl">🪔</span>
          <span className="text-sm tracking-wide sm:text-base">Shubh Deepavali — May your life be filled with light</span>
          <span className="text-xl">🪔</span>
        </div>
      </main>
    </div>
    
  );
}
