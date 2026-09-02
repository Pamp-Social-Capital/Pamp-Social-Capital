import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="border-t border-color-border/30 py-8 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-base font-bold text-white">
          <img src="/logo.png" alt="PumpSocial Logo" className="w-6 h-6 object-contain" />
          <span>PumpSocial</span>
        </Link>
        <div className="text-color-muted text-xs">
          © {new Date().getFullYear()} Pump Social Capital. All rights reserved.
        </div>
        <div className="flex gap-6 text-sm">
          <a href="https://x.com/pumpsocialcpt" target="_blank" rel="noopener noreferrer" className="text-color-muted hover:text-white transition-colors">Twitter</a>
          <Link href="/docs" className="text-color-muted hover:text-white transition-colors">Docs</Link>
        </div>
      </div>
    </footer>
  );
};
