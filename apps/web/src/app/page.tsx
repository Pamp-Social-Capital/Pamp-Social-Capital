import { MarketCard, Market } from "@/components/MarketCard";
import Link from "next/link";

// Dummy data for testing UI before connecting to API
const DUMMY_MARKETS = [
  {
    id: "m1",
    marketPda: "Market1111111111111111111111111111111111111",
    creatorId: "12345",
    supply: 25000,
    reserveLamports: 15500000000,
    totalVolumeLamports: "45000000000",
    currentPriceLamports: "620000",
    marketCapLamports: "15500000000",
    holderCount: 142,
    creatorFeeBps: 500,
    username: "SolanaWhale",
  },
  {
    id: "m2",
    marketPda: "Market2222222222222222222222222222222222222",
    creatorId: "67890",
    supply: 12000,
    reserveLamports: 8200000000,
    totalVolumeLamports: "12000000000",
    currentPriceLamports: "680000",
    marketCapLamports: "8160000000",
    holderCount: 89,
    creatorFeeBps: 200,
    username: "DegenTrader",
  },
  {
    id: "m3",
    marketPda: "Market3333333333333333333333333333333333333",
    creatorId: "13579",
    supply: 80000,
    reserveLamports: 42000000000,
    totalVolumeLamports: "150000000000",
    currentPriceLamports: "525000",
    marketCapLamports: "42000000000",
    holderCount: 412,
    creatorFeeBps: 750,
    username: "AlphaCaller",
  }
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Hero Section */}
      <section className="mt-6">
        <div className="w-full bg-gradient-to-r from-[#0f1d17] to-[#161A22] rounded-2xl border border-color-border p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-color-buy opacity-10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="z-10">
            <h1 className="text-3xl font-bold text-white mb-2">Social Capital Hub</h1>
            <p className="text-color-muted max-w-xl text-sm mb-8">
              Discover top creators, trade keys on the bonding curve, and build your portfolio in one seamless hub.
            </p>
            
            <div className="flex gap-12">
              <div>
                <p className="text-color-muted text-xs mb-1">Total TVL</p>
                <p className="text-2xl font-bold text-white">45,250.55 <span className="text-sm font-normal text-color-muted">SOL</span></p>
              </div>
              <div>
                <p className="text-color-muted text-xs mb-1">24h Volume</p>
                <p className="text-2xl font-bold text-white">12,430.00 <span className="text-sm font-normal text-color-muted">SOL</span></p>
              </div>
              <div>
                <p className="text-color-muted text-xs mb-1">Total Markets</p>
                <p className="text-2xl font-bold text-white">1,205</p>
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0 z-10 flex flex-col sm:flex-row gap-4">
            <button className="bg-white text-[#0B0E14] font-semibold px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors">
              Explore Markets
            </button>
            <Link href="/claim" className="glass-panel text-white font-semibold px-6 py-2.5 rounded-full hover:bg-white/10 transition-colors text-center">
              Create Market
            </Link>
          </div>
        </div>
      </section>

      {/* Tabs and Filters */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-color-border pb-4 mt-4">
        <div className="flex gap-6 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button className="text-white font-semibold whitespace-nowrap bg-[#232832] px-4 py-1.5 rounded-lg">Overall Ranking</button>
          <button className="text-color-muted hover:text-white font-medium whitespace-nowrap transition-colors px-2 py-1.5">Highest Volume</button>
          <button className="text-color-muted hover:text-white font-medium whitespace-nowrap transition-colors px-2 py-1.5">Newest</button>
          <button className="text-color-muted hover:text-white font-medium whitespace-nowrap transition-colors px-2 py-1.5">Most Holders</button>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="glass-panel text-white px-4 py-1.5 rounded-lg flex items-center text-sm font-medium hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filter
          </button>
          <div className="flex items-center bg-[#161A22] border border-color-border rounded-lg px-3 py-1.5 w-full md:w-48">
            <svg className="w-4 h-4 text-color-muted mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search" className="bg-transparent border-none outline-none text-sm text-white placeholder-color-muted w-full" />
          </div>
        </div>
      </section>

      {/* Markets Grid */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
          {DUMMY_MARKETS.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </section>
    </div>
  );
}
