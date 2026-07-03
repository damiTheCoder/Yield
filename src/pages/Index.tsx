import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Index() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/landing.png')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/55 to-transparent" aria-hidden="true" />

      <section className="page-content-enter relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-7 pb-9 pt-8 sm:max-w-lg sm:px-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-left"
            aria-label="Solaris home"
          >
            <img src="/h4.png" alt="" className="h-9 w-9 rounded-full object-cover" />
            <span className="text-xl font-black tracking-[-0.04em]">Solaris</span>
          </button>
          <Button
            type="button"
            onClick={() => navigate("/assets")}
            className="h-10 rounded-2xl border-0 bg-white/14 px-4 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20"
          >
            Launch App
          </Button>
        </div>

        <div className="mt-auto space-y-6 text-center">
          <div className="space-y-3">
            <h1 className="text-[3rem] font-black leading-[0.92] tracking-[-0.075em] text-white sm:text-[4.25rem]">
              Non-extractive Tokens,
              <span className="block">Real Liquidity.</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-base font-semibold text-white/92">
              <span>Built and powered by</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 backdrop-blur-md">
                <span className="h-3 w-3 rounded-full bg-[#0052FF]" />
                <span className="font-black tracking-[-0.04em]">base</span>
              </span>
            </div>
            <p className="mx-auto max-w-sm text-lg font-semibold leading-snug tracking-[-0.035em] text-white/78">
              Trade liquidity-backed assets with guaranteed floors, transparent cycles, and creator-aligned rewards.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => navigate("/assets")}
              className="h-14 w-full rounded-2xl border-0 bg-[#1795FF] text-base font-bold text-white shadow-none hover:bg-[#0D83EA]"
            >
              Launch App
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/blog/liquidity-funded-tokens")}
              className="h-14 w-full rounded-2xl border-0 bg-black/72 text-base font-bold text-white shadow-none backdrop-blur-md hover:bg-black/82"
            >
              Learn more
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
