# Client Assessment v2 - Agent Handoff

## Summary

Redesigned Client Assessment with **both Impact and Non-Impact client workflows**. Uses AlTi branding and 2025 portfolio models from Investment Objectives spreadsheet.

---

## What Was Built

### Location
- **Working copy:** `/app/client-assessment-v2/`
- **Components:** `/components/client-assessment-v2/`
- **Portfolio models:** `/lib/portfolio-models.ts`
- **Types:** `/lib/client-assessment-types.ts`
- **Mock data:** `/lib/client-assessment-mock-data.ts`

### Impact Client Workflow (Complete)
1. **Hero section** - Archetype verdict with animated confidence bar
2. **Radar chart** - AlTi brand colors, polygon grid
3. **Archetype breakdown** - Sidebar with ranked progress bars
4. **"Why This Archetype?"** - Alignment factors
5. **Prism AI panel** - Green themed, launches Impact research
6. **Survey responses** - Collapsible, categorized

### Non-Impact Client Workflow (NEW)
1. **Hero section** - Risk profile (Conservative → Long-Term Growth)
2. **Risk stats** - Growth %, Stability %, Tail Risk
3. **Investment profile** - Time horizon, liquidity, tax status
4. **Allocation summary** - Stability/Diversified/Growth bars
5. **Portfolio model table** - Full allocation breakdown with funds & tickers
6. **Prism Portfolio Advisor** - Blue themed, separate bot context
7. **Survey responses** - Same collapsible view

### Client Detection Logic
```typescript
// From client-assessment-types.ts
export type ImpactInterest = 'significant' | 'moderate' | 'minimal' | 'none';

// Impact = significant OR moderate
// Non-Impact = minimal OR none
```

### Portfolio Models (from Investment Objectives 12.2025)
- **5 Risk Profiles:** Conservative, Balanced, Moderate Growth, Growth, Long-Term Growth
- **2 Portfolio Types:** Traditional (taxable), Endowment (tax-exempt)
- **Full allocations:** Cash, Fixed Income, Municipal, Credit, Equities, Alternatives
- **SAA-TAA Bands:** Min/max ranges for each asset class

---

## Data Structures

### ClientSurvey (updated)
```typescript
interface ClientSurvey {
  id: string;
  clientInfo: ClientInfo;
  impactInterest: ImpactInterest;  // NEW
  isImpactClient: boolean;          // NEW
  archetypeScores?: Record<ArchetypeId, ArchetypeScore>;  // Now optional
  riskProfile?: RiskProfileData;    // NEW - for non-impact clients
  questions: SurveyQuestion[];
  submittedDate: string;
}

interface RiskProfileData {
  riskTolerance: RiskProfileId;
  portfolioType: PortfolioType;
  timeHorizon: string;
  liquidityNeeds: string;
  taxStatus: 'taxable' | 'tax-exempt';
}
```

### Mock Clients
- **3 Impact clients:** Daffy Duck (100% Impact), Teresa Wells (Climate), John Smith (Integrated)
- **2 Non-Impact clients:** Robert Chen (Traditional Growth), Margaret Wilson (Endowment Moderate)

---

## Prism AI Integration

### Impact Bot (existing)
- Green theme (`#10B981`)
- Opens `/impact-analytics/research?archetype={id}&client={id}`
- Context: Impact archetypes, ESG themes, sustainable investments

### Non-Impact Bot (NEW)
- Blue theme (`#0369A1`)
- Opens `/portfolio-advisor?profile={riskTolerance}&type={portfolioType}&client={id}`
- Context: Portfolio models, risk allocation, fund selection

**Note:** `/portfolio-advisor` route does not exist yet - placeholder for future implementation.

---

## Files Changed

| File | Changes |
|------|---------|
| `app/client-assessment-v2/page.tsx` | Split into ImpactClientView and NonImpactClientView components |
| `lib/client-assessment-types.ts` | Added ImpactInterest, RiskProfileData types |
| `lib/client-assessment-mock-data.ts` | Added isImpactClient, riskProfile, 2 non-impact clients |
| `lib/portfolio-models.ts` | NEW - Full portfolio model data from Excel |
| `lib/ips/mapper.ts` | Fixed to handle optional archetypeScores |
| `app/client-assessment/page.tsx` | Filtered to only show impact clients (legacy) |

---

## Brand Colors

### Impact Theme
- Primary: Emerald `#10B981`
- Background: `#ECFDF5`
- Border: `#D1FAE5`

### Non-Impact Theme
- Primary: Sky Blue `#0369A1`
- Background: `#F0F9FF`
- Border: `#BAE6FD`

### Shared AlTi Colors
- Navy: `#0A2240`
- Teal: `#0B6D7B`
- Turquoise: `#00F0DB`

---

## To Test

```bash
cd /Users/xavi_court/claude_code/alti-portfolio-react
npm run dev
# Visit http://localhost:3000/client-assessment-v2
# Use dropdown to switch between impact and non-impact clients
```

---

## What's NOT Built

1. **`/portfolio-advisor` route** - Non-impact bot landing page
2. **Real Qualtrics integration** - Currently using mock data
3. **Risk profile calculation** - Manual in mock data, needs algorithm
4. **IPS export for non-impact** - May need different template
5. **In-app questionnaire** - For questions not in Qualtrics survey

---

## Next Steps

1. **Build `/portfolio-advisor` page** - Chat interface for portfolio recommendations
2. **Integrate real Qualtrics data** - Parse impact interest from Q6
3. **Build risk profiler** - Algorithm to determine risk tolerance from survey
4. **Connect RAG services** - Separate contexts for impact vs non-impact bots
