import { MarketCard, Market } from "@/components/MarketCard";

// Dummy data for testing UI before connecting to API
const DUMMY_MARKETS: Market[] = [
  {
    id: "1",
    marketPda: "Market1111111111111111111111111111111111111",
    creatorId: "CreatorA",
    supply: 1500,
    reserveLamports: 15_000_000_000,
    totalVolumeLamports: "45000000000",
    username: "0xHacker",
  },
  {
    id: "2",
    marketPda: "Market2222222222222222222222222222222222222",
    creatorId: "CreatorB",
    supply: 50,
    reserveLamports: 2_000_000_000,
    totalVolumeLamports: "3000000000",
    username: "DegenKing",
  },
  {
    id: "3",
    marketPda: "Market3333333333333333333333333333333333333",
    creatorId: "CreatorC",
    supply: 12000,
    reserveLamports: 85_000_000_000,
    totalVolumeLamports: "250000000000",
    username: "SolanaWhale",
  }
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="flex items-center justify-between border-b border-color-border pb-4 mb-6">
          <h1 className="text-2xl font-bold text-color-buy tracking-tight">[ TRENDING MARKETS ]</h1>
          <span className="text-color-muted text-sm blink">LIVE UPDATE_</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DUMMY_MARKETS.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between border-b border-color-border pb-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">[ NEW CREATORS ]</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
          {DUMMY_MARKETS.map((market) => (
            <MarketCard key={market.id + "new"} market={{...market, totalVolumeLamports: "0", supply: 0, reserveLamports: 0}} />
          ))}
        </div>
      </section>
    </div>
  );
}
