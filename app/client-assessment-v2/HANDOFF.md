# Client Assessment v2 - Agent Handoff

## Summary

Redesigned the Client Assessment app with AlTi branding and 2025 UX best practices. **Impact workflow is complete**, but **Non-impact workflow is NOT implemented**.

---

## What Was Built

### Location
- **Working copy:** `/app/client-assessment-v2/`
- **Components:** `/components/client-assessment-v2/`
- **Original (untouched):** `/app/client-assessment/`

### Completed Features
1. **Hero section** - Large archetype verdict with animated confidence bar
2. **Client info** - Integrated into hero card
3. **Radar chart** - AlTi brand colors, polygon grid, custom tooltips
4. **Archetype breakdown** - Sidebar with ranked progress bars
5. **"Why This Archetype?"** - Alignment factors section
6. **Survey responses** - Collapsible, card-based, grouped by category
7. **Prism AI panel** - Placeholder for Impact bot integration
8. **Header actions** - Export IPS + Research in Prism buttons

### Brand Applied
- Navy `#0A2240`, Teal `#0B6D7B`, Turquoise `#00F0DB`
- Georgia serif headings, Inter body
- "The AlTi Line" (left border accents)
- Emerald `#10B981` for AI/sustainability elements

---

## What's NOT Built (Non-Impact Workflow)

### The Problem
Not all clients are impact investors. Currently the app assumes everyone is an impact client with archetype scores. Non-impact clients need a different experience.

### How Impact vs Non-Impact is Determined
- **Explicit survey question** in Qualtrics asks "Are you interested in impact investing?"
- If no/low interest → client is non-impact
- This data should be in the survey response

### Non-Impact Workflow Requirements

1. **Detection Logic**
   - Check survey responses for the impact interest question
   - Route to appropriate view based on answer

2. **Non-Impact UI Should Show**
   - Risk profile (risk tolerance, time horizon, liquidity needs)
   - Basic suitability information
   - NO radar chart, NO archetype cards
   - Different AI panel: "Non-impact bot" for portfolio recommendations

3. **Non-Impact Bot (Prism AI)**
   - Separate RAG service context from Impact bot
   - Fed with standardized portfolio models (user will provide)
   - Recommends portfolio based on risk profile, not impact preferences

4. **In-App Questionnaire (Future)**
   - For questions not in external Qualtrics survey
   - Advisor completes within app during onboarding
   - Outputs fully completed IPS with all info for portfolio selection

---

## Prism AI Integration Points

### Current Placeholder (Impact)
```tsx
// In page.tsx, the Prism AI panel passes:
window.open(`/impact-analytics/research?archetype=${topArchetype}&client=${selectedClientId}`, '_blank')
```

### What's Needed
1. **Impact bot** - RAG with impact/ESG context, archetype alignment
2. **Non-impact bot** - RAG with portfolio models, risk-based recommendations
3. **API endpoint** or embedding for chat interface
4. **Context passing** - Client profile, survey responses, archetype (if impact)

---

## Data Structures

### Client Survey (existing)
```typescript
interface ClientSurvey {
  id: string;
  clientInfo: ClientInfo;
  archetypeScores: Record<ArchetypeId, ArchetypeScore>; // Only for impact clients
  questions: SurveyQuestion[];
  submittedDate: string;
}
```

### Suggested Addition for Non-Impact
```typescript
interface ClientSurvey {
  // ... existing fields
  isImpactClient: boolean;  // Derived from survey question
  riskProfile?: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    timeHorizon: string;
    liquidityNeeds: string;
  };
}
```

---

## File Reference

| File | Purpose |
|------|---------|
| `app/client-assessment-v2/page.tsx` | Main page - add conditional rendering for non-impact |
| `components/client-assessment-v2/ArchetypeRadar.tsx` | Radar chart - hide for non-impact |
| `components/client-assessment-v2/SurveyTable.tsx` | Survey display - works for both |
| `lib/client-assessment-types.ts` | Types - add `isImpactClient`, `riskProfile` |
| `lib/client-assessment-mock-data.ts` | Mock data - add non-impact client example |

---

## Design References

- `/claude_code/ALTI-IMPACT-DESIGN-GUIDELINES.md` - Full brand guidelines
- `/alti-risk-portfolio-app/docs/branding/AlTi-Brand-Design-System.md` - Brand system
- `/alti-portfolio-react/lib/theme.ts` - Theme tokens

---

## To Test Current Build

```bash
cd /Users/xavi_court/claude_code/alti-portfolio-react
npm run dev
# Visit http://localhost:3000/client-assessment-v2
```

---

## Next Steps for Agent

1. Add `isImpactClient` detection logic based on survey responses
2. Create conditional UI: Impact view (current) vs Non-impact view (new)
3. Build Non-impact view with risk profile display
4. Add Non-impact bot placeholder panel
5. Coordinate with Prism RAG service for both bot integrations
6. Get standardized portfolio models from user for Non-impact bot context
