import { TradingWidget } from "@/components/TradingWidget";
import { ChartComponent } from "@/components/ChartComponent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatorPage({ params }: PageProps) {
  const { id } = await params;
  
  // Simulated data load
  const marketInfo = {
    pda: id,
    creatorName: "0xHacker",
    description: "Building the next generation of social capital trading. Early supporters will receive exclusive access to my upcoming projects.",
    supply: 1500,
    liquidity: "15.5",
    holders: 142
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-6 border-b border-color-border pb-6">
        <div className="w-24 h-24 bg-color-border border border-color-muted flex items-center justify-center text-color-muted">
          AVATAR
        </div>
        <div>
          <h1 className="text-4xl font-bold text-color-foreground tracking-tight">{marketInfo.creatorName}</h1>
          <p className="text-color-muted font-mono text-sm mt-2">{marketInfo.pda}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <section className="bg-color-card border border-color-border p-6">
            <h2 className="text-xl font-bold mb-4 text-color-buy">[ CHART ]</h2>
            <div className="w-full bg-color-background border border-color-border">
              <ChartComponent marketPda={marketInfo.pda} />
            </div>
          </section>

          <section className="bg-color-card border border-color-border p-6">
            <h2 className="text-xl font-bold mb-4">[ ABOUT ]</h2>
            <p className="text-color-muted leading-relaxed">
              {marketInfo.description}
            </p>
            
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-color-border">
              <div>
                <div className="text-xs text-color-muted mb-1">SUPPLY</div>
                <div className="font-bold text-lg">{marketInfo.supply.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-color-muted mb-1">LIQUIDITY</div>
                <div className="font-bold text-lg">{marketInfo.liquidity} SOL</div>
              </div>
              <div>
                <div className="text-xs text-color-muted mb-1">HOLDERS</div>
                <div className="font-bold text-lg">{marketInfo.holders}</div>
              </div>
            </div>
          </section>
        </div>

        <div>
          <TradingWidget marketPda={marketInfo.pda} />
        </div>
      </div>
    </div>
  );
}
