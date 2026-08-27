export default function DocsPage() {
  return (
    <div className="space-y-16 text-white/80">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Pump Social Capital</h1>
        <p className="text-xl text-color-muted font-light">
          Solana Backend-First Developer Documentation
        </p>
      </div>

      {/* 1. Overview */}
      <section id="overview" className="scroll-mt-32 space-y-6">
        <h2 className="text-3xl font-bold text-white">1. Overview & MVP Goal</h2>
        <p className="leading-relaxed">
          Pump Social Capital is a social capital market built on Solana. It enables users to create a market for creators, buy/sell Creator Keys, and perform price discovery on-chain while earning creator fees from trading activities.
        </p>
        <blockquote className="border-l-4 border-color-buy bg-white/5 p-4 rounded-r-lg italic">
          "On-chain first. Backend fast. UI simple."
        </blockquote>
        <h3 className="text-xl font-bold text-white mt-6">MVP Requirements</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Connect Solana wallet</li>
          <li>Create creator market</li>
          <li>Buy and Sell Creator Keys</li>
          <li>Bonding curve price discovery</li>
          <li>Real-time creator and protocol fees</li>
        </ul>
      </section>

      {/* 2. Architecture */}
      <section id="architecture" className="scroll-mt-32 space-y-6">
        <h2 className="text-3xl font-bold text-white">2. Architecture</h2>
        <p className="leading-relaxed">
          The platform uses a Solana-first architecture. The backend is fast but the Solana program is always the single source of truth for balances and final pricing.
        </p>
        <div className="bg-[#0B0E14] border border-white/10 p-6 rounded-xl font-mono text-sm text-color-buy overflow-x-auto">
          Wallet → Frontend → Backend API → Solana RPC → Anchor Program → Helius Webhook → Indexer → Postgres/Redis → Realtime WebSocket
        </div>
      </section>

      {/* 3. Smart Contracts */}
      <section id="smart-contracts" className="scroll-mt-32 space-y-6">
        <h2 className="text-3xl font-bold text-white">3. Smart Contracts (Anchor)</h2>
        <p className="leading-relaxed">
          The main program is `pump_social_capital`. It utilizes Program Account Ledgers instead of standard SPL tokens for efficiency.
        </p>
        
        <h3 className="text-xl font-bold text-white mt-6">Key PDAs</h3>
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <h4 className="font-bold text-color-buy mb-2">Protocol Config PDA <code>["protocol"]</code></h4>
            <p className="text-sm">Holds authority, treasury, and global fee BPS settings.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <h4 className="font-bold text-color-buy mb-2">Creator Market PDA <code>["creator_market", creator_id]</code></h4>
            <p className="text-sm">Maintains supply, reserve lamports, total volume, and specific creator fee settings. Uses immutable X ID.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <h4 className="font-bold text-color-buy mb-2">User Position PDA <code>["position", market, wallet]</code></h4>
            <p className="text-sm">Tracks exact key balances and PnL data per user per market without needing an SPL token mint.</p>
          </div>
        </div>
      </section>

      {/* 4. Bonding Curve Math */}
      <section id="bonding-curve" className="scroll-mt-32 space-y-6">
        <h2 className="text-3xl font-bold text-white">4. Bonding Curve Math</h2>
        <p className="leading-relaxed">
          Pricing is deterministic and calculated entirely on-chain using discrete quadratic pricing.
        </p>
        <div className="bg-[#0B0E14] border border-white/10 p-6 rounded-xl font-mono text-lg text-center text-white">
          Price(s) = base + k × s²
        </div>
        <p className="text-sm text-color-muted mt-2">
          *The frontend and backend use this exact formula for quotes, but the smart contract acts as the final validator for slippage and bounds.
        </p>
      </section>

      {/* 5. Flows */}
      <section id="flows" className="scroll-mt-32 space-y-6">
        <h2 className="text-3xl font-bold text-white">5. Buy & Sell Flows</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold text-color-buy mb-4">Buy Flow</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Validate protocol and market active.</li>
              <li>Read current supply.</li>
              <li>Calculate exact curve cost.</li>
              <li>Calculate creator & protocol fees.</li>
              <li>Validate cost &lt;= `max_sol_cost`.</li>
              <li>Transfer SOL, route fees to vaults.</li>
              <li>Increase user balance and market supply.</li>
              <li>Emit `KeysPurchased` event.</li>
            </ol>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold text-color-sell mb-4">Sell Flow</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Validate key balance.</li>
              <li>Calculate return based on supply.</li>
              <li>Calculate fees.</li>
              <li>Validate net &gt;= `min_sol_received`.</li>
              <li>Reduce supply and balance.</li>
              <li>Transfer SOL to seller.</li>
              <li>Emit `KeysSold` event.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* 6. Fees */}
      <section id="fees" className="scroll-mt-32 space-y-6">
        <h2 className="text-3xl font-bold text-white">6. Fee Architecture</h2>
        <p className="leading-relaxed">
          Pump Social Capital separates accounting strictly. Reserve liquidity is never mixed with fees.
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-6">
          <li><strong>Creator Fee:</strong> 5% (500 BPS) - Routed to Creator Fee Vault PDA.</li>
          <li><strong>Protocol Fee:</strong> 2% (200 BPS) - Routed to Protocol Treasury PDA.</li>
          <li><strong>Total Fee:</strong> 7% (700 BPS)</li>
        </ul>
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-yellow-500 text-sm">
          <strong>Security Note:</strong> The bonding curve reserve is completely isolated and cannot be used as protocol treasury.
        </div>
      </section>

      {/* 7. Backend & Realtime */}
      <section id="backend" className="scroll-mt-32 space-y-6">
        <h2 className="text-3xl font-bold text-white">7. Backend & Realtime</h2>
        <p className="leading-relaxed">
          The backend provides metadata, search, charts, and realtime feeds, but <strong>never</strong> acts as the authority for balances or prices.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Stack:</strong> Node.js, Fastify, PostgreSQL (Drizzle), Redis, BullMQ.</li>
          <li><strong>Indexing:</strong> Listens to Anchor events via Helius Webhooks. Validates signatures and decodes events to update Postgres.</li>
          <li><strong>WebSockets:</strong> Pushes updates (trade, price_update, supply_update) to clients in under 2 seconds.</li>
        </ul>
      </section>
      
    </div>
  );
}
