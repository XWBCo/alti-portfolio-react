# Enhanced Features Roadmap - AlTi Portfolio React

**Last Updated:** December 11, 2025
**Context:** Modern React/Next.js architecture enabling capabilities impossible in legacy Dash/Plotly stack

---

## Executive Summary

This roadmap outlines **25 enhanced features** that leverage React's client-side performance, WebSocket capabilities, modern chart libraries, and AI/ML integrations to deliver a differentiated experience beyond the legacy Dash implementation.

**Current State:**
- Legacy: 10,381 lines Python Dash, server-side rendering, limited real-time capabilities
- React: 7,000 lines TypeScript, client-side compute, partial feature parity (~70%)
- Architecture: Next.js 16 + React 19 + FastAPI + client-side Monte Carlo (10K sims in ~100ms)

**Opportunity:** React's architecture enables real-time collaboration, progressive enhancement, offline capabilities, and ML-powered insights impossible in the synchronous Dash framework.

---

## Priority 0: Critical Missing Features (Complete Parity)

Before enhancements, complete these legacy features:

| Feature | Legacy Implementation | Current Gap | Estimate |
|---------|----------------------|-------------|----------|
| **IPS Word Export** | 500+ lines Python-docx | Placeholder only | 8-12 hours |
| **Stress Scenarios** | 8 historical periods | Missing entirely | 6-8 hours |
| **Qualtrics Integration** | Real API calls | Mock data | 4-6 hours |
| **Footer CTA Buttons** | Feedback + Guide + PPT | None functional | 4-6 hours |
| **Piecewise Regime UI** | 3-phase return assumptions | Code exists, no UI | 3-4 hours |

**Dependencies:** None - these use existing patterns
**Total P0 Estimate:** 25-36 hours

---

## 1. Real-Time Capabilities

### 1.1 WebSocket Portfolio Updates (P1 - HIGH VALUE)

**Current:** Static CSV data, manual refresh required
**Enhanced:** Live portfolio updates via WebSocket for multi-user environments

**Implementation:**
```typescript
// lib/websocket/portfolio-sync.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function usePortfolioSync(portfolioId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [liveData, setLiveData] = useState<PortfolioSnapshot | null>(null);

  useEffect(() => {
    const ws = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8002', {
      query: { portfolioId }
    });

    ws.on('portfolio:update', (snapshot: PortfolioSnapshot) => {
      setLiveData(snapshot);
    });

    ws.on('portfolio:trade', (trade: TradeEvent) => {
      // Optimistic UI update before server confirmation
      applyTradeOptimistically(trade);
    });

    setSocket(ws);
    return () => ws.disconnect();
  }, [portfolioId]);

  return { liveData, socket };
}
```

**Use Cases:**
- Multi-advisor collaboration on same portfolio
- Live risk metric updates as positions change
- Trade execution impact on efficient frontier
- Real-time alert notifications

**Technical Stack:**
- **Frontend:** Socket.io-client (6KB gzipped)
- **Backend:** Socket.io server on FastAPI via `python-socketio`
- **State:** React Context + optimistic updates
- **Fallback:** Long-polling for older browsers

**Complexity:** Medium (8-12 hours)
**Dependencies:** FastAPI WebSocket endpoint, Redis pub/sub for multi-instance scaling

---

### 1.2 Streaming Risk Calculations (P1 - HIGH VALUE)

**Current:** Calculate full risk decomposition, block UI until complete
**Enhanced:** Stream intermediate results as calculations complete

**Implementation:**
```typescript
// Example: Stream LASSO factor betas as they converge
async function* streamRiskDecomposition(portfolioId: string) {
  const response = await fetch(`/api/risk/decomposition-stream`, {
    method: 'POST',
    body: JSON.stringify({ portfolioId }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        yield JSON.parse(line.slice(6)) as PartialRiskResult;
      }
    }
  }
}

// Component usage
export function RiskContribution() {
  const [progress, setProgress] = useState<PartialRiskResult[]>([]);

  useEffect(() => {
    (async () => {
      for await (const result of streamRiskDecomposition(portfolioId)) {
        setProgress(prev => [...prev, result]);
      }
    })();
  }, [portfolioId]);

  return (
    <>
      <ProgressBar value={progress.length} max={totalFactors} />
      <PartialResultsChart data={progress} />
    </>
  );
}
```

**Benefits:**
- Perceived performance improvement (show progress vs blank screen)
- User can cancel long-running calculations
- Early insights before full completion
- Progressive enhancement: works without streaming, better with it

**Technical Stack:**
- **Protocol:** Server-Sent Events (SSE) - simpler than WebSocket for one-way
- **Backend:** FastAPI `StreamingResponse` with LASSO iteration callbacks
- **Frontend:** Native `fetch` + ReadableStream API

**Complexity:** Medium (6-8 hours)
**Dependencies:** Refactor `risk_engine.py` to support iteration callbacks

---

### 1.3 Real-Time Market Data Integration (P2 - STRATEGIC)

**Current:** Static historical returns from CSV
**Enhanced:** Live price feeds for market-based stress testing

**Implementation:**
```typescript
// lib/market-data/live-feed.ts
interface MarketSnapshot {
  timestamp: number;
  prices: Record<string, number>;
  changes: Record<string, number>;
}

export function useMarketData(symbols: string[]) {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `wss://market-data.alti-global.com/v1/stream?symbols=${symbols.join(',')}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setSnapshot(data);

      // Trigger portfolio revaluation
      recalculatePortfolioValue(data.prices);
    };

    return () => ws.close();
  }, [symbols.join(',')]);

  return snapshot;
}
```

**Use Cases:**
- Real-time portfolio revaluation during market hours
- Live stress testing: "What if VIX spikes 20%?"
- Intraday risk monitoring for active portfolios
- Market regime detection (see section 3.1)

**Data Sources:**
- **Level 1:** IEX Cloud (free tier: 100 symbols, 15min delay)
- **Level 2:** Bloomberg API (requires license, real-time)
- **Level 3:** Quant Connect (backtesting + live, $20/mo)

**Complexity:** High (16-20 hours including vendor integration)
**Dependencies:** Market data vendor contract, WebSocket infrastructure
**Cost:** $0-500/month depending on data tier

---

## 2. Advanced Visualization

### 2.1 3D Efficient Frontier Surface (P1 - HIGH IMPACT)

**Current:** 2D efficient frontier line chart (return vs risk)
**Enhanced:** Interactive 3D surface showing return/risk/Sharpe ratio trade-offs

**Implementation:**
```typescript
// Using react-three-fiber for WebGL rendering
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface FrontierPoint3D {
  risk: number;
  return: number;
  sharpe: number;
  weights: number[];
}

export function EfficientFrontier3D({ points }: { points: FrontierPoint3D[] }) {
  const geometry = useMemo(() => {
    const vertices = points.flatMap(p => [p.risk, p.return, p.sharpe]);
    return new Float32Array(vertices);
  }, [points]);

  return (
    <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Efficient frontier surface */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={geometry.length / 3}
            array={geometry}
            itemSize={3}
          />
        </bufferGeometry>
        <meshStandardMaterial
          color="#00f0db"
          wireframe={false}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Current portfolio marker */}
      <mesh position={[currentRisk, currentReturn, currentSharpe]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      <OrbitControls enableDamping />
    </Canvas>
  );
}
```

**Dimensions:**
- **X-axis:** Portfolio risk (volatility)
- **Y-axis:** Expected return
- **Z-axis:** Sharpe ratio or diversification metric
- **Color gradient:** Asset class concentration
- **Point size:** Assets under management

**Interactions:**
- Rotate/zoom with mouse
- Click point to see asset allocation
- Hover to show metrics tooltip
- Compare multiple portfolios simultaneously

**Technical Stack:**
- **Library:** react-three-fiber + three.js (WebGL)
- **Size:** ~40KB gzipped (three.js is heavy, consider code splitting)
- **Fallback:** 2D chart for browsers without WebGL

**Complexity:** Medium (10-12 hours)
**Dependencies:** WebGL support, efficient frontier data structure

---

### 2.2 Interactive Risk Decomposition Treemap (P1 - HIGH IMPACT)

**Current:** Stacked bar chart for factor contributions
**Enhanced:** Hierarchical treemap showing nested risk attribution

**Why Better:**
- Hierarchy: Asset class → Security → Factor → Specific risk
- Space efficiency: Show 100+ holdings vs 20-item bar chart
- Drill-down: Click to zoom into sub-categories
- Color: Map to risk contribution (red = high risk, green = diversifier)

**Implementation:**
```typescript
// Using recharts Treemap with custom rendering
import { Treemap, ResponsiveContainer } from 'recharts';

interface RiskNode {
  name: string;
  value: number;          // Absolute risk contribution
  relativeContribution: number;  // % of total risk
  children?: RiskNode[];
  color?: string;
}

const riskData: RiskNode = {
  name: 'Total Portfolio Risk',
  value: 12.5,
  children: [
    {
      name: 'Equity Risk',
      value: 8.2,
      relativeContribution: 65.6,
      children: [
        {
          name: 'US Large Cap',
          value: 4.5,
          relativeContribution: 36.0,
          children: [
            { name: 'Market Beta', value: 3.2, relativeContribution: 25.6, color: '#ef4444' },
            { name: 'Sector: Tech', value: 0.8, relativeContribution: 6.4, color: '#f97316' },
            { name: 'Specific Risk', value: 0.5, relativeContribution: 4.0, color: '#eab308' },
          ]
        },
        // ... more equity categories
      ]
    },
    {
      name: 'Fixed Income Risk',
      value: 3.1,
      relativeContribution: 24.8,
      children: [
        { name: 'Duration Risk', value: 2.0, relativeContribution: 16.0, color: '#3b82f6' },
        { name: 'Credit Risk', value: 1.1, relativeContribution: 8.8, color: '#06b6d4' },
      ]
    },
    {
      name: 'Diversification Benefit',
      value: -1.2,
      relativeContribution: -9.6,
      color: '#10b981'
    }
  ]
};

export function RiskTreemap({ data }: { data: RiskNode }) {
  const [zoom, setZoom] = useState<string[]>(['Total Portfolio Risk']);

  const currentLevel = useMemo(() => {
    let node = data;
    for (const segment of zoom) {
      node = node.children?.find(c => c.name === segment) || node;
    }
    return node;
  }, [data, zoom]);

  return (
    <div className="space-y-4">
      {/* Breadcrumb navigation */}
      <div className="flex gap-2">
        {zoom.map((segment, i) => (
          <button
            key={i}
            onClick={() => setZoom(zoom.slice(0, i + 1))}
            className="text-sm hover:underline"
          >
            {segment} {i < zoom.length - 1 && '›'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <Treemap
          data={currentLevel.children || [currentLevel]}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#fff"
          fill="#00f0db"
          content={<CustomTreemapCell onClick={(node) => {
            if (node.children) setZoom([...zoom, node.name]);
          }} />}
        />
      </ResponsiveContainer>
    </div>
  );
}
```

**Metrics Displayed:**
- **Size:** Absolute risk contribution (variance units)
- **Color:** Relative contribution (% of total risk)
- **Tooltip:** Security name, weight, beta, specific risk

**Complexity:** Medium (8-10 hours)
**Dependencies:** Enhanced risk decomposition from FastAPI

---

### 2.3 Animated Scenario Transitions (P2 - POLISH)

**Current:** Instant chart updates when changing scenarios
**Enhanced:** Smooth animated transitions between capital market assumptions

**Implementation:**
```typescript
// Using motion (Framer Motion) for smooth number transitions
import { motion, useSpring } from 'motion/react';

export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const spring = useSpring(value, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.span>
      {spring.get().toFixed(2)}%
    </motion.span>
  );
}

// For chart transitions
export function AnimatedLineChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke="#00f0db"
          strokeWidth={2}
          animationDuration={800}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Animations:**
- **Monte Carlo paths:** Staggered fade-in (show 100 paths over 2 seconds)
- **Efficient frontier:** Morph between constraint templates
- **Risk decomposition:** Bars grow from zero with easing
- **Number counters:** Spring animations for KPI cards

**Why It Matters:**
- Helps users track what changed between scenarios
- Reduces cognitive load vs instant updates
- Professional polish (perception of quality)

**Complexity:** Low (4-6 hours across all pages)
**Dependencies:** motion library already installed

---

### 2.4 Responsive Mobile Optimization (P1 - CRITICAL)

**Current:** Desktop-first design, poor mobile experience
**Enhanced:** Touch-optimized charts, collapsible panels, mobile-first parameter entry

**Key Changes:**
```typescript
// Touch-friendly chart tooltips
import { ResponsiveContainer, LineChart, Tooltip } from 'recharts';

export function MobileOptimizedChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <Tooltip
          // Larger touch target
          wrapperStyle={{ pointerEvents: 'auto' }}
          contentStyle={{
            padding: '16px',
            fontSize: '16px',
            touchAction: 'none'
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#00f0db"
          strokeWidth={3}  // Thicker for visibility
          dot={{ r: 6 }}  // Larger touch targets
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Collapsible parameter panels
export function ParameterPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:sticky lg:top-4 lg:max-h-screen lg:overflow-y-auto">
      {/* Mobile: Collapse by default */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full p-4 bg-gray-100 flex justify-between"
      >
        <span>Parameters</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      <div className={`${isOpen ? 'block' : 'hidden'} lg:block`}>
        {/* Parameter inputs */}
      </div>
    </div>
  );
}
```

**Mobile Enhancements:**
- **Input:** Number spinners with +/- buttons vs keyboard
- **Charts:** Swipe to pan, pinch to zoom
- **Tables:** Horizontal scroll with sticky first column
- **Navigation:** Bottom tab bar vs top menu
- **Forms:** Single-column layout with larger touch targets

**Testing Strategy:**
- **Devices:** iPhone SE (375px), iPad (768px), desktop (1920px)
- **Gestures:** Swipe, pinch, tap, long-press
- **Orientation:** Portrait and landscape
- **Performance:** 60fps animations on iPhone 12+

**Complexity:** Medium (12-16 hours for all tools)
**Dependencies:** Tailwind responsive utilities, CSS touch-action

---

## 3. Machine Learning Enhancements

### 3.1 Regime Detection for Risk Models (P1 - HIGH VALUE)

**Current:** Single covariance matrix for all scenarios
**Enhanced:** Detect market regimes (low vol, high vol, crisis) and adjust risk models dynamically

**Why It Matters:**
- Covariances are NOT stationary (2008 crisis vs 2020-2021 bull market)
- Traditional EWMA overfits recent data
- Regime-aware models improve out-of-sample accuracy by 15-30% (research: Ang & Bekaert 2002)

**Implementation:**
```python
# api-service/regime_detector.py
import numpy as np
import pandas as pd
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler

class RegimeDetector:
    """
    Detect market regimes using Hidden Markov Model (HMM) or GMM
    on rolling volatility + correlation metrics
    """
    def __init__(self, n_regimes: int = 3):
        self.n_regimes = n_regimes
        self.model = GaussianMixture(
            n_components=n_regimes,
            covariance_type='full',
            n_init=10,
            random_state=42
        )
        self.scaler = StandardScaler()

    def fit(self, returns: pd.DataFrame) -> None:
        """
        Fit regime model on historical return series
        Features: rolling vol, rolling correlation, skewness, kurtosis
        """
        features = self._extract_features(returns)
        features_scaled = self.scaler.fit_transform(features)
        self.model.fit(features_scaled)

    def predict_current_regime(self, returns: pd.DataFrame) -> dict:
        """
        Predict current regime based on recent data
        Returns: {regime_id, probability, covariance_matrix}
        """
        features = self._extract_features(returns)
        features_scaled = self.scaler.transform(features[-1:])

        regime = self.model.predict(features_scaled)[0]
        proba = self.model.predict_proba(features_scaled)[0]

        # Get regime-specific covariance
        cov_matrix = self._regime_covariance(returns, regime)

        return {
            'regime_id': int(regime),
            'regime_name': self._regime_labels()[regime],
            'probability': float(proba[regime]),
            'covariance': cov_matrix.tolist(),
            'expected_duration_days': self._expected_duration(regime),
        }

    def _extract_features(self, returns: pd.DataFrame) -> np.ndarray:
        """Extract regime features from return series"""
        window = 60  # 60-day rolling window

        features = []
        for i in range(window, len(returns)):
            window_returns = returns.iloc[i-window:i]

            features.append([
                window_returns.std().mean(),  # Average volatility
                window_returns.corr().values[np.triu_indices_from(window_returns.corr().values, k=1)].mean(),  # Avg correlation
                window_returns.skew().mean(),  # Average skewness
                window_returns.kurtosis().mean(),  # Average kurtosis
                (window_returns < -0.02).sum().sum(),  # Number of large negative days
            ])

        return np.array(features)

    def _regime_labels(self) -> list[str]:
        """Human-readable regime names based on characteristics"""
        return ['Low Volatility', 'Normal Market', 'High Volatility']

    def _regime_covariance(self, returns: pd.DataFrame, regime: int) -> pd.DataFrame:
        """Calculate covariance matrix for specific regime"""
        # Identify historical periods in this regime
        all_regimes = self.model.predict(self.scaler.transform(self._extract_features(returns)))
        regime_mask = all_regimes == regime

        # Calculate covariance using only regime-specific data
        regime_returns = returns.iloc[60:][regime_mask]  # Skip first 60 rows (rolling window)
        return regime_returns.cov()

    def _expected_duration(self, regime: int) -> float:
        """Estimate how long current regime typically lasts (in days)"""
        # Use transition matrix to estimate duration
        # E[duration] = 1 / (1 - P(stay in regime))
        # Simplified: return average historical duration
        return 45.0  # Placeholder
```

**Frontend Integration:**
```typescript
// components/risk-contribution/RegimeIndicator.tsx
export function RegimeIndicator() {
  const [regime, setRegime] = useState<RegimeData | null>(null);

  useEffect(() => {
    fetch('/api/risk/regime')
      .then(r => r.json())
      .then(setRegime);
  }, []);

  if (!regime) return <LoadingSpinner />;

  const colors = {
    0: '#10b981',  // Low vol = green
    1: '#3b82f6',  // Normal = blue
    2: '#ef4444',  // High vol = red
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Current Market Regime</h3>
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: colors[regime.regime_id] }}
        />
        <span className="text-lg">{regime.regime_name}</span>
        <span className="text-sm text-gray-500">
          ({(regime.probability * 100).toFixed(1)}% confidence)
        </span>
      </div>

      <p className="text-sm text-gray-600 mt-2">
        Expected duration: ~{regime.expected_duration_days} days
      </p>

      <button
        onClick={() => applyRegimeCovariance(regime.covariance)}
        className="mt-3 btn-primary"
      >
        Use regime-adjusted risk model
      </button>
    </div>
  );
}
```

**Research Foundation:**
- Ang, A., & Bekaert, G. (2002). "Regime Switches in Interest Rates." *Journal of Business & Economic Statistics*
- Hardy, M. (2001). "A Regime-Switching Model of Long-Term Stock Returns." *North American Actuarial Journal*

**Complexity:** High (20-24 hours for full implementation)
**Dependencies:** scikit-learn, pandas, 5+ years historical return data
**Testing:** Backtest on 2008, 2020, 2022 crisis periods

---

### 3.2 Return Prediction Confidence Intervals (P2 - STRATEGIC)

**Current:** Point estimates for expected returns (e.g., 8.5% for US equities)
**Enhanced:** Distribution of possible returns with confidence bands

**Implementation:**
```python
# api-service/prediction_intervals.py
import numpy as np
from scipy import stats
from sklearn.ensemble import GradientBoostingRegressor

class ReturnPredictor:
    """
    Predict asset class returns with uncertainty quantification
    Uses quantile regression to estimate 5th, 50th, 95th percentiles
    """
    def __init__(self):
        # Train 3 models: lower bound, median, upper bound
        self.models = {
            'lower': GradientBoostingRegressor(loss='quantile', alpha=0.05),
            'median': GradientBoostingRegressor(loss='quantile', alpha=0.50),
            'upper': GradientBoostingRegressor(loss='quantile', alpha=0.95),
        }

    def fit(self, features: pd.DataFrame, returns: pd.Series):
        """
        Train on historical data
        Features: valuation metrics, macro indicators, sentiment
        """
        for model in self.models.values():
            model.fit(features, returns)

    def predict_distribution(self, current_features: pd.DataFrame) -> dict:
        """
        Predict return distribution for current market conditions
        Returns: {lower_bound, median, upper_bound, distribution}
        """
        predictions = {
            name: model.predict(current_features)[0]
            for name, model in self.models.items()
        }

        # Fit skewed normal distribution to match quantiles
        mu = predictions['median']
        sigma = (predictions['upper'] - predictions['lower']) / (2 * 1.96)  # Approx
        skew = self._estimate_skew(predictions)

        return {
            'expected_return': mu,
            'confidence_90': (predictions['lower'], predictions['upper']),
            'volatility': sigma,
            'skewness': skew,
            'distribution': self._generate_distribution(mu, sigma, skew),
        }

    def _estimate_skew(self, predictions: dict) -> float:
        """Estimate skewness from asymmetric confidence interval"""
        lower_width = predictions['median'] - predictions['lower']
        upper_width = predictions['upper'] - predictions['median']
        return (upper_width - lower_width) / (upper_width + lower_width)

    def _generate_distribution(self, mu: float, sigma: float, skew: float) -> list[float]:
        """Generate 1000-point probability distribution"""
        # Use skewed normal distribution
        x = np.linspace(mu - 3*sigma, mu + 3*sigma, 1000)
        pdf = stats.skewnorm.pdf(x, a=skew, loc=mu, scale=sigma)
        return x.tolist(), pdf.tolist()
```

**Visualization:**
```typescript
// components/capital-market-assumptions/ReturnDistribution.tsx
import { LineChart, Area, XAxis, YAxis, ReferenceLine } from 'recharts';

export function ReturnDistribution({ assetClass }: { assetClass: string }) {
  const [dist, setDist] = useState<ReturnDistribution | null>(null);

  useEffect(() => {
    fetch(`/api/cma/distribution?asset=${assetClass}`)
      .then(r => r.json())
      .then(setDist);
  }, [assetClass]);

  if (!dist) return <LoadingSpinner />;

  const chartData = dist.distribution[0].map((x, i) => ({
    return: x,
    probability: dist.distribution[1][i],
  }));

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{assetClass} Return Distribution</h3>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <Stat
          label="Expected Return"
          value={`${(dist.expected_return * 100).toFixed(1)}%`}
        />
        <Stat
          label="90% Confidence"
          value={`${(dist.confidence_90[0] * 100).toFixed(1)}% to ${(dist.confidence_90[1] * 100).toFixed(1)}%`}
        />
        <Stat
          label="Downside Risk"
          value={`${(dist.confidence_90[0] * 100).toFixed(1)}%`}
          color="red"
        />
      </div>

      {/* Distribution chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="return"
            label={{ value: 'Annual Return', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            label={{ value: 'Probability Density', angle: -90, position: 'insideLeft' }}
          />

          {/* Shaded area under curve */}
          <Area
            type="monotone"
            dataKey="probability"
            fill="#00f0db"
            fillOpacity={0.3}
            stroke="#00f0db"
            strokeWidth={2}
          />

          {/* Reference lines for confidence interval */}
          <ReferenceLine
            x={dist.confidence_90[0]}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label="5th %ile"
          />
          <ReferenceLine
            x={dist.expected_return}
            stroke="#10b981"
            strokeWidth={2}
            label="Median"
          />
          <ReferenceLine
            x={dist.confidence_90[1]}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label="95th %ile"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Use Cases:**
- Risk-aware optimization: Prefer assets with tighter confidence bands
- Stress testing: Use 5th percentile returns for worst-case scenarios
- Client communication: "We expect 6-10% with 90% confidence"
- Regime-dependent returns: Confidence widens in high-vol regimes

**Complexity:** High (16-20 hours including model training)
**Dependencies:** Historical factor data, macro indicators, trained ML models

---

### 3.3 Anomaly Detection in Portfolio Behavior (P2 - POLISH)

**Current:** No alerts for unusual portfolio behavior
**Enhanced:** ML-based anomaly detection for risk spikes, tracking error divergence, concentration

**Implementation:**
```python
# api-service/anomaly_detector.py
from sklearn.ensemble import IsolationForest
import pandas as pd

class PortfolioAnomalyDetector:
    """
    Detect unusual portfolio behavior using Isolation Forest
    Monitors: risk spikes, tracking error, turnover, concentration
    """
    def __init__(self):
        self.model = IsolationForest(
            contamination=0.05,  # Expect 5% of observations to be anomalies
            random_state=42
        )
        self.feature_names = []

    def fit(self, historical_portfolios: pd.DataFrame):
        """Train on historical portfolio snapshots"""
        features = self._extract_features(historical_portfolios)
        self.feature_names = features.columns.tolist()
        self.model.fit(features)

    def detect(self, current_portfolio: dict) -> dict:
        """
        Check if current portfolio exhibits anomalous behavior
        Returns: {is_anomaly, risk_score, anomalous_features}
        """
        features = self._extract_features(pd.DataFrame([current_portfolio]))
        prediction = self.model.predict(features)[0]
        score = self.model.score_samples(features)[0]

        # Identify which features are driving anomaly
        if prediction == -1:  # Anomaly detected
            anomalous_features = self._identify_anomalous_features(
                features, current_portfolio
            )
        else:
            anomalous_features = []

        return {
            'is_anomaly': prediction == -1,
            'risk_score': float(score),
            'anomalous_features': anomalous_features,
            'recommendations': self._generate_recommendations(anomalous_features),
        }

    def _extract_features(self, portfolios: pd.DataFrame) -> pd.DataFrame:
        """Extract features for anomaly detection"""
        return pd.DataFrame({
            'total_risk': portfolios['risk'],
            'tracking_error': portfolios['tracking_error'],
            'concentration_hhi': portfolios['concentration'],
            'turnover': portfolios['turnover'],
            'beta_market': portfolios['beta'],
            'num_positions': portfolios['num_positions'],
            'max_position_weight': portfolios['max_weight'],
        })

    def _identify_anomalous_features(self, features: pd.DataFrame, portfolio: dict) -> list:
        """Determine which metrics are unusual"""
        anomalies = []

        # Simple approach: check which features are >2 std devs from training mean
        # (In production, use SHAP values for better interpretability)
        feature_values = features.iloc[0]

        if feature_values['total_risk'] > portfolio['risk'] * 1.5:
            anomalies.append({
                'feature': 'Total Risk',
                'value': feature_values['total_risk'],
                'severity': 'high',
                'message': 'Portfolio risk is 50% higher than usual'
            })

        if feature_values['concentration_hhi'] > 0.3:
            anomalies.append({
                'feature': 'Concentration',
                'value': feature_values['concentration_hhi'],
                'severity': 'medium',
                'message': 'Portfolio is unusually concentrated in few holdings'
            })

        return anomalies

    def _generate_recommendations(self, anomalies: list) -> list:
        """Suggest actions to address anomalies"""
        recommendations = []

        for anomaly in anomalies:
            if anomaly['feature'] == 'Total Risk':
                recommendations.append('Consider reducing position sizes or adding low-correlation assets')
            elif anomaly['feature'] == 'Concentration':
                recommendations.append('Diversify holdings across more securities or sectors')

        return recommendations
```

**Frontend Alerts:**
```typescript
// components/risk-contribution/AnomalyAlert.tsx
export function AnomalyAlert() {
  const [anomaly, setAnomaly] = useState<AnomalyData | null>(null);

  useEffect(() => {
    const checkAnomalies = async () => {
      const response = await fetch('/api/risk/anomaly-check', {
        method: 'POST',
        body: JSON.stringify({ portfolioId: currentPortfolioId }),
      });
      const data = await response.json();
      if (data.is_anomaly) setAnomaly(data);
    };

    checkAnomalies();
    const interval = setInterval(checkAnomalies, 60000);  // Check every minute
    return () => clearInterval(interval);
  }, [currentPortfolioId]);

  if (!anomaly) return null;

  return (
    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-900">Unusual Portfolio Behavior Detected</h4>

          <ul className="mt-2 space-y-1">
            {anomaly.anomalous_features.map((feature, i) => (
              <li key={i} className="text-sm text-red-800">
                • {feature.message}
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-1">
            <p className="text-sm font-medium text-red-900">Recommendations:</p>
            {anomaly.recommendations.map((rec, i) => (
              <p key={i} className="text-sm text-red-700">→ {rec}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Triggers:**
- Risk spike >30% from historical baseline
- Tracking error >200% of target
- Concentration: Top 5 holdings >60% of portfolio
- Turnover >50% in single day
- Beta shift >0.5 from policy

**Complexity:** Medium (10-12 hours)
**Dependencies:** Historical portfolio snapshots, trained Isolation Forest model

---

## 4. Collaboration Features

### 4.1 Multi-User Portfolio Comparison (P1 - HIGH VALUE)

**Current:** Single portfolio analysis only
**Enhanced:** Side-by-side comparison of up to 4 portfolios with delta highlighting

**Implementation:**
```typescript
// components/portfolio-evaluation/PortfolioComparison.tsx
interface ComparisonPortfolio {
  id: string;
  name: string;
  metrics: PortfolioMetrics;
  holdings: PortfolioHoldings;
  color: string;
}

export function PortfolioComparison() {
  const [portfolios, setPortfolios] = useState<ComparisonPortfolio[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'return' | 'risk' | 'sharpe'>('sharpe');

  const addPortfolio = async (portfolioId: string) => {
    const response = await fetch(`/api/portfolios/${portfolioId}/metrics`);
    const data = await response.json();

    setPortfolios(prev => [...prev, {
      ...data,
      color: COMPARISON_COLORS[prev.length]
    }]);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio selector */}
      <div className="flex gap-4">
        <select
          onChange={(e) => addPortfolio(e.target.value)}
          className="flex-1"
        >
          <option>Add portfolio to compare...</option>
          {availablePortfolios.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={() => setPortfolios([])}
          disabled={portfolios.length === 0}
        >
          Clear All
        </button>
      </div>

      {/* Comparison table */}
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Metric</th>
            {portfolios.map(p => (
              <th key={p.id} className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRICS_TO_COMPARE.map(metric => (
            <tr key={metric.key}>
              <td className="font-medium">{metric.label}</td>
              {portfolios.map(p => {
                const value = p.metrics[metric.key];
                const best = getBestPortfolio(portfolios, metric.key);
                const isBest = p.id === best.id;

                return (
                  <td
                    key={p.id}
                    className={`text-right ${isBest ? 'font-bold text-green-600' : ''}`}
                  >
                    {metric.format(value)}
                    {isBest && <span className="ml-2">✓</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Efficient frontier overlay */}
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <XAxis dataKey="risk" label="Risk (Volatility)" />
          <YAxis dataKey="return" label="Expected Return" />
          <Tooltip />

          {/* Efficient frontier line */}
          <Line
            data={frontierPoints}
            type="monotone"
            dataKey="return"
            stroke="#e5e5e5"
            strokeWidth={2}
            dot={false}
          />

          {/* Portfolio markers */}
          {portfolios.map(p => (
            <Scatter
              key={p.id}
              data={[{ risk: p.metrics.risk, return: p.metrics.return }]}
              fill={p.color}
              name={p.name}
            >
              <Cell key={p.id} fill={p.color} />
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>

      {/* Holdings difference */}
      <div>
        <h3 className="font-semibold mb-2">Holdings Comparison</h3>
        <HoldingsDiffTable portfolios={portfolios} />
      </div>
    </div>
  );
}

function HoldingsDiffTable({ portfolios }: { portfolios: ComparisonPortfolio[] }) {
  // Merge all holdings
  const allHoldings = new Set<string>();
  portfolios.forEach(p => {
    Object.keys(p.holdings).forEach(holding => allHoldings.add(holding));
  });

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className="text-left">Security</th>
          {portfolios.map(p => (
            <th key={p.id} className="text-right">{p.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from(allHoldings).map(holding => (
          <tr key={holding}>
            <td>{holding}</td>
            {portfolios.map(p => {
              const weight = p.holdings[holding] || 0;
              const maxWeight = Math.max(...portfolios.map(pp => pp.holdings[holding] || 0));
              const isMax = weight === maxWeight && weight > 0;

              return (
                <td
                  key={p.id}
                  className="text-right"
                  style={{
                    backgroundColor: isMax ? `${p.color}20` : 'transparent'
                  }}
                >
                  {weight > 0 ? `${(weight * 100).toFixed(1)}%` : '—'}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Use Cases:**
- Compare client portfolio vs model portfolio
- Benchmark multiple strategies (aggressive, moderate, conservative)
- Before/after rebalancing comparison
- Competitive analysis (our portfolio vs competitor)

**Complexity:** Medium (8-10 hours)
**Dependencies:** None, uses existing portfolio API

---

### 4.2 Saved Scenarios & Templates (P1 - HIGH VALUE)

**Current:** Parameters reset on page reload
**Enhanced:** Save/load named scenarios for repeated analysis

**Implementation:**
```typescript
// lib/scenarios/storage.ts
interface SavedScenario {
  id: string;
  name: string;
  description: string;
  tool: 'monte-carlo' | 'portfolio-evaluation' | 'risk-contribution' | 'cma';
  parameters: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export class ScenarioStorage {
  private storageKey = 'alti:saved-scenarios';

  /**
   * Save scenario to localStorage (or backend DB in production)
   */
  save(scenario: Omit<SavedScenario, 'id' | 'createdAt' | 'updatedAt'>): SavedScenario {
    const scenarios = this.listAll();

    const newScenario: SavedScenario = {
      ...scenario,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    scenarios.push(newScenario);
    localStorage.setItem(this.storageKey, JSON.stringify(scenarios));

    return newScenario;
  }

  /**
   * Load scenario by ID
   */
  load(id: string): SavedScenario | null {
    const scenarios = this.listAll();
    return scenarios.find(s => s.id === id) || null;
  }

  /**
   * List all saved scenarios for a tool
   */
  listByTool(tool: SavedScenario['tool']): SavedScenario[] {
    return this.listAll().filter(s => s.tool === tool);
  }

  /**
   * List all scenarios
   */
  listAll(): SavedScenario[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Delete scenario
   */
  delete(id: string): void {
    const scenarios = this.listAll().filter(s => s.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(scenarios));
  }

  /**
   * Update scenario
   */
  update(id: string, updates: Partial<SavedScenario>): void {
    const scenarios = this.listAll();
    const index = scenarios.findIndex(s => s.id === id);

    if (index !== -1) {
      scenarios[index] = {
        ...scenarios[index],
        ...updates,
        updatedAt: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(scenarios));
    }
  }
}

export const scenarioStorage = new ScenarioStorage();
```

**Component Integration:**
```typescript
// components/shared/ScenarioManager.tsx
export function ScenarioManager({ tool, currentParams, onLoad }: ScenarioManagerProps) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [showSave, setShowSave] = useState(false);

  useEffect(() => {
    setScenarios(scenarioStorage.listByTool(tool));
  }, [tool]);

  const handleSave = (name: string, description: string) => {
    const scenario = scenarioStorage.save({
      name,
      description,
      tool,
      parameters: currentParams,
    });
    setScenarios(prev => [...prev, scenario]);
    setShowSave(false);
  };

  const handleLoad = (scenario: SavedScenario) => {
    onLoad(scenario.parameters);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Saved Scenarios</h3>
        <button onClick={() => setShowSave(true)} className="btn-secondary">
          Save Current
        </button>
      </div>

      {/* Scenario list */}
      <div className="space-y-2">
        {scenarios.length === 0 ? (
          <p className="text-sm text-gray-500">No saved scenarios yet</p>
        ) : (
          scenarios.map(scenario => (
            <div
              key={scenario.id}
              className="p-3 border rounded hover:bg-gray-50 flex justify-between items-start"
            >
              <div className="flex-1">
                <h4 className="font-medium">{scenario.name}</h4>
                <p className="text-sm text-gray-600">{scenario.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Last updated {formatDate(scenario.updatedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoad(scenario)}
                  className="btn-sm btn-primary"
                >
                  Load
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this scenario?')) {
                      scenarioStorage.delete(scenario.id);
                      setScenarios(prev => prev.filter(s => s.id !== scenario.id));
                    }
                  }}
                  className="btn-sm btn-secondary"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save dialog */}
      {showSave && (
        <SaveScenarioDialog
          onSave={handleSave}
          onCancel={() => setShowSave(false)}
        />
      )}
    </div>
  );
}
```

**Pre-Built Templates:**
```typescript
// lib/scenarios/templates.ts
export const SCENARIO_TEMPLATES = {
  'monte-carlo': [
    {
      name: 'Retirement Planning (Conservative)',
      description: '30-year projection, 4% annual spending, 5% return, 10% vol',
      parameters: {
        initialValue: 2000000,
        yearsToProject: 30,
        annualReturn: 0.05,
        annualVolatility: 0.10,
        quarterlyFixedSpending: 20000,
        quarterlyPercentSpending: 0,
        numSimulations: 10000,
      },
    },
    {
      name: 'Wealth Accumulation (Aggressive)',
      description: '20-year accumulation, no spending, 8% return, 18% vol',
      parameters: {
        initialValue: 500000,
        yearsToProject: 20,
        annualReturn: 0.08,
        annualVolatility: 0.18,
        quarterlyFixedSpending: 0,
        quarterlyPercentSpending: 0,
        numSimulations: 10000,
      },
    },
  ],
  'portfolio-evaluation': [
    {
      name: '60/40 Traditional',
      description: 'Classic 60% equity, 40% fixed income allocation',
      parameters: {
        targetReturn: 0.065,
        mode: 'multi-asset',
        constraints: 'traditional',
        capsTemplate: '60-40',
      },
    },
    {
      name: 'ESG Focused',
      description: 'Sustainable investing with ESG constraints',
      parameters: {
        targetReturn: 0.06,
        mode: 'multi-asset',
        constraints: 'esg-focused',
        capsTemplate: 'esg',
      },
    },
  ],
};
```

**Sharing:**
```typescript
// Export/import scenarios as JSON
export function exportScenario(scenario: SavedScenario): string {
  return JSON.stringify(scenario, null, 2);
}

export function importScenario(json: string): SavedScenario {
  const scenario = JSON.parse(json);
  return scenarioStorage.save(scenario);
}

// Share via URL (base64 encode parameters)
export function getShareableLink(scenario: SavedScenario): string {
  const encoded = btoa(JSON.stringify(scenario.parameters));
  return `${window.location.origin}/${scenario.tool}?scenario=${encoded}`;
}
```

**Complexity:** Medium (10-12 hours for full implementation)
**Dependencies:** localStorage (client-side), optional backend for team sharing

---

### 4.3 Comments & Annotations on Analysis (P2 - STRATEGIC)

**Current:** No collaboration features
**Enhanced:** Add comments to charts, tag team members, track decision history

**Implementation:**
```typescript
// lib/comments/types.ts
interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  attachedTo: {
    tool: string;
    page: string;
    chartId?: string;
    portfolioId?: string;
  };
  position?: { x: number; y: number };  // For chart annotations
  mentions: string[];  // User IDs mentioned with @
  resolved: boolean;
}

// components/shared/CommentThread.tsx
export function CommentThread({ attachedTo }: { attachedTo: Comment['attachedTo'] }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ attachedTo }),
    })
      .then(r => r.json())
      .then(setComments);
  }, [attachedTo]);

  const handleSubmit = async () => {
    const comment = await fetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        text: newComment,
        attachedTo,
        mentions: extractMentions(newComment),
      }),
    }).then(r => r.json());

    setComments(prev => [...prev, comment]);
    setNewComment('');

    // Send notifications to mentioned users
    comment.mentions.forEach(userId => {
      sendNotification(userId, `You were mentioned in a comment on ${attachedTo.tool}`);
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Discussion</h3>

      {/* Comment list */}
      <div className="space-y-3">
        {comments.map(comment => (
          <div key={comment.id} className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Avatar userId={comment.userId} />
                <span className="font-medium">{comment.userName}</span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(comment.timestamp)}
              </span>
            </div>
            <p className="text-sm">{renderCommentText(comment.text)}</p>
            {comment.resolved && (
              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Resolved
              </span>
            )}
          </div>
        ))}
      </div>

      {/* New comment input */}
      <div className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... Use @name to mention someone"
          className="w-full p-3 border rounded"
          rows={3}
        />
        <button onClick={handleSubmit} className="btn-primary">
          Post Comment
        </button>
      </div>
    </div>
  );
}

// Chart annotation overlay
export function ChartWithAnnotations({ children, chartId }: { children: ReactNode; chartId: string }) {
  const [annotations, setAnnotations] = useState<Comment[]>([]);
  const [showNewAnnotation, setShowNewAnnotation] = useState<{ x: number; y: number } | null>(null);

  const handleChartClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {  // Shift+click to add annotation
      const rect = e.currentTarget.getBoundingClientRect();
      setShowNewAnnotation({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div className="relative" onClick={handleChartClick}>
      {children}

      {/* Annotation markers */}
      {annotations.map(annotation => (
        <button
          key={annotation.id}
          className="absolute w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            left: annotation.position!.x,
            top: annotation.position!.y,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={() => openAnnotationDialog(annotation)}
        >
          💬
        </button>
      ))}

      {/* New annotation dialog */}
      {showNewAnnotation && (
        <AnnotationDialog
          position={showNewAnnotation}
          onSave={(text) => {
            saveAnnotation(chartId, showNewAnnotation, text);
            setShowNewAnnotation(null);
          }}
          onCancel={() => setShowNewAnnotation(null)}
        />
      )}
    </div>
  );
}
```

**Features:**
- Threaded comments per tool/portfolio
- @mentions with email notifications
- Chart annotations (click to add note at specific point)
- Resolve/unresolve discussions
- Comment history and audit trail

**Complexity:** High (20-24 hours including backend)
**Dependencies:** User authentication, notification system (email or in-app)
**Storage:** PostgreSQL or MongoDB for comments, Redis for real-time updates

---

### 4.4 Export to Presentation Formats (P1 - HIGH VALUE)

**Current:** CSV export only
**Enhanced:** PowerPoint, PDF, Word exports with customizable templates

**Implementation:**
```typescript
// lib/exports/powerpoint.ts
import PptxGenJS from 'pptxgenjs';

export async function exportToPowerPoint(analysisData: AnalysisData): Promise<Blob> {
  const pptx = new PptxGenJS();

  // Set AlTi branding
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'AlTi Global';
  pptx.company = 'AlTi Global Investment Group';
  pptx.subject = 'Portfolio Analysis';
  pptx.title = analysisData.portfolioName;

  // Slide 1: Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: '010203' };
  titleSlide.addText(analysisData.portfolioName, {
    x: 0.5,
    y: 2.5,
    w: '90%',
    fontSize: 44,
    color: '00f0db',
    bold: true,
    fontFace: 'Georgia',
  });
  titleSlide.addText('Portfolio Analysis Report', {
    x: 0.5,
    y: 3.5,
    w: '90%',
    fontSize: 24,
    color: 'ffffff',
    fontFace: 'Inter',
  });
  titleSlide.addText(new Date().toLocaleDateString(), {
    x: 0.5,
    y: 4.5,
    w: '90%',
    fontSize: 16,
    color: '757575',
    fontFace: 'Inter',
  });

  // Slide 2: Executive Summary (KPIs)
  const summarySlide = pptx.addSlide();
  summarySlide.addText('Executive Summary', {
    x: 0.5,
    y: 0.5,
    fontSize: 32,
    bold: true,
    color: '010203',
  });

  const kpis = [
    { label: 'Expected Return', value: `${(analysisData.return * 100).toFixed(1)}%`, color: '00f0db' },
    { label: 'Risk (Volatility)', value: `${(analysisData.risk * 100).toFixed(1)}%`, color: 'ef4444' },
    { label: 'Sharpe Ratio', value: analysisData.sharpe.toFixed(2), color: '10b981' },
    { label: 'Beta', value: analysisData.beta.toFixed(2), color: '3b82f6' },
  ];

  kpis.forEach((kpi, i) => {
    summarySlide.addShape(pptx.ShapeType.rect, {
      x: 0.5 + (i % 2) * 4.5,
      y: 1.5 + Math.floor(i / 2) * 1.5,
      w: 4,
      h: 1,
      fill: { color: 'f5f5f5' },
      line: { color: kpi.color, width: 3 },
    });

    summarySlide.addText(kpi.label, {
      x: 0.7 + (i % 2) * 4.5,
      y: 1.7 + Math.floor(i / 2) * 1.5,
      fontSize: 14,
      color: '757575',
    });

    summarySlide.addText(kpi.value, {
      x: 0.7 + (i % 2) * 4.5,
      y: 2.0 + Math.floor(i / 2) * 1.5,
      fontSize: 24,
      bold: true,
      color: kpi.color,
    });
  });

  // Slide 3: Efficient Frontier (chart as image)
  const frontierSlide = pptx.addSlide();
  frontierSlide.addText('Efficient Frontier', {
    x: 0.5,
    y: 0.5,
    fontSize: 32,
    bold: true,
  });

  // Capture chart as image (using html2canvas or similar)
  const chartImage = await captureChartAsImage('efficient-frontier-chart');
  frontierSlide.addImage({
    data: chartImage,
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 5,
  });

  // Slide 4: Holdings Breakdown (table)
  const holdingsSlide = pptx.addSlide();
  holdingsSlide.addText('Portfolio Holdings', {
    x: 0.5,
    y: 0.5,
    fontSize: 32,
    bold: true,
  });

  const tableData = [
    [{ text: 'Security', options: { bold: true } }, { text: 'Weight', options: { bold: true } }, { text: 'Return', options: { bold: true } }],
    ...analysisData.holdings.map(h => [h.name, `${(h.weight * 100).toFixed(1)}%`, `${(h.return * 100).toFixed(1)}%`])
  ];

  holdingsSlide.addTable(tableData, {
    x: 0.5,
    y: 1.5,
    w: 9,
    colW: [5, 2, 2],
    border: { pt: 1, color: 'e5e5e5' },
    fill: { color: 'ffffff' },
    color: '010203',
    fontSize: 14,
  });

  // Slide 5: Risk Decomposition
  const riskSlide = pptx.addSlide();
  riskSlide.addText('Risk Decomposition', {
    x: 0.5,
    y: 0.5,
    fontSize: 32,
    bold: true,
  });

  const riskChartImage = await captureChartAsImage('risk-decomposition-chart');
  riskSlide.addImage({
    data: riskChartImage,
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 5,
  });

  // Generate and return blob
  const blob = await pptx.write({ outputType: 'blob' });
  return blob as Blob;
}

// Helper to capture chart as base64 image
async function captureChartAsImage(chartId: string): Promise<string> {
  const chartElement = document.getElementById(chartId);
  if (!chartElement) throw new Error(`Chart ${chartId} not found`);

  // Use html2canvas or similar library
  const canvas = await html2canvas(chartElement, {
    backgroundColor: '#ffffff',
    scale: 2,  // High DPI
  });

  return canvas.toDataURL('image/png');
}

// Export function for component
export function ExportButton({ analysisData }: { analysisData: AnalysisData }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'pptx' | 'pdf' | 'docx') => {
    setExporting(true);

    try {
      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'pptx':
          blob = await exportToPowerPoint(analysisData);
          filename = `${analysisData.portfolioName}_analysis.pptx`;
          break;
        case 'pdf':
          blob = await exportToPDF(analysisData);
          filename = `${analysisData.portfolioName}_analysis.pdf`;
          break;
        case 'docx':
          blob = await exportToWord(analysisData);
          filename = `${analysisData.portfolioName}_analysis.docx`;
          break;
      }

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button onClick={() => handleExport('pptx')} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Export to PowerPoint'}
      </button>
      <button onClick={() => handleExport('pdf')} disabled={exporting}>
        Export to PDF
      </button>
      <button onClick={() => handleExport('docx')} disabled={exporting}>
        Export to Word
      </button>
    </div>
  );
}
```

**Templates:**
- **Executive Summary:** 1-page overview with KPIs
- **Detailed Analysis:** 10-15 slides with all charts and tables
- **Client Presentation:** Simplified, client-friendly language
- **Compliance Report:** Full audit trail and methodology

**Dependencies:**
- pptxgenjs (already installed)
- html2canvas for chart capture
- jsPDF for PDF generation
- docx for Word generation (already installed)

**Complexity:** Medium-High (14-18 hours for all formats)

---

## 5. Performance Optimizations

### 5.1 Intelligent Caching Strategies (P0 - CRITICAL)

**Current:** No caching, recalculate everything on every request
**Enhanced:** Multi-layer caching for expensive calculations

**Why Critical:** Monte Carlo (10K sims) takes 100ms client-side, but risk decomposition (LASSO regression) takes 2-5 seconds server-side. Caching can reduce this to <50ms.

**Implementation:**
```typescript
// lib/cache/strategy.ts
interface CacheConfig {
  ttl: number;  // Time to live in milliseconds
  maxSize: number;  // Max entries
  strategy: 'lru' | 'lfu' | 'fifo';
}

export class CacheManager {
  private cache: Map<string, { value: any; expiry: number; hits: number }>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.cache = new Map();
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count for LFU
    entry.hits++;
    return entry.value;
  }

  set(key: string, value: any): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + this.config.ttl,
      hits: 0,
    });
  }

  private evict(): void {
    if (this.config.strategy === 'lru') {
      // Remove oldest (first inserted)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    } else if (this.config.strategy === 'lfu') {
      // Remove least frequently used
      let minHits = Infinity;
      let keyToRemove = '';

      for (const [key, entry] of this.cache.entries()) {
        if (entry.hits < minHits) {
          minHits = entry.hits;
          keyToRemove = key;
        }
      }

      this.cache.delete(keyToRemove);
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Cache instances for different data types
export const portfolioCache = new CacheManager({
  ttl: 5 * 60 * 1000,  // 5 minutes
  maxSize: 100,
  strategy: 'lru',
});

export const riskCache = new CacheManager({
  ttl: 15 * 60 * 1000,  // 15 minutes (risk calcs are expensive)
  maxSize: 50,
  strategy: 'lfu',
});

export const cmaCache = new CacheManager({
  ttl: 60 * 60 * 1000,  // 1 hour (CMA data changes infrequently)
  maxSize: 20,
  strategy: 'lru',
});
```

**Cache Layers:**

1. **Browser Memory Cache (React state)**
   - Lifetime: Current page session
   - Use case: Avoid re-rendering same data
   - Example: Cached efficient frontier points

2. **localStorage Cache**
   - Lifetime: Until cleared by user
   - Use case: Recently viewed portfolios
   - Size limit: 5-10MB per domain

3. **Service Worker Cache (PWA)**
   - Lifetime: Configurable, survives page refresh
   - Use case: Offline access to static data (historical returns, CMA)
   - Size: 50MB+ (browser-dependent)

4. **Server-Side Redis Cache**
   - Lifetime: Minutes to hours
   - Use case: Risk calculations, optimization results
   - Example: Cache LASSO betas for 15 minutes

**Cache Invalidation:**
```typescript
// Invalidate cache when portfolio changes
export function usePortfolioWithCache(portfolioId: string) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  useEffect(() => {
    // Check cache first
    const cached = portfolioCache.get(portfolioId);
    if (cached) {
      setPortfolio(cached);
      return;
    }

    // Fetch from API
    fetch(`/api/portfolios/${portfolioId}`)
      .then(r => r.json())
      .then(data => {
        portfolioCache.set(portfolioId, data);
        setPortfolio(data);
      });
  }, [portfolioId]);

  const updatePortfolio = async (updates: Partial<Portfolio>) => {
    // Optimistic update
    setPortfolio(prev => prev ? { ...prev, ...updates } : null);

    // Invalidate cache
    portfolioCache.clear();

    // Update server
    const updated = await fetch(`/api/portfolios/${portfolioId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }).then(r => r.json());

    // Update cache and state
    portfolioCache.set(portfolioId, updated);
    setPortfolio(updated);
  };

  return { portfolio, updatePortfolio };
}
```

**Backend Caching (FastAPI + Redis):**
```python
# api-service/cache.py
import redis
import pickle
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cached(ttl: int = 900):  # 15 minutes default
    """
    Cache decorator for expensive functions
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key = f"cache:{func.__name__}:{hash(str(args) + str(kwargs))}"

            # Try to get from cache
            cached_value = redis_client.get(key)
            if cached_value:
                return pickle.loads(cached_value)

            # Compute result
            result = func(*args, **kwargs)

            # Store in cache
            redis_client.setex(key, ttl, pickle.dumps(result))

            return result
        return wrapper
    return decorator

# Usage example
@cached(ttl=900)  # Cache for 15 minutes
def compute_factor_risk_decomposition(portfolio_id: str) -> dict:
    # Expensive LASSO regression
    # ...
    return result
```

**Cache Performance Metrics:**
```typescript
// Track cache hit rate
export class CacheMetrics {
  private hits = 0;
  private misses = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

export const cacheMetrics = new CacheMetrics();

// Display in dev tools
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log('Cache hit rate:', (cacheMetrics.getHitRate() * 100).toFixed(1) + '%');
  }, 10000);
}
```

**Expected Performance Gains:**
- Risk decomposition: 2-5s → 50ms (40-100x faster)
- Portfolio load: 200ms → 10ms (20x faster)
- CMA data: 100ms → 5ms (20x faster)

**Complexity:** Medium (12-16 hours including Redis setup and testing)
**Dependencies:** Redis for server-side caching

---

### 5.2 Background Job Processing for Monte Carlo (P1 - HIGH VALUE)

**Current:** Client-side Monte Carlo blocks UI thread for 100ms
**Enhanced:** Web Worker for 100K+ simulations without blocking UI

**Implementation:**
```typescript
// lib/workers/monte-carlo.worker.ts
/// <reference lib="webworker" />

import { simulateMonteCarlo } from '../simulation';
import type { SimulationParams, SimulationResult } from '../types';

// Worker message handler
self.addEventListener('message', (e: MessageEvent<SimulationParams>) => {
  const params = e.data;

  try {
    // Run simulation (this runs in separate thread)
    const result = simulateMonteCarlo(params);

    // Send result back to main thread
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
});

// components/monte-carlo/SimulationRunner.tsx
export function useMonteCarloWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(
      new URL('../../lib/workers/monte-carlo.worker.ts', import.meta.url)
    );

    // Handle messages from worker
    workerRef.current.onmessage = (e) => {
      const { success, result, error } = e.data;

      if (success) {
        setResult(result);
        setError(null);
      } else {
        setError(error);
      }

      setIsRunning(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const runSimulation = useCallback((params: SimulationParams) => {
    setIsRunning(true);
    setError(null);
    workerRef.current?.postMessage(params);
  }, []);

  const cancel = useCallback(() => {
    // Terminate and recreate worker to cancel
    workerRef.current?.terminate();
    workerRef.current = new Worker(
      new URL('../../lib/workers/monte-carlo.worker.ts', import.meta.url)
    );
    setIsRunning(false);
  }, []);

  return { result, isRunning, error, runSimulation, cancel };
}

// Usage in component
export function MonteCarloSimulation() {
  const { result, isRunning, runSimulation, cancel } = useMonteCarloWorker();

  const handleRun = () => {
    runSimulation({
      numSimulations: 100000,  // 10x more sims than before!
      quarters: 120,
      initialValue: 2000000,
      annualReturn: 0.07,
      annualVolatility: 0.15,
      quarterlyFixedSpending: 20000,
      quarterlyPercentSpending: 0.01,
    });
  };

  return (
    <div>
      <button onClick={handleRun} disabled={isRunning}>
        {isRunning ? 'Running...' : 'Run Simulation'}
      </button>

      {isRunning && (
        <button onClick={cancel}>Cancel</button>
      )}

      {result && <ResultsChart data={result} />}
    </div>
  );
}
```

**Advanced: Progress Updates from Worker:**
```typescript
// lib/workers/monte-carlo-progressive.worker.ts
self.addEventListener('message', (e: MessageEvent<SimulationParams>) => {
  const params = e.data;
  const batchSize = 10000;  // Simulate 10K paths at a time
  const numBatches = Math.ceil(params.numSimulations / batchSize);

  let allPaths: number[][] = [];

  for (let i = 0; i < numBatches; i++) {
    // Simulate batch
    const batchResult = simulateMonteCarlo({
      ...params,
      numSimulations: Math.min(batchSize, params.numSimulations - i * batchSize),
    });

    allPaths = allPaths.concat(batchResult.paths);

    // Send progress update
    self.postMessage({
      type: 'progress',
      progress: (i + 1) / numBatches,
      pathsCompleted: allPaths.length,
    });
  }

  // Send final result
  const finalResult = calculateStatistics(allPaths);
  self.postMessage({
    type: 'complete',
    result: finalResult,
  });
});

// Component with progress bar
export function MonteCarloWithProgress() {
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL('../../lib/workers/monte-carlo-progressive.worker.ts', import.meta.url)
    );

    worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        setProgress(e.data.progress);
      } else if (e.data.type === 'complete') {
        setResult(e.data.result);
        setProgress(1);
      }
    };

    worker.postMessage(simulationParams);

    return () => worker.terminate();
  }, [simulationParams]);

  return (
    <>
      <ProgressBar value={progress * 100} max={100} />
      {result && <ResultsChart data={result} />}
    </>
  );
}
```

**Benefits:**
- UI remains responsive during 100K+ simulations
- Can run multiple simulations in parallel (multi-threaded)
- User can cancel long-running jobs
- Progress updates keep user informed

**Complexity:** Medium (8-10 hours)
**Dependencies:** Web Worker API (supported in all modern browsers)

---

### 5.3 Progressive Loading for Large Datasets (P1 - HIGH VALUE)

**Current:** Load entire return series (5+ years, 1,200+ rows) upfront
**Enhanced:** Paginate/virtualize large datasets, load on-demand

**Implementation:**
```typescript
// components/shared/VirtualizedTable.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedTable<T>({ data, columns }: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,  // Estimated row height
    overscan: 10,  // Render 10 extra rows above/below viewport
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = data[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="flex border-b">
                {columns.map(col => (
                  <div key={col.key} className="px-4 py-2 flex-1">
                    {col.render(row)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Usage example: Display 10,000 return observations without lag
export function ReturnSeriesTable() {
  const [returns, setReturns] = useState<ReturnObservation[]>([]);

  useEffect(() => {
    fetch('/api/data/returns/full-history')
      .then(r => r.json())
      .then(setReturns);
  }, []);

  return (
    <VirtualizedTable
      data={returns}
      columns={[
        { key: 'date', label: 'Date', render: (r) => r.date },
        { key: 'return', label: 'Return', render: (r) => `${(r.return * 100).toFixed(2)}%` },
        { key: 'cumulative', label: 'Cumulative', render: (r) => `${(r.cumulative * 100).toFixed(2)}%` },
      ]}
    />
  );
}
```

**Infinite Scroll for API Data:**
```typescript
// lib/hooks/useInfiniteScroll.ts
export function useInfiniteScroll<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<T[]>,
  pageSize: number = 50
) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const newData = await fetchFunction(page, pageSize);

    if (newData.length < pageSize) {
      setHasMore(false);
    }

    setData(prev => [...prev, ...newData]);
    setPage(prev => prev + 1);
    setLoading(false);
  };

  // Auto-load when scrolled to bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;

      if (scrolledToBottom) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []);

  return { data, loading, hasMore, loadMore };
}

// Usage
export function PortfolioList() {
  const { data, loading, hasMore } = useInfiniteScroll(
    (page, pageSize) =>
      fetch(`/api/portfolios?page=${page}&size=${pageSize}`)
        .then(r => r.json()),
    50
  );

  return (
    <div>
      {data.map(portfolio => (
        <PortfolioCard key={portfolio.id} portfolio={portfolio} />
      ))}

      {loading && <LoadingSpinner />}
      {!hasMore && <p>No more portfolios to load</p>}
    </div>
  );
}
```

**Lazy Loading Charts:**
```typescript
// Defer non-critical chart rendering
import { lazy, Suspense } from 'react';

const EfficientFrontierChart = lazy(() => import('./EfficientFrontierChart'));
const RiskDecompositionChart = lazy(() => import('./RiskDecompositionChart'));
const MonteCarloChart = lazy(() => import('./MonteCarloChart'));

export function PortfolioAnalysis() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="overview">Overview</Tab>
        <Tab value="frontier">Efficient Frontier</Tab>
        <Tab value="risk">Risk Decomposition</Tab>
        <Tab value="simulation">Monte Carlo</Tab>
      </Tabs>

      <Suspense fallback={<ChartSkeleton />}>
        {activeTab === 'frontier' && <EfficientFrontierChart />}
        {activeTab === 'risk' && <RiskDecompositionChart />}
        {activeTab === 'simulation' && <MonteCarloChart />}
      </Suspense>
    </div>
  );
}
```

**Performance Impact:**
- Large table rendering: 10,000 rows in <50ms (vs 5-10s without virtualization)
- Initial page load: 30% faster (defer non-critical charts)
- Memory usage: 80% reduction (only render visible rows)

**Complexity:** Medium (8-12 hours)
**Dependencies:** @tanstack/react-virtual, Intersection Observer API

---

## 6. Reporting Enhancements

### 6.1 Automated PDF Report Generation (P1 - HIGH VALUE)

**Current:** Manual screenshot + PowerPoint workflow
**Enhanced:** One-click PDF generation with customizable templates

**Implementation:**
```typescript
// lib/reports/pdf-generator.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportConfig {
  template: 'executive' | 'detailed' | 'compliance';
  sections: ReportSection[];
  branding: {
    logo: string;
    primaryColor: string;
    fontFamily: string;
  };
}

export interface ReportSection {
  type: 'cover' | 'summary' | 'chart' | 'table' | 'text';
  title?: string;
  content: any;
  pageBreak?: boolean;
}

export class PDFReportGenerator {
  private pdf: jsPDF;
  private config: ReportConfig;
  private currentY: number = 20;
  private readonly pageHeight = 280;
  private readonly margin = 20;

  constructor(config: ReportConfig) {
    this.config = config;
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  async generate(): Promise<Blob> {
    for (const section of this.config.sections) {
      await this.renderSection(section);
    }

    return this.pdf.output('blob');
  }

  private async renderSection(section: ReportSection): Promise<void> {
    switch (section.type) {
      case 'cover':
        await this.renderCover(section);
        break;
      case 'summary':
        await this.renderSummary(section);
        break;
      case 'chart':
        await this.renderChart(section);
        break;
      case 'table':
        this.renderTable(section);
        break;
      case 'text':
        this.renderText(section);
        break;
    }

    if (section.pageBreak) {
      this.pdf.addPage();
      this.currentY = 20;
    }
  }

  private async renderCover(section: ReportSection): Promise<void> {
    // Add background color
    this.pdf.setFillColor(this.config.branding.primaryColor);
    this.pdf.rect(0, 0, 210, 297, 'F');

    // Add logo
    if (this.config.branding.logo) {
      this.pdf.addImage(this.config.branding.logo, 'PNG', 20, 20, 40, 20);
    }

    // Add title
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(32);
    this.pdf.text(section.content.title, 20, 100);

    // Add subtitle
    this.pdf.setFontSize(18);
    this.pdf.text(section.content.subtitle, 20, 120);

    // Add date
    this.pdf.setFontSize(12);
    this.pdf.text(new Date().toLocaleDateString(), 20, 140);

    this.pdf.addPage();
    this.currentY = 20;
  }

  private async renderSummary(section: ReportSection): Promise<void> {
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFontSize(20);
    this.pdf.text(section.title || 'Executive Summary', this.margin, this.currentY);
    this.currentY += 15;

    // Render KPI cards in 2x2 grid
    const kpis = section.content.kpis;
    const cardWidth = 80;
    const cardHeight = 30;
    const gap = 10;

    for (let i = 0; i < kpis.length; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = this.margin + col * (cardWidth + gap);
      const y = this.currentY + row * (cardHeight + gap);

      // Card background
      this.pdf.setFillColor(245, 245, 245);
      this.pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');

      // Label
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(117, 117, 117);
      this.pdf.text(kpis[i].label, x + 5, y + 8);

      // Value
      this.pdf.setFontSize(18);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(kpis[i].value, x + 5, y + 20);
    }

    this.currentY += Math.ceil(kpis.length / 2) * (cardHeight + gap) + 10;
  }

  private async renderChart(section: ReportSection): Promise<void> {
    // Capture chart as image
    const chartElement = document.getElementById(section.content.chartId);
    if (!chartElement) {
      console.warn(`Chart ${section.content.chartId} not found`);
      return;
    }

    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 170;  // A4 width minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Check if we need a new page
    if (this.currentY + imgHeight > this.pageHeight) {
      this.pdf.addPage();
      this.currentY = 20;
    }

    // Title
    if (section.title) {
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(section.title, this.margin, this.currentY);
      this.currentY += 10;
    }

    // Add image
    this.pdf.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight);
    this.currentY += imgHeight + 10;
  }

  private renderTable(section: ReportSection): void {
    // Title
    if (section.title) {
      this.pdf.setFontSize(14);
      this.pdf.text(section.title, this.margin, this.currentY);
      this.currentY += 10;
    }

    // Table header
    const { headers, rows } = section.content;
    const colWidth = (210 - 2 * this.margin) / headers.length;

    this.pdf.setFillColor(242, 242, 242);
    this.pdf.rect(this.margin, this.currentY, 170, 8, 'F');

    this.pdf.setFontSize(10);
    this.pdf.setTextColor(0, 0, 0);
    headers.forEach((header: string, i: number) => {
      this.pdf.text(header, this.margin + i * colWidth + 2, this.currentY + 5);
    });

    this.currentY += 10;

    // Table rows
    rows.forEach((row: string[], rowIndex: number) => {
      if (this.currentY > this.pageHeight) {
        this.pdf.addPage();
        this.currentY = 20;
      }

      row.forEach((cell, colIndex) => {
        this.pdf.text(cell, this.margin + colIndex * colWidth + 2, this.currentY + 5);
      });

      this.currentY += 8;
    });

    this.currentY += 5;
  }

  private renderText(section: ReportSection): void {
    // Title
    if (section.title) {
      this.pdf.setFontSize(14);
      this.pdf.text(section.title, this.margin, this.currentY);
      this.currentY += 10;
    }

    // Body text with wrapping
    this.pdf.setFontSize(10);
    const lines = this.pdf.splitTextToSize(section.content.text, 170);

    lines.forEach((line: string) => {
      if (this.currentY > this.pageHeight) {
        this.pdf.addPage();
        this.currentY = 20;
      }

      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 5;
  }
}

// Usage component
export function GenerateReportButton({ portfolioId }: { portfolioId: string }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      // Fetch portfolio data
      const portfolio = await fetch(`/api/portfolios/${portfolioId}`).then(r => r.json());

      // Configure report
      const config: ReportConfig = {
        template: 'detailed',
        branding: {
          logo: '/assets/alti-logo.png',
          primaryColor: '#00f0db',
          fontFamily: 'Inter',
        },
        sections: [
          {
            type: 'cover',
            content: {
              title: `${portfolio.name} Portfolio Analysis`,
              subtitle: 'Comprehensive Risk & Return Assessment',
            },
          },
          {
            type: 'summary',
            title: 'Executive Summary',
            content: {
              kpis: [
                { label: 'Expected Return', value: `${(portfolio.return * 100).toFixed(1)}%` },
                { label: 'Risk (Volatility)', value: `${(portfolio.risk * 100).toFixed(1)}%` },
                { label: 'Sharpe Ratio', value: portfolio.sharpe.toFixed(2) },
                { label: 'Beta', value: portfolio.beta.toFixed(2) },
              ],
            },
            pageBreak: true,
          },
          {
            type: 'chart',
            title: 'Efficient Frontier',
            content: { chartId: 'efficient-frontier-chart' },
            pageBreak: false,
          },
          {
            type: 'chart',
            title: 'Risk Decomposition',
            content: { chartId: 'risk-decomposition-chart' },
            pageBreak: true,
          },
          {
            type: 'table',
            title: 'Portfolio Holdings',
            content: {
              headers: ['Security', 'Weight', 'Expected Return', 'Risk'],
              rows: portfolio.holdings.map(h => [
                h.name,
                `${(h.weight * 100).toFixed(1)}%`,
                `${(h.return * 100).toFixed(1)}%`,
                `${(h.risk * 100).toFixed(1)}%`,
              ]),
            },
            pageBreak: true,
          },
          {
            type: 'text',
            title: 'Methodology',
            content: {
              text: 'This analysis uses mean-variance optimization with factor-based risk decomposition...',
            },
          },
        ],
      };

      // Generate PDF
      const generator = new PDFReportGenerator(config);
      const blob = await generator.generate();

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${portfolio.name}_analysis.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={generating}>
      {generating ? 'Generating Report...' : 'Generate PDF Report'}
    </button>
  );
}
```

**Report Templates:**

1. **Executive Summary (2 pages)**
   - Cover page
   - KPI summary with key metrics
   - Recommendation paragraph

2. **Detailed Analysis (10-15 pages)**
   - Cover page
   - Executive summary
   - All charts (frontier, risk decomposition, Monte Carlo)
   - Full holdings table
   - Methodology appendix

3. **Compliance Report (20+ pages)**
   - Full audit trail
   - Stress test scenarios
   - Factor attribution details
   - Regulatory disclosures

**Complexity:** Medium-High (12-16 hours for all templates)
**Dependencies:** jsPDF, html2canvas

---

### 6.2 Scheduled Analysis Emails (P2 - STRATEGIC)

**Current:** Users must manually check for updates
**Enhanced:** Automated daily/weekly/monthly email reports with portfolio changes

**Implementation:**
```typescript
// api-service/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import os

class ReportScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()

    def schedule_report(
        self,
        user_id: str,
        portfolio_id: str,
        frequency: str,  # 'daily', 'weekly', 'monthly'
        delivery_time: str = '09:00',  # HH:MM format
    ):
        """Schedule recurring report generation and email delivery"""

        # Parse frequency into cron trigger
        if frequency == 'daily':
            trigger = CronTrigger(hour=int(delivery_time.split(':')[0]), minute=int(delivery_time.split(':')[1]))
        elif frequency == 'weekly':
            trigger = CronTrigger(day_of_week='mon', hour=int(delivery_time.split(':')[0]), minute=int(delivery_time.split(':')[1]))
        elif frequency == 'monthly':
            trigger = CronTrigger(day=1, hour=int(delivery_time.split(':')[0]), minute=int(delivery_time.split(':')[1]))
        else:
            raise ValueError(f"Invalid frequency: {frequency}")

        # Add job to scheduler
        job_id = f"{user_id}:{portfolio_id}:{frequency}"
        self.scheduler.add_job(
            func=self._generate_and_send_report,
            trigger=trigger,
            args=[user_id, portfolio_id],
            id=job_id,
            replace_existing=True,
        )

        return job_id

    def _generate_and_send_report(self, user_id: str, portfolio_id: str):
        """Generate report and send via email"""

        # Fetch user and portfolio data
        user = get_user(user_id)
        portfolio = get_portfolio(portfolio_id)

        # Generate PDF report
        report_blob = generate_pdf_report(portfolio)

        # Compose email
        msg = MIMEMultipart()
        msg['From'] = 'reports@alti-global.com'
        msg['To'] = user.email
        msg['Subject'] = f"Portfolio Analysis Report - {portfolio.name}"

        # Email body
        body = f"""
        <html>
          <body>
            <h2>{portfolio.name} - Weekly Analysis Report</h2>

            <h3>Key Metrics (as of {datetime.now().strftime('%Y-%m-%d')})</h3>
            <ul>
              <li><strong>Expected Return:</strong> {portfolio.return * 100:.1f}%</li>
              <li><strong>Risk (Volatility):</strong> {portfolio.risk * 100:.1f}%</li>
              <li><strong>Sharpe Ratio:</strong> {portfolio.sharpe:.2f}</li>
            </ul>

            <h3>Changes Since Last Report</h3>
            <ul>
              <li>Return: {calculate_change(portfolio, 'return')} basis points</li>
              <li>Risk: {calculate_change(portfolio, 'risk')} basis points</li>
            </ul>

            <p>See attached PDF for full analysis.</p>

            <p style="color: #757575; font-size: 12px;">
              To unsubscribe from these reports, <a href="{get_unsubscribe_link(user_id)}">click here</a>.
            </p>
          </body>
        </html>
        """

        msg.attach(MIMEText(body, 'html'))

        # Attach PDF
        attachment = MIMEApplication(report_blob.getvalue(), _subtype='pdf')
        attachment.add_header('Content-Disposition', 'attachment', filename=f'{portfolio.name}_analysis.pdf')
        msg.attach(attachment)

        # Send email
        smtp = smtplib.SMTP(os.environ['SMTP_HOST'], int(os.environ['SMTP_PORT']))
        smtp.starttls()
        smtp.login(os.environ['SMTP_USER'], os.environ['SMTP_PASSWORD'])
        smtp.send_message(msg)
        smtp.quit()

    def unsubscribe(self, job_id: str):
        """Remove scheduled report"""
        self.scheduler.remove_job(job_id)

# Initialize scheduler
scheduler = ReportScheduler()

# FastAPI endpoint to manage schedules
@app.post('/api/reports/schedule')
async def schedule_report(request: ScheduleRequest):
    job_id = scheduler.schedule_report(
        user_id=request.user_id,
        portfolio_id=request.portfolio_id,
        frequency=request.frequency,
        delivery_time=request.delivery_time,
    )
    return {'success': True, 'job_id': job_id}

@app.delete('/api/reports/schedule/{job_id}')
async def unsubscribe_report(job_id: str):
    scheduler.unsubscribe(job_id)
    return {'success': True}
```

**Frontend UI:**
```typescript
// components/settings/ReportSchedule.tsx
export function ReportSchedule({ portfolioId }: { portfolioId: string }) {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [deliveryTime, setDeliveryTime] = useState('09:00');
  const [isScheduled, setIsScheduled] = useState(false);

  const handleSchedule = async () => {
    const response = await fetch('/api/reports/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUserId,
        portfolio_id: portfolioId,
        frequency,
        delivery_time: deliveryTime,
      }),
    });

    if (response.ok) {
      setIsScheduled(true);
      alert('Report scheduled successfully!');
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded">
      <h3 className="font-semibold">Scheduled Reports</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Frequency</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as any)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly (Monday)</option>
          <option value="monthly">Monthly (1st)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Delivery Time</label>
        <input
          type="time"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button onClick={handleSchedule} className="btn-primary">
        {isScheduled ? 'Update Schedule' : 'Schedule Report'}
      </button>

      {isScheduled && (
        <p className="text-sm text-gray-600">
          You will receive {frequency} reports at {deliveryTime} (your local time).
        </p>
      )}
    </div>
  );
}
```

**Email Content:**
- Key metrics summary (return, risk, Sharpe)
- Change indicators (vs previous report)
- Attached PDF report
- Unsubscribe link

**Complexity:** High (16-20 hours including email infrastructure)
**Dependencies:** APScheduler, SMTP server (SendGrid, AWS SES, etc.)

---

### 6.3 Customizable Dashboards (P2 - POLISH)

**Current:** Fixed layout for all users
**Enhanced:** Drag-and-drop dashboard customization, widget library

**Implementation:**
```typescript
// lib/dashboard/types.ts
export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'text';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: DashboardWidget[];
}

// components/dashboard/DashboardBuilder.tsx
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export function DashboardBuilder() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    {
      id: '1',
      type: 'kpi',
      title: 'Expected Return',
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: { metric: 'return', format: 'percentage' },
    },
    {
      id: '2',
      type: 'chart',
      title: 'Efficient Frontier',
      position: { x: 3, y: 0, w: 6, h: 4 },
      config: { chartType: 'scatter', dataSource: 'efficient-frontier' },
    },
  ]);

  const handleLayoutChange = (layout: any[]) => {
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = layout.find(l => l.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        };
      }
      return widget;
    });

    setWidgets(updatedWidgets);
  };

  const addWidget = (type: DashboardWidget['type']) => {
    const newWidget: DashboardWidget = {
      id: crypto.randomUUID(),
      type,
      title: `New ${type}`,
      position: { x: 0, y: Infinity, w: 3, h: 2 },  // Append to bottom
      config: {},
    };

    setWidgets(prev => [...prev, newWidget]);
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div>
      {/* Widget toolbar */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => addWidget('kpi')}>+ Add KPI</button>
        <button onClick={() => addWidget('chart')}>+ Add Chart</button>
        <button onClick={() => addWidget('table')}>+ Add Table</button>
        <button onClick={() => addWidget('text')}>+ Add Text</button>
      </div>

      {/* Grid layout */}
      <GridLayout
        className="layout"
        layout={widgets.map(w => ({
          i: w.id,
          x: w.position.x,
          y: w.position.y,
          w: w.position.w,
          h: w.position.h,
        }))}
        cols={12}
        rowHeight={80}
        width={1200}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
      >
        {widgets.map(widget => (
          <div key={widget.id} className="border rounded bg-white shadow">
            <div className="drag-handle flex justify-between items-center p-2 bg-gray-100 cursor-move">
              <span className="font-medium">{widget.title}</span>
              <button onClick={() => removeWidget(widget.id)}>✕</button>
            </div>
            <div className="p-4">
              <WidgetRenderer widget={widget} />
            </div>
          </div>
        ))}
      </GridLayout>
    </div>
  );
}

// Widget renderer
function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
  switch (widget.type) {
    case 'kpi':
      return <KPIWidget config={widget.config} />;
    case 'chart':
      return <ChartWidget config={widget.config} />;
    case 'table':
      return <TableWidget config={widget.config} />;
    case 'text':
      return <TextWidget config={widget.config} />;
    default:
      return <div>Unknown widget type</div>;
  }
}
```

**Widget Library:**
- **KPI Cards:** Return, risk, Sharpe, beta, tracking error
- **Charts:** Efficient frontier, risk decomposition, Monte Carlo paths, holdings pie chart
- **Tables:** Holdings, factor betas, correlation matrix
- **Text:** Notes, disclaimers, commentary

**Persistence:**
```typescript
// Save dashboard layout to localStorage or backend
export function saveDashboard(dashboard: Dashboard) {
  localStorage.setItem(`dashboard:${dashboard.id}`, JSON.stringify(dashboard));
}

export function loadDashboard(id: string): Dashboard | null {
  const data = localStorage.getItem(`dashboard:${id}`);
  return data ? JSON.parse(data) : null;
}
```

**Complexity:** Medium-High (14-18 hours)
**Dependencies:** react-grid-layout

---

## Summary: Feature Prioritization

### Priority 0: Complete Parity (25-36 hours)
1. IPS Word Export
2. Stress Scenarios (8 historical periods)
3. Qualtrics Integration
4. Footer CTA Buttons
5. Piecewise Regime UI

### Priority 1: High-Value Differentiators (100-120 hours)
1. **Real-Time:**
   - WebSocket portfolio updates (8-12h)
   - Streaming risk calculations (6-8h)

2. **Visualization:**
   - 3D efficient frontier (10-12h)
   - Risk decomposition treemap (8-10h)
   - Mobile optimization (12-16h)

3. **ML/Analytics:**
   - Regime detection (20-24h)

4. **Collaboration:**
   - Multi-user comparison (8-10h)
   - Saved scenarios (10-12h)

5. **Reporting:**
   - Automated PDF generation (12-16h)

6. **Performance:**
   - Caching infrastructure (12-16h - CRITICAL)
   - Web Workers for Monte Carlo (8-10h)
   - Progressive loading (8-12h)

### Priority 2: Strategic Enhancements (80-100 hours)
1. Real-time market data integration (16-20h)
2. Return prediction confidence intervals (16-20h)
3. Anomaly detection (10-12h)
4. Comments & annotations (20-24h)
5. Scheduled email reports (16-20h)
6. Customizable dashboards (14-18h)

---

## Technology Stack Additions

| Feature | Technology | Justification |
|---------|-----------|---------------|
| **WebSocket** | Socket.io | Industry standard, fallback to long-polling |
| **Caching** | Redis | High-performance in-memory cache, pub/sub support |
| **3D Visualization** | react-three-fiber | WebGL via React, 40KB gzipped |
| **ML Regime Detection** | scikit-learn | Proven algorithms (GMM, Isolation Forest) |
| **PDF Generation** | jsPDF + html2canvas | Client-side rendering, no server dependency |
| **Email** | SendGrid/AWS SES | Transactional email with deliverability guarantees |
| **Virtualization** | @tanstack/react-virtual | Best-in-class list virtualization |
| **Grid Layout** | react-grid-layout | Mature, drag-and-drop dashboard builder |
| **Market Data** | IEX Cloud/Bloomberg API | Real-time price feeds |

---

## Dependencies & Prerequisites

### Infrastructure
- **Redis:** Cache server (local or cloud)
- **SMTP:** Email delivery (SendGrid, AWS SES)
- **Market Data:** API contracts (IEX Cloud, Bloomberg)
- **Storage:** S3 or Azure Blob for report archives

### Development
- **Testing:** Playwright for E2E, Jest for unit tests
- **Monitoring:** Sentry for error tracking
- **Analytics:** Mixpanel/Amplitude for usage metrics

### Data
- **Historical Returns:** 5+ years of monthly data for regime detection
- **Factor Models:** Extend current factor library with macro indicators
- **Benchmark Data:** Blended benchmarks for tracking error

---

## Implementation Roadmap

### Phase 1: Complete Parity (Sprint 1-2, 4 weeks)
- P0 features to match legacy functionality
- Critical bug fixes
- Performance baseline testing

### Phase 2: Real-Time & Caching (Sprint 3-4, 4 weeks)
- WebSocket infrastructure
- Redis caching layer
- Web Workers for Monte Carlo
- Streaming risk calculations

### Phase 3: Visualization & Mobile (Sprint 5-6, 4 weeks)
- 3D efficient frontier
- Risk decomposition treemap
- Mobile optimization
- Animated transitions

### Phase 4: ML & Collaboration (Sprint 7-9, 6 weeks)
- Regime detection model training
- Multi-user comparison
- Saved scenarios
- Comments & annotations

### Phase 5: Reporting & Strategic (Sprint 10-12, 6 weeks)
- PDF report generation
- Scheduled email reports
- Return prediction confidence intervals
- Customizable dashboards

**Total Estimated Timeline:** 24 weeks (6 months) at 1 full-time engineer

---

## Success Metrics

| Metric | Baseline (Legacy) | Target (Enhanced) |
|--------|------------------|-------------------|
| **Page Load Time** | 2-3 seconds | <1 second |
| **Monte Carlo Execution** | 100ms (10K sims) | 100ms (100K sims via Worker) |
| **Risk Calc Latency** | 2-5 seconds | <500ms (cached) |
| **Mobile Experience** | Poor (desktop-only) | Excellent (touch-optimized) |
| **User Engagement** | 5 min avg session | 15 min avg session |
| **Report Generation** | Manual (30+ min) | Automated (<1 min) |
| **Collaboration** | None | Multi-user, real-time |
| **Prediction Accuracy** | Static CMA | Regime-aware (15-30% improvement) |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Scope Creep** | Strict P0/P1/P2 prioritization, phased rollout |
| **Performance Regression** | Automated benchmarking, lighthouse CI |
| **Data Quality** | Regime model validation on historical crises |
| **User Adoption** | Progressive rollout, A/B testing, user training |
| **Technical Debt** | 20% time allocation for refactoring |
| **Vendor Lock-In** | Abstract market data APIs, fallback to CSV |

---

## Conclusion

This roadmap delivers **25 enhanced features** that differentiate the React implementation from the legacy Dash app through:

1. **Real-time capabilities** impossible in synchronous Dash (WebSocket, streaming)
2. **Advanced visualization** leveraging WebGL and modern chart libraries
3. **ML-powered insights** (regime detection, anomaly detection, confidence intervals)
4. **Collaboration features** (multi-user, comments, saved scenarios)
5. **Performance optimizations** (caching, Web Workers, virtualization)
6. **Automated reporting** (PDF, email, customizable dashboards)

**Priority 0** completes feature parity in 25-36 hours.
**Priority 1** delivers high-value differentiators in 100-120 hours.
**Priority 2** adds strategic enhancements in 80-100 hours.

**Total effort:** 205-256 hours (5-6 months at 1 FTE) for complete implementation.

**Immediate Next Steps:**
1. Review and approve roadmap with stakeholders
2. Begin P0 implementation (IPS export, stress scenarios)
3. Set up Redis for caching infrastructure (critical foundation)
4. Design WebSocket architecture for real-time features
5. Train regime detection model on historical data
