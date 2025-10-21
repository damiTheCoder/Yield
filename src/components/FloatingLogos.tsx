import React from "react";

const names: { id: string; label: string; className?: string }[] = [
  { id: "bitcoin", label: "Bitcoin", className: "text-slate-400" },
  { id: "ethereum", label: "Ethereum", className: "text-slate-400" },
  { id: "solana", label: "Solana", className: "text-slate-400" },
  { id: "base", label: "Base", className: "text-slate-400" },
  { id: "optimum", label: "Optimum", className: "text-slate-400" },
];

export default function FloatingLogos() {
  return (
    <div className="relative z-10 -mt-6 w-full select-none">
      <div className="mx-auto max-w-6xl overflow-hidden px-6 py-4">
        <div className="pointer-events-none relative -mx-4 overflow-hidden">
          <div className="flex w-[200%] items-center gap-12 animate-marquee">
            {names.concat(names).map((n, i) => (
              <div key={`name-${i}`} className="flex items-center justify-center min-w-[160px] md:min-w-[220px]">
                <span aria-hidden="true" className={`${n.className ?? "text-white"} text-lg md:text-xl uppercase tracking-wider`}>
                  {n.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
