'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/impact-analytics', label: 'Impact Dashboard', exact: true },
  { href: '/impact-analytics/research', label: 'Prism (AI)' },
  { href: '/impact-analytics/analyze', label: 'Analyze Portfolio' },
  { href: '/impact-analytics/compare', label: 'Compare Portfolios' },
];

export default function ImpactAnalyticsSubNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  // Don't show on hub page itself
  if (pathname === '/impact-analytics') {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-8">
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-3 text-sm font-medium
                  border-b-2 -mb-[1px] transition-colors
                  ${active
                    ? 'border-[#10B981] text-[#10B981]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
