import { MarketCard } from "@/components/MarketCard";

export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Profile */}
      <div className="flex items-center gap-6 mt-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Your Portfolio
          </h1>
          <p className="text-color-muted text-sm mt-1 mb-3">Track your performance and manage your Creator Keys.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-[#1FC782]/20 to-transparent p-6 rounded-2xl border border-color-border shadow-lg relative overflow-hidden">
             <div className="text-color-muted text-sm mb-1">Total Value</div>
             <div className="text-3xl font-bold text-white">45.50 <span className="text-sm font-normal text-color-muted">SOL</span></div>
             <div className="absolute top-0 right-0 w-24 h-24 bg-color-buy opacity-10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
          </div>
          <div className="bg-gradient-to-br from-[#1FC782]/20 to-transparent p-6 rounded-2xl border border-color-border shadow-lg">
             <div className="text-color-muted text-sm mb-1">Total PnL</div>
             <div className="text-3xl font-bold text-color-buy">+12.4%</div>
          </div>
          <div className="bg-color-card p-6 rounded-2xl border border-color-border shadow-lg">
             <div className="text-color-muted text-sm mb-1">Keys Held</div>
             <div className="text-3xl font-bold text-white">124</div>
          </div>
          <div className="bg-color-card p-6 rounded-2xl border border-color-border shadow-lg">
             <div className="text-color-muted text-sm mb-1">Markets</div>
             <div className="text-3xl font-bold text-white">4</div>
          </div>
      </div>

      <h2 className="text-2xl font-bold text-white mt-4">Your Keys</h2>
      
      {/* Portfolio Holdings */}
      <section className="bg-color-card border border-color-border p-6 rounded-2xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-color-muted border-b border-color-border">
                <th className="pb-4 font-medium">Creator</th>
                <th className="pb-4 font-medium">Balance (Keys)</th>
                <th className="pb-4 font-medium">Avg Cost (SOL)</th>
                <th className="pb-4 font-medium">Current Price (SOL)</th>
                <th className="pb-4 font-medium">Total Value (SOL)</th>
                <th className="pb-4 font-medium">PnL</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {[
                { name: "SolanaWhale", keys: 15, avg: 0.05, current: 0.062, value: 0.93, pnl: "+24%" },
                { name: "DegenTrader", keys: 42, avg: 0.01, current: 0.008, value: 0.336, pnl: "-20%" },
                { name: "AlphaCaller", keys: 10, avg: 0.1, current: 0.15, value: 1.5, pnl: "+50%" },
              ].map((pos, i) => (
                <tr key={i} className="border-b border-color-border/50 hover:bg-white/5 transition-colors">
                  <td className="py-4 font-semibold">{pos.name}</td>
                  <td className="py-4">{pos.keys}</td>
                  <td className="py-4">{pos.avg}</td>
                  <td className="py-4">{pos.current}</td>
                  <td className="py-4 font-medium">{pos.value}</td>
                  <td className={`py-4 font-semibold ${pos.pnl.startsWith('+') ? 'text-color-buy' : 'text-color-sell'}`}>
                    {pos.pnl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
