"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white overflow-hidden font-sans">
      
      <style>{`
        @keyframes pulse-beam-x {
          0% { transform: translateX(-100vw); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(100vw); opacity: 0; }
        }
        @keyframes pulse-beam-y {
          0% { transform: translateY(-100vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        .beam-x {
          animation: pulse-beam-x 6s linear infinite;
        }
        .beam-y {
          animation: pulse-beam-y 8s linear infinite;
        }
        .delay-1 { animation-delay: 1.5s; }
        .delay-2 { animation-delay: 3s; }
        .delay-3 { animation-delay: 4.5s; }
      `}</style>

      {/* Neon Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex justify-center">
        {/* Dark Overlay to fade the edges of the grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#0B0E14_80%)] z-10" />
        
        {/* The Static Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(34, 197, 94, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(34, 197, 94, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '160px 160px',
            backgroundPosition: 'center top'
          }}
        />
        
        {/* Moving Data Beams */}
        <div className="absolute inset-0 z-0">
           {/* Horizontal Beams */}
           <div className="absolute top-[160px] left-0 w-full h-[2px] overflow-hidden">
             <div className="w-[300px] h-full bg-gradient-to-r from-transparent via-color-buy to-transparent beam-x blur-[1px] opacity-80" />
           </div>
           <div className="absolute top-[480px] left-0 w-full h-[2px] overflow-hidden">
             <div className="w-[400px] h-full bg-gradient-to-r from-transparent via-color-buy to-transparent beam-x delay-2 blur-[1px] opacity-80" />
           </div>
           <div className="absolute top-[800px] left-0 w-full h-[2px] overflow-hidden">
             <div className="w-[200px] h-full bg-gradient-to-r from-transparent via-color-buy to-transparent beam-x delay-1 blur-[1px] opacity-80" />
           </div>
           
           {/* Vertical Beams */}
           <div className="absolute left-[calc(50%-160px)] top-0 w-[2px] h-full overflow-hidden">
             <div className="h-[300px] w-full bg-gradient-to-b from-transparent via-color-buy to-transparent beam-y delay-1 blur-[1px] opacity-80" />
           </div>
           <div className="absolute left-[calc(50%+320px)] top-0 w-[2px] h-full overflow-hidden">
             <div className="h-[400px] w-full bg-gradient-to-b from-transparent via-color-buy to-transparent beam-y delay-3 blur-[1px] opacity-80" />
           </div>
           <div className="absolute left-[calc(50%-480px)] top-0 w-[2px] h-full overflow-hidden">
             <div className="h-[200px] w-full bg-gradient-to-b from-transparent via-color-buy to-transparent beam-y delay-2 blur-[1px] opacity-80" />
           </div>
        </div>
        
        {/* Main Glowing Cross Intersection (Left) */}
        <div className="absolute top-[240px] left-[calc(50%-480px)]">
          {/* Horizontal Beam */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[2px] bg-color-buy blur-[3px] opacity-80" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[4px] bg-white blur-[4px] opacity-90" />
          
          {/* Vertical Beam */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[2px] bg-color-buy blur-[3px] opacity-80" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[4px] bg-white blur-[4px] opacity-90" />
          
          {/* Ambient Core Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-color-buy rounded-full blur-[60px] opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full blur-[20px] opacity-80" />
        </div>

        {/* Secondary Glowing Cross Intersection (Right/Bottom) */}
        <div className="absolute top-[560px] right-[calc(50%-480px)] opacity-50">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[2px] bg-color-buy blur-[3px] opacity-70" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[2px] bg-color-buy blur-[3px] opacity-70" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-color-buy rounded-full blur-[50px] opacity-40" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-color-muted mb-8">
            <span className="w-2 h-2 rounded-full bg-color-buy animate-pulse" />
            Pump Social Capital is live on Solana
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
            The modern social capital platform
          </h1>
          
          <p className="text-lg md:text-xl text-color-muted max-w-2xl mb-12 font-light leading-relaxed">
            We're eliminating the friction of traditional creator monetization. Tokenize your influence and trade keys instantly on automated bonding curves.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/dashboard" 
              className="bg-color-buy text-[#0B0E14] font-semibold px-8 py-4 rounded-full hover:bg-opacity-90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
            >
              Launch App
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </Link>
            <Link
              href="/docs" 
              className="bg-white/5 border border-white/10 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-all flex items-center justify-center"
            >
              Read Docs
            </Link>
          </div>
        </section>

        {/* Logos Section */}
        <section className="py-12 border-y border-white/5 flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="text-xl font-bold tracking-widest">SOLANA</div>
          <div className="text-xl font-bold tracking-widest">ANCHOR</div>
          <div className="text-xl font-bold tracking-widest">HELIUS</div>
          <div className="text-xl font-bold tracking-widest">NEXT.JS</div>
        </section>

        {/* Feature Section 1 */}
        <section className="py-32 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h4 className="text-color-buy font-medium mb-3 text-sm tracking-wider uppercase">On-chain First Architecture</h4>
            <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
              Automated Bonding Curves
            </h2>
            <p className="text-color-muted text-lg mb-8 font-light">
              We leverage Solana Program Account Ledgers for precise, math-driven bonding curves (Price = base + k × s²). No presales, no hidden allocations. Just pure supply and demand.
            </p>
            
            <div className="space-y-4">
              <div className="bg-[#161A22] border border-color-border p-4 rounded-2xl flex justify-between items-center hover:border-color-buy/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-color-buy/10 flex items-center justify-center text-color-buy">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <span className="font-medium text-white/90">Instant Liquidity</span>
                </div>
                <svg className="w-5 h-5 text-color-muted group-hover:text-color-buy transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
              <div className="bg-[#161A22] border border-color-border p-4 rounded-2xl flex justify-between items-center hover:border-color-buy/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-color-buy/10 flex items-center justify-center text-color-buy">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <span className="font-medium text-white/90">Program Account Ledgers</span>
                </div>
                <svg className="w-5 h-5 text-color-muted group-hover:text-color-buy transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-color-buy/20 to-transparent blur-[80px] rounded-full" />
            <div className="relative bg-[#161A22]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-12 overflow-hidden flex items-center justify-center aspect-square shadow-2xl">
              {/* Floating Element */}
              <div className="w-40 h-40 bg-gradient-to-br from-color-buy to-emerald-700 rounded-3xl rotate-12 shadow-[0_0_50px_rgba(34,197,94,0.4)] flex items-center justify-center animate-bounce duration-[3000ms]">
                 <svg className="w-16 h-16 text-[#0B0E14]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section 2 (Centered) */}
        <section className="py-24 text-center flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
            Built for Scale. Priced in Realtime.
          </h2>
          <p className="text-color-muted text-lg max-w-xl mx-auto mb-16 font-light">
            Powered by Solana, Anchor, and Helius webhooks. State changes are pushed instantly via Redis and WebSockets for lightning-fast price discovery.
          </p>

          <div className="w-full max-w-4xl relative">
            <div className="absolute inset-0 bg-color-buy/10 blur-[100px] rounded-full" />
            <div className="relative bg-[#0F141A] border border-white/5 rounded-3xl p-8 md:p-16 overflow-hidden">
              <div className="grid md:grid-cols-2 gap-8 text-left relative z-10">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-white">Optimized for scale</h3>
                  <p className="text-color-muted font-light leading-relaxed mb-6">
                    Designed for high throughput, the system employs robust Solana programs and advanced mathematical bonding curve mechanics to ensure a highly secure, deterministic pricing environment.
                  </p>
                  <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium">
                    Learn More <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </Link>
                </div>
                <div className="relative h-64 md:h-auto">
                  {/* Decorative Mockup elements */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full h-full perspective-[1000px] flex items-center justify-center">
                    <div className="w-full max-w-[280px] aspect-video bg-[#161A22] border border-white/10 rounded-xl shadow-2xl transform rotate-y-[-15deg] rotate-x-[10deg] p-4 flex flex-col gap-3">
                      <div className="flex gap-2 mb-2">
                         <div className="w-2 h-2 rounded-full bg-color-sell" />
                         <div className="w-2 h-2 rounded-full bg-yellow-500" />
                         <div className="w-2 h-2 rounded-full bg-color-buy" />
                      </div>
                      <div className="h-4 w-1/3 bg-white/5 rounded" />
                      <div className="h-24 w-full bg-color-buy/10 rounded-lg flex items-end p-2 gap-1">
                         <div className="w-full bg-color-buy/40 rounded-t-sm h-[30%]" />
                         <div className="w-full bg-color-buy/60 rounded-t-sm h-[50%]" />
                         <div className="w-full bg-color-buy/80 rounded-t-sm h-[80%]" />
                         <div className="w-full bg-color-buy rounded-t-sm h-[100%]" />
                      </div>
                    </div>
                    {/* Floating pill */}
                    <div className="absolute -right-4 -top-4 bg-color-buy text-[#0B0E14] px-4 py-2 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse">
                      + 45.2 SOL
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Fees Work Section */}
        <section className="py-24 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="mb-16">
              <h4 className="text-color-buy font-medium mb-3 text-sm tracking-wider uppercase">Fee Structure</h4>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                HOW CREATOR FEES WORK.
              </h2>
              <p className="text-color-muted text-lg font-light leading-relaxed mb-6">
                Virality ≈ Monetization that you're missing out on — 99% of the time the creator does not receive a dollar of fees generated from YOUR movement / project. We make sure you get paid what you deserve.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-16 mb-24">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-white">The core insight</h3>
                <p className="text-color-muted font-light leading-relaxed mb-6">
                  Every trade generates creator fees & the creator almost NEVER gets what's theirs.
                </p>
                <p className="text-color-muted font-light leading-relaxed">
                  Most platforms take a large percentage of transactions for themselves. Pump Social Capital flips the script: the vast majority of the fee goes directly to the creator. Every single time a Creator Key is bought or sold on the bonding curve, you earn 5% of the transaction volume. We only take 2% to keep the protocol running.
                </p>
              </div>
              
              <div className="bg-[#161A22] border border-color-border rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-color-buy/10 blur-[50px]" />
                <h3 className="text-xl font-bold mb-8 text-white">Where the money goes (7% Total Fee)</h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-6 border-b border-white/5">
                    <div>
                      <p className="font-semibold text-color-buy">Creator fee</p>
                      <p className="text-sm text-color-muted">Goes to you directly</p>
                    </div>
                    <span className="text-2xl font-bold text-color-buy">5.0%</span>
                  </div>
                  <div className="flex justify-between items-center pb-6 border-b border-white/5">
                    <div>
                      <p className="font-semibold text-white">Protocol fee</p>
                      <p className="text-sm text-color-muted">Goes to the protocol</p>
                    </div>
                    <span className="text-2xl font-bold text-white/50">2.0%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-white">Total fee per trade</p>
                    <span className="text-2xl font-bold text-white">7.0%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-16">
              <h3 className="text-3xl font-bold mb-4 text-white">Permanent Bonding Curve Fees</h3>
              <p className="text-color-muted font-light mb-8">NO PRESALES. NO HIDDEN ALLOCATIONS. Your market operates entirely on a transparent on-chain bonding curve. Your creator cut is 5.0% of every transaction — permanently and automatically routed to your wallet vault.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-color-muted">
                      <th className="py-4 px-6 font-medium">Pricing Mechanism</th>
                      <th className="py-4 px-6 font-medium text-color-buy">Creator Fee</th>
                      <th className="py-4 px-6 font-medium">Protocol Fee</th>
                      <th className="py-4 px-6 font-medium">Total Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white/5 border-b border-white/5">
                      <td className="py-4 px-6 text-white font-medium">Quadratic Curve (Price = base + k × s²)</td>
                      <td className="py-4 px-6 text-color-buy font-bold">5.0%</td>
                      <td className="py-4 px-6 text-white/70">2.0%</td>
                      <td className="py-4 px-6 text-white font-medium">7.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-24 text-center">
               <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">READY TO CLAIM WHAT'S YOURS?</h2>
               <p className="text-color-muted max-w-xl mx-auto mb-8 font-light">We set it all up. You need an audience and a Solana wallet. We handle the rest — permanently, on-chain.</p>
               <Link href="/dashboard" className="bg-color-buy text-[#0B0E14] font-bold px-8 py-4 rounded-full hover:bg-opacity-90 transition-all inline-block">
                 APPLY AS A CREATOR
               </Link>
            </div>
          </div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <div className="w-5 h-5 rounded-sm bg-color-buy flex items-center justify-center transform rotate-45">
              <div className="w-2.5 h-2.5 bg-[#0B0E14] rounded-sm transform -rotate-45" />
            </div>
            PumpSocial
          </div>
          <div className="text-color-muted text-sm">
            © 2026 Pump Social Capital. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-color-muted hover:text-white transition-colors">Twitter</a>
            <a href="#" className="text-color-muted hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
