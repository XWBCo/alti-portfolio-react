/**
 * Custom AlTi SVG Icon Components
 * Converted from dashboard_config/icons.py
 * Icons have dark blue (#010203) strokes by default
 * Accent elements (circles/rects) have light teal fills that change on hover
 */

interface IconProps {
  className?: string;
  accentColor?: string; // For hover state - turquoise or emerald
}

export function IconPortfolioEvaluation({ className = '', accentColor }: IconProps) {
  const accentFill = accentColor || '#C3E6E3';
  return (
    <svg viewBox="0 0 85 85" className={className}>
      <defs>
        <linearGradient id="grad-portfolio" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#E5F5F3', stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: '#C3E6E3', stopOpacity: 0.6 }} />
        </linearGradient>
      </defs>
      <rect x="16" y="20" width="53" height="48" rx="2" fill="url(#grad-portfolio)" />
      <rect x="16" y="20" width="53" height="48" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      {/* Black accent lines for hieroglyphic effect */}
      <line x1="26" y1="30" x2="59" y2="30" stroke="#1a1a1a" strokeWidth="0.8" />
      <line x1="26" y1="39" x2="59" y2="39" stroke="currentColor" strokeWidth="1.0" />
      <line x1="26" y1="48" x2="59" y2="48" stroke="#1a1a1a" strokeWidth="0.8" />
      <line x1="26" y1="57" x2="48" y2="57" stroke="currentColor" strokeWidth="1.0" />
      <circle cx="33" cy="30" r="2.5" fill={accentFill} stroke="currentColor" strokeWidth="1.0" />
    </svg>
  );
}

export function IconMonteCarlo({ className = '', accentColor }: IconProps) {
  const accentFill = accentColor || '#C3E6E3';
  const secondaryFill = accentColor || '#E5F5F3';
  return (
    <svg viewBox="0 0 85 85" className={className}>
      <defs>
        <radialGradient id="grad-monte">
          <stop offset="0%" style={{ stopColor: '#C3E6E3', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#E5F5F3', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      {/* Outer circle with black inner ring for depth */}
      <circle cx="42.5" cy="43" r="28" fill="url(#grad-monte)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="42.5" cy="43" r="25" fill="none" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.4" />
      {/* Probability curves - main in color, shadow in black */}
      <path d="M 16 63 Q 26 30, 42.5 43 T 69 23" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M 16 58 Q 26 35, 42.5 48 T 69 33" fill="none" stroke="#1a1a1a" strokeWidth="0.8" opacity="0.4" />
      {/* Data point circles */}
      <circle cx="42.5" cy="43" r="3.5" fill={accentFill} stroke="currentColor" strokeWidth="1.0" />
      <circle cx="26" cy="35" r="2.5" fill={secondaryFill} stroke="#1a1a1a" strokeWidth="0.6" />
      <circle cx="59" cy="26" r="2.5" fill={secondaryFill} stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

export function IconRiskContribution({ className = '', accentColor }: IconProps) {
  const accentFill = accentColor || '#C3E6E3';
  return (
    <svg viewBox="0 0 85 85" className={className}>
      <defs>
        <linearGradient id="grad-risk" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#E5F5F3', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#C3E6E3', stopOpacity: 0.1 }} />
        </linearGradient>
      </defs>
      {/* Triangle with color outline and black inner detail */}
      <polygon points="42.5,16 69,68 16,68" stroke="currentColor" strokeWidth="1.6" fill="url(#grad-risk)" />
      <line x1="42.5" y1="16" x2="42.5" y2="53" stroke="#1a1a1a" strokeWidth="0.8" />
      {/* Concentric circles - outer black, inner color */}
      <circle cx="42.5" cy="43" r="10" fill="none" stroke="#1a1a1a" strokeWidth="0.7" />
      <circle cx="42.5" cy="43" r="5" fill={accentFill} stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconCapitalMarket({ className = '', accentColor }: IconProps) {
  const accentFill = accentColor || '#C3E6E3';
  const secondaryFill = accentColor || '#E5F5F3';
  return (
    <svg viewBox="0 0 85 85" className={className}>
      {/* Axes in black for hieroglyphic contrast */}
      <line x1="16" y1="66" x2="16" y2="20" stroke="#1a1a1a" strokeWidth="1.0" />
      <line x1="16" y1="66" x2="69" y2="66" stroke="#1a1a1a" strokeWidth="1.0" />
      {/* Trend line in vibrant color */}
      <polyline points="21,58 31,50 42.5,44 54,36 64,28" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {/* Data points - alternating color and black strokes */}
      <circle cx="42.5" cy="44" r="3.5" fill={accentFill} stroke="currentColor" strokeWidth="1.0" />
      <circle cx="31" cy="50" r="2.5" fill={secondaryFill} stroke="#1a1a1a" strokeWidth="0.6" />
      <circle cx="54" cy="36" r="2.5" fill={secondaryFill} stroke="currentColor" strokeWidth="0.8" />
      <line x1="36" y1="51" x2="49" y2="51" stroke="#1a1a1a" strokeDasharray="3,3" opacity="0.5" strokeWidth="0.8" />
    </svg>
  );
}

export function IconImpactAnalytics({ className = '', accentColor }: IconProps) {
  // Impact uses vibrant green with black accents for hieroglyphic effect
  const accentFill = accentColor || '#C3E6E3';
  return (
    <svg viewBox="0 0 85 85" className={className}>
      <defs>
        <radialGradient id="grad-impact-left">
          <stop offset="30%" style={{ stopColor: '#34E5B8', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#B8F5E6', stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id="grad-impact-right">
          <stop offset="30%" style={{ stopColor: '#00D9A3', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#B8F5E6', stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id="grad-impact-bottom">
          <stop offset="30%" style={{ stopColor: '#00C293', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#B8F5E6', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      {/* Three interlocking circles - vibrant green with black inner rings */}
      <circle cx="30" cy="35" r="14" fill="url(#grad-impact-left)" />
      <circle cx="30" cy="35" r="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="30" cy="35" r="11" fill="none" stroke="#1a1a1a" strokeWidth="0.4" opacity="0.5" />
      <circle cx="55" cy="35" r="14" fill="url(#grad-impact-right)" />
      <circle cx="55" cy="35" r="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="55" cy="35" r="11" fill="none" stroke="#1a1a1a" strokeWidth="0.4" opacity="0.5" />
      <circle cx="42.5" cy="55" r="14" fill="url(#grad-impact-bottom)" />
      <circle cx="42.5" cy="55" r="14" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="42.5" cy="55" r="11" fill="none" stroke="#1a1a1a" strokeWidth="0.4" opacity="0.5" />
      {/* Connection lines - black for contrast */}
      <line x1="38" y1="41" x2="34" y2="49" stroke="#1a1a1a" strokeWidth="0.8" opacity="0.6" />
      <line x1="47" y1="41" x2="51" y2="49" stroke="#1a1a1a" strokeWidth="0.8" opacity="0.6" />
      {/* Center circles */}
      <circle cx="42.5" cy="45" r="4" fill={accentFill} stroke="currentColor" strokeWidth="1.2" />
      <circle cx="42.5" cy="45" r="1.5" fill="#1a1a1a" />
    </svg>
  );
}

export function IconClientAssessment({ className = '', accentColor }: IconProps) {
  const accentFill = accentColor || '#E5F5F3';
  return (
    <svg viewBox="0 0 85 85" className={className}>
      <defs>
        <linearGradient id="grad-client" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#E5F5F3', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#C3E6E3', stopOpacity: 0.2 }} />
        </linearGradient>
      </defs>
      {/* Document outline in vibrant color */}
      <rect x="21" y="16" width="43" height="53" rx="1" fill="url(#grad-client)" />
      <rect x="21" y="16" width="43" height="53" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      {/* Lines alternating color and black */}
      <line x1="30" y1="28" x2="55" y2="28" stroke="currentColor" strokeWidth="1.0" />
      <line x1="30" y1="37" x2="55" y2="37" stroke="#1a1a1a" strokeWidth="0.7" />
      <line x1="30" y1="46" x2="55" y2="46" stroke="currentColor" strokeWidth="1.0" />
      {/* Checkbox with black outline */}
      <rect x="30" y="55" width="10" height="10" fill={accentFill} stroke="#1a1a1a" strokeWidth="0.6" />
      <path d="M 32 60 L 35 63 L 38 57" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function IconAnalytics({ className = '', accentColor }: IconProps) {
  const accentFill = accentColor || '#C3E6E3';
  return (
    <svg viewBox="0 0 85 85" className={className}>
      <defs>
        <linearGradient id="grad-analytics" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#E5F5F3', stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: '#C3E6E3', stopOpacity: 0.5 }} />
        </linearGradient>
      </defs>
      {/* Axes in black */}
      <line x1="16" y1="66" x2="16" y2="20" stroke="#1a1a1a" strokeWidth="1.0" />
      <line x1="16" y1="66" x2="69" y2="66" stroke="#1a1a1a" strokeWidth="1.0" />
      {/* Bars alternating color and black strokes */}
      <rect x="23" y="52" width="8" height="14" rx="1" fill="url(#grad-analytics)" stroke="currentColor" strokeWidth="1.4" />
      <rect x="35" y="45" width="8" height="21" rx="1" fill="url(#grad-analytics)" stroke="#1a1a1a" strokeWidth="0.8" />
      <rect x="47" y="38" width="8" height="28" rx="1" fill="url(#grad-analytics)" stroke="currentColor" strokeWidth="1.4" />
      <rect x="59" y="30" width="8" height="36" rx="1" fill="url(#grad-analytics)" stroke="#1a1a1a" strokeWidth="0.8" />
      {/* Trend line in vibrant color */}
      <polyline points="27,50 39,43 51,36 63,28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2,2" opacity="0.8" />
      {/* Data points */}
      <circle cx="27" cy="50" r="2.5" fill={accentFill} stroke="currentColor" strokeWidth="1.0" />
      <circle cx="39" cy="43" r="2.5" fill={accentFill} stroke="#1a1a1a" strokeWidth="0.6" />
      <circle cx="51" cy="36" r="2.5" fill={accentFill} stroke="currentColor" strokeWidth="1.0" />
      <circle cx="63" cy="28" r="3" fill={accentFill} stroke="#1a1a1a" strokeWidth="0.6" />
    </svg>
  );
}

export function IconInvestmentResearch({ className = '', accentColor }: IconProps) {
  const accentFill = accentColor || '#C3E6E3';
  const sparkle = accentColor || '#00f0db';
  return (
    <svg viewBox="0 0 85 85" className={className}>
      <defs>
        <radialGradient id="grad-research">
          <stop offset="0%" style={{ stopColor: '#C3E6E3', stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: '#E5F5F3', stopOpacity: 0.1 }} />
        </radialGradient>
      </defs>
      <circle cx="38" cy="38" r="18" fill="url(#grad-research)" stroke="currentColor" strokeWidth="1.5" />
      <line x1="52" y1="52" x2="68" y2="68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="38" cy="38" r="8" fill="none" stroke="currentColor" strokeWidth="1.0" opacity="0.5" />
      <circle cx="38" cy="38" r="3" fill={accentFill} stroke="currentColor" strokeWidth="0.8" />
      {/* Sparkle effect */}
      <circle cx="30" cy="30" r="1.5" fill={sparkle} />
      <circle cx="46" cy="32" r="1" fill={sparkle} opacity="0.7" />
      <circle cx="35" cy="46" r="1" fill={sparkle} opacity="0.5" />
    </svg>
  );
}

// Prism AI Chat Icon - 3D geometric pyramid prism
export function IconPrism({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 85 85" className={className}>
      <defs>
        {/* Gradient for front face */}
        <linearGradient id="grad-prism-front" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 0.15 }} />
          <stop offset="100%" style={{ stopColor: '#047857', stopOpacity: 0.25 }} />
        </linearGradient>
        {/* Gradient for left face */}
        <linearGradient id="grad-prism-left" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#2DD4BF', stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0.1 }} />
        </linearGradient>
        {/* Gradient for right face */}
        <linearGradient id="grad-prism-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#34D399', stopOpacity: 0.25 }} />
          <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 0.15 }} />
        </linearGradient>
      </defs>

      {/* 3D Pyramid - Base quadrilateral (bottom) */}
      <polygon
        points="42.5,68 15,52 42.5,58 70,52"
        fill="url(#grad-prism-front)"
        stroke="#10B981"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Left face */}
      <polygon
        points="42.5,12 15,52 42.5,58"
        fill="url(#grad-prism-left)"
        stroke="#10B981"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Right face */}
      <polygon
        points="42.5,12 70,52 42.5,58"
        fill="url(#grad-prism-right)"
        stroke="#10B981"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Front left edge */}
      <polygon
        points="42.5,68 15,52 42.5,58"
        fill="url(#grad-prism-left)"
        stroke="#10B981"
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity="0.8"
      />

      {/* Front right edge */}
      <polygon
        points="42.5,68 70,52 42.5,58"
        fill="url(#grad-prism-right)"
        stroke="#10B981"
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity="0.8"
      />

      {/* Center vertical edge (apex to center) */}
      <line x1="42.5" y1="12" x2="42.5" y2="58" stroke="#10B981" strokeWidth="1.8" />

      {/* Center to front vertex */}
      <line x1="42.5" y1="58" x2="42.5" y2="68" stroke="#10B981" strokeWidth="1.8" />

      {/* Horizontal divider line */}
      <line x1="15" y1="52" x2="70" y2="52" stroke="#10B981" strokeWidth="1.2" opacity="0.6" />

      {/* Inner highlight lines for 3D effect */}
      <line x1="42.5" y1="12" x2="15" y2="52" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.4" />
      <line x1="42.5" y1="12" x2="70" y2="52" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.4" />

      {/* Subtle glow at apex */}
      <circle cx="42.5" cy="12" r="3" fill="#00f0db" opacity="0.5" />
    </svg>
  );
}

// Analyze Portfolio Icon - Single circle (one portfolio)
export function IconAnalyzePortfolio({ className = '', accentColor }: IconProps) {
  const fillOpacity = accentColor ? 0.3 : 0.1;
  return (
    <svg viewBox="0 0 85 85" className={className}>
      <defs>
        <radialGradient id="grad-analyze-single">
          <stop offset="30%" style={{ stopColor: 'currentColor', stopOpacity: fillOpacity }} />
          <stop offset="100%" style={{ stopColor: 'currentColor', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      {/* Single circle - one portfolio */}
      <circle cx="42.5" cy="42.5" r="28" fill="url(#grad-analyze-single)" />
      <circle cx="42.5" cy="42.5" r="28" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {/* Center dot with stroke */}
      <circle cx="42.5" cy="42.5" r="5" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

// Compare Portfolios Icon - Two circles (two portfolios)
export function IconComparePortfolios({ className = '', accentColor }: IconProps) {
  const fillOpacity = accentColor ? 0.3 : 0.1;
  return (
    <svg viewBox="0 0 85 85" className={className}>
      <defs>
        <radialGradient id="grad-compare-left">
          <stop offset="30%" style={{ stopColor: 'currentColor', stopOpacity: fillOpacity }} />
          <stop offset="100%" style={{ stopColor: 'currentColor', stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id="grad-compare-right">
          <stop offset="30%" style={{ stopColor: 'currentColor', stopOpacity: fillOpacity }} />
          <stop offset="100%" style={{ stopColor: 'currentColor', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      {/* Left circle */}
      <circle cx="28" cy="42.5" r="22" fill="url(#grad-compare-left)" />
      <circle cx="28" cy="42.5" r="22" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {/* Right circle */}
      <circle cx="57" cy="42.5" r="22" fill="url(#grad-compare-right)" />
      <circle cx="57" cy="42.5" r="22" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {/* Center intersection hint with stroke */}
      <circle cx="42.5" cy="42.5" r="4" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

// Export all icons as a map for easy lookup
export const AltiIconMap = {
  'portfolio-evaluation': IconPortfolioEvaluation,
  'monte-carlo': IconMonteCarlo,
  'risk-contribution': IconRiskContribution,
  'cma': IconCapitalMarket,
  'impact-analytics': IconImpactAnalytics,
  'client-assessment': IconClientAssessment,
  'analytics': IconAnalytics,
  'investment-search': IconInvestmentResearch,
  'prism': IconPrism,
  'analyze-portfolio': IconAnalyzePortfolio,
  'compare-portfolios': IconComparePortfolios,
};
