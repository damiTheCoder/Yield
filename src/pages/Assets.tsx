import Header from "@/components/Header";
import { useApp } from "@/lib/app-state";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyK } from "@/lib/utils";
import { useEffect, useRef } from "react";

export default function Assets() {
  const { assets } = useApp();
  const navigate = useNavigate();
  const headerScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const headerEl = headerScrollRef.current;
    if (!headerEl) return;
    const sync = (source: HTMLElement) => {
      const others = document.querySelectorAll<HTMLElement>(".mobile-trailing");
      others.forEach((el) => {
        if (el !== source) el.scrollLeft = source.scrollLeft;
      });
    };
    const onHeaderScroll = () => sync(headerEl);
    headerEl.addEventListener("scroll", onHeaderScroll, { passive: true });

    const rowEls = document.querySelectorAll<HTMLElement>(".mobile-trailing");
    const onRowScroll = (e: Event) => sync(e.currentTarget as HTMLElement);
    rowEls.forEach((el) => el.addEventListener("scroll", onRowScroll, { passive: true }));

    return () => {
      headerEl.removeEventListener("scroll", onHeaderScroll);
      rowEls.forEach((el) => el.removeEventListener("scroll", onRowScroll));
    };
  }, [assets.length]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 pt-4 pb-6 space-y-6">
        <h1 className="text-3xl font-bold">Assets</h1>
        {/* Desktop/tablet table */}
        <div className="rounded-md border border-border/40 bg-surface overflow-x-auto hidden md:block">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Collection</TableHead>
                <TableHead className="text-center">Backing</TableHead>
                <TableHead className="text-center">Current</TableHead>
                <TableHead className="text-center">LPU</TableHead>
                <TableHead className="text-center">CoinTag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((a) => (
                <TableRow
                  key={a.id}
                  className="cursor-pointer [&>td]:py-5"
                  onClick={() => navigate(`/assets/${a.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <img src={a.image} alt={a.name} className="h-8 w-8 rounded" />
                      <span>{a.name}</span>
                      <img src="/checklist.png" alt="verified" className="h-4 w-4 opacity-80" />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-center">{formatCurrencyK(a.params.initialReserve)}</TableCell>
                  <TableCell className="font-mono text-center">{formatCurrencyK(a.cycle.reserve)}</TableCell>
                  <TableCell className="font-mono text-center">${a.cycle.lpu.toFixed(6)}</TableCell>
                  <TableCell className="font-mono text-center">$1.00</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden">
          <div className="grid grid-cols-[1fr_auto_auto] items-center px-2 pb-3 text-[12px] uppercase tracking-wide text-muted-foreground">
            <div>Collection</div>
            <div className="text-right w-28">Current</div>
            <div className="text-right w-24">CoinTag</div>
          </div>
          <div className="flex flex-col gap-5">
            {assets.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/assets/${a.id}`)}
                className="grid grid-cols-[1fr_auto_auto] items-start gap-3 px-2 py-3 text-left text-base"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={a.image} alt={a.name} className="h-8 w-8 rounded" />
                  <div className="flex items-center gap-1 font-medium leading-tight min-h-[1.5rem]">
                    <span className="truncate max-w-[12ch]">{a.name}</span>
                    <img src="/checklist.png" alt="verified" className="h-3.5 w-3.5 opacity-80 flex-shrink-0" />
                  </div>
                </div>
                <div className="text-right w-28 font-mono text-base tabular-nums self-center">{formatCurrencyK(a.cycle.reserve)}</div>
                <div className="text-right w-24 font-mono text-base tabular-nums self-center">$1.00</div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
