import { Button } from "@/components/ui/button";

const BlockchainSelector = () => {
  const blockchains = [
    { name: "All", icon: "🌐", active: true },
    { name: "Ethereum", icon: "⟠", active: false },
    { name: "Base", icon: "🔵", active: false },
    { name: "MegaETH", icon: "⚡", active: false },
    { name: "Camp", icon: "🏕️", active: false },
    { name: "RARI", icon: "💎", active: false },
    { name: "Somnia", icon: "🌙", active: false },
    { name: "HyperEVM", icon: "⚡", active: false }
  ];

  return (
    <section className="py-8 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
          {blockchains.map((blockchain, index) => (
            <Button
              key={index}
              variant={blockchain.active ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <span className="text-base">{blockchain.icon}</span>
              {blockchain.name}
            </Button>
          ))}
          <Button variant="ghost" size="sm">
            More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BlockchainSelector;