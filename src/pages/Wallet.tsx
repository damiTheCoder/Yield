import { Copy, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Wallet() {
  const { toast } = useToast();
  const walletAddress = "0xc1...677d";

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText("0xc10000000000000000000000000000000000677d");
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy the wallet address.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 pb-10 pt-3 sm:pt-6">
        <div className="space-y-4">
          <section className="rounded-2xl bg-[#F3F4F6] p-5 dark:bg-[#171A22] sm:rounded-3xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <img src="/r1.jpeg" alt="" className="h-16 w-16 rounded-full object-cover" />
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
                    grimfit86454
                  </h1>
                  <button className="mt-1 text-left text-xl font-bold tracking-[-0.04em] text-red-500 hover:text-red-400">
                    Disconnect
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={copyAddress}
                className="flex shrink-0 items-center gap-2 text-xl font-semibold tracking-[-0.04em] text-muted-foreground sm:text-2xl"
                aria-label="Copy wallet address"
              >
                <span>{walletAddress}</span>
                <Copy className="h-6 w-6" />
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-[#F3F4F6] p-5 dark:bg-[#171A22] sm:rounded-3xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xl font-semibold tracking-[-0.04em] text-muted-foreground sm:text-2xl">
                  Trading Balance
                </p>
                <p className="mt-5 font-mono text-3xl font-black tracking-[-0.05em] text-foreground sm:text-4xl">
                  0.00 USDC
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Button
                  type="button"
                  size="icon"
                  className="h-16 w-16 rounded-xl border-0 bg-[#E6E8EE] text-foreground hover:bg-[#DDE1EA] dark:bg-[#262A34] dark:hover:bg-[#303642]"
                  aria-label="Add funds"
                >
                  <Plus className="h-8 w-8" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  className="h-16 w-16 rounded-xl border-0 bg-[#E6E8EE] text-foreground hover:bg-[#DDE1EA] dark:bg-[#262A34] dark:hover:bg-[#303642]"
                  aria-label="Withdraw funds"
                >
                  <Minus className="h-8 w-8" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
