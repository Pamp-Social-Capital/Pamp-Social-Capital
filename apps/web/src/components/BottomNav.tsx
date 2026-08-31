"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Markets", path: "/", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg> },
    { name: "Portfolio", path: "/portfolio", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> },
    { name: "Create", path: "/claim", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> },
    { name: "Protocol", path: "/protocol", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0B0E14] border-t border-color-border z-50 px-6 py-3 pb-safe flex justify-between items-center">
      {navItems.map((item) => {
        const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
        return (
          <Link 
            key={item.name} 
            href={item.path}
            className={`flex flex-col items-center gap-1 p-2 ${isActive ? 'text-color-buy' : 'text-color-muted hover:text-white'}`}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
};
