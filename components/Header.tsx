'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { User, useAuth } from '@/lib/auth';

interface HeaderProps {
  user?: User | null;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const isHome = pathname === '/';
  const isImpactAnalytics = pathname?.startsWith('/impact-analytics');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get page title for non-home pages
  const getPageTitle = () => {
    if (pathname === '/monte-carlo') return 'Monte Carlo Simulation';
    if (pathname === '/portfolio-evaluation') return 'Portfolio Evaluation';
    if (pathname === '/investment-search') return 'Investment Research';
    if (pathname === '/risk-contribution') return 'Risk Contribution Model';
    if (pathname === '/capital-market-assumptions') return 'Capital Market Assumptions';
    if (pathname === '/client-assessment') return 'Client Assessment';
    if (isImpactAnalytics) return 'Impact';
    if (pathname === '/analytics') return 'Analytics';
    return '';
  };

  return (
    <header
      className="bg-white"
      style={{
        padding: '35px 60px',
        borderBottom: '2px solid #00f0db',
      }}
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        {/* Left side: Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/alti-logo.jpg"
            alt="AlTi Global"
            width={170}
            height={74}
            priority
            style={{ objectFit: 'contain' }}
          />
        </Link>

        {/* Center: Page title with back arrow (only on sub-pages) */}
        {!isHome && (
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
            <Link
              href="/"
              className="text-[#757575] hover:text-[#010203] transition-colors"
              title="Back to Dashboard"
            >
              <span className="text-xl">←</span>
            </Link>
            {isImpactAnalytics ? (
              <span className="font-serif text-2xl bg-gradient-to-r from-[#047857] via-[#10B981] to-[#2DD4BF] bg-clip-text text-transparent">
                {getPageTitle()}
              </span>
            ) : (
              <span
                className="text-[#010203]"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: '21px',
                  fontWeight: 400,
                }}
              >
                {getPageTitle()}
              </span>
            )}
          </div>
        )}

        {/* Right side spacer for layout balance (only on sub-pages) */}
        {!isHome && <div className="w-5" />}

        {/* Right side: User greeting (only on home page) */}
        {isHome && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div
                className="text-[#010203]"
                style={{ fontSize: '17px', fontWeight: 500, marginBottom: '2px' }}
              >
                {getGreeting()}, {user?.name || 'User'}
              </div>
              <div
                className="text-[#757575]"
                style={{ fontSize: '15px', fontWeight: 300 }}
              >
                {user?.authMethod === 'dev-bypass' ? (
                  <span className="text-teal-500">Dev Mode</span>
                ) : (
                  <>Last login: {new Date(user?.authenticatedAt || Date.now()).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}</>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
