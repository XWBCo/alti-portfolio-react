# Client Assessment App v2 - Redesign Notes

**Created:** December 2024
**Updated:** December 9, 2024
**Status:** Ready for Review
**Original:** `/app/client-assessment/` (unchanged)
**Working Copy:** `/app/client-assessment-v2/`

---

## Context

The Client Assessment app is a **new client onboarding tool** for AlTi advisors:
1. Advisor administers external Qualtrics survey to client
2. Survey results flow into this app
3. App displays archetype recommendation + survey responses
4. Advisor exports IPS (Investment Policy Statement)

**Primary users:** Internal AlTi advisors (pre-meeting prep, one client at a time)

---

## What Changed

### 1. AlTi Brand Alignment ✅
- [x] Applied signature colors: navy `#0A2240`, teal `#0B6D7B`, turquoise `#00F0DB`
- [x] Used "The AlTi Line" pattern (left border accents on hero card, archetype cards)
- [x] Georgia serif for headings, Inter for body
- [x] Generous whitespace, clean card-based layout
- [x] Premium wealth management aesthetic with emerald green for AI/sustainability

### 2. Information Hierarchy Redesign ✅
- [x] **Hero section leads with archetype verdict** - Big, clear archetype name with color
- [x] Animated confidence/fit score bar with percentage
- [x] Client quick info card integrated into hero
- [x] Secondary: Radar chart + archetype breakdown with progress bars
- [x] Tertiary: Survey responses now collapsible (hidden by default)

### 3. Prism AI Integration (Placeholder) ✅
- [x] Dedicated AI panel with emerald gradient styling
- [x] Shows areas of alignment based on archetype
- [x] "Launch Prism Research" CTA button
- [x] Header also has "Research in Prism" button
- [x] Hook points ready for RAG service integration

### 4. Radar Chart Improvements ✅
- [x] Cleaner polygon grid styling
- [x] Shorter labels for better fit (100% Impact, Inclusive, Climate, Integrated)
- [x] Custom tooltip with full archetype name and color
- [x] Navy/teal/turquoise AlTi brand colors
- [x] Active dot highlight with turquoise accent

### 5. Survey Responses Improvements ✅
- [x] Collapsible section (hidden by default to reduce cognitive load)
- [x] Card-based layout for each question (not table rows)
- [x] Color-coded category badges
- [x] Multiselect responses shown as tags
- [x] Ranking responses shown with numbered circles
- [x] Grouped by category when viewing "All"

### 6. New Features
- [x] Animated entry transitions (Motion/Framer)
- [x] Archetype breakdown sidebar with progress bars
- [x] "Why This Archetype?" section with alignment factors
- [x] Responsive header with client selector dropdown

---

## 2025 Design Best Practices Applied

Based on research from [Dashboard UI/UX Design Principles 2025](https://medium.com/@allclonescript/20-best-dashboard-ui-ux-design-principles-you-need-in-2025-30b661f2f795):

- **Clarity over flashiness** - Information hierarchy tells a story
- **Actionable design** - Clear CTAs (Export IPS, Launch Prism)
- **Microinteractions** - Animated progress bars, hover states, collapsible sections
- **Modular layout** - Card-based bento structure
- **Premium aesthetic** - Wealth management calm/control feeling

---

## File Structure

```
app/client-assessment-v2/
├── page.tsx                 # Main page (redesigned)
├── REDESIGN-NOTES.md        # This document

components/client-assessment-v2/
├── ArchetypeRadar.tsx       # Radar chart (updated)
├── SurveyTable.tsx          # Survey responses (updated)
├── ClientProfileCard.tsx    # (unused - integrated into hero)
├── ArchetypeCard.tsx        # (unused - integrated into breakdown)
```

---

## Design References Used

- **Brand Guidelines:** `/claude_code/ALTI-IMPACT-DESIGN-GUIDELINES.md`
- **Brand System:** `/alti-risk-portfolio-app/docs/branding/AlTi-Brand-Design-System.md`
- **Theme Tokens:** `/alti-portfolio-react/lib/theme.ts`
- **Homepage Example:** `/alti-risk-portfolio-app/app_esg/UX-UI-database/esg-flow/alti-homepage-full.png`

---

## Before/After Summary

| Element | Before | After |
|---------|--------|-------|
| Hero | None | Large archetype verdict with animated confidence bar |
| Client info | Separate card | Integrated into hero |
| Radar chart | Full-width, old colors | Compact, AlTi brand colors |
| Archetype cards | 4 expandable cards | Compact breakdown with progress bars |
| Survey responses | Always visible table | Collapsible card-based view |
| AI integration | None | Prism AI placeholder panel |
| Actions | Sidebar buttons | Header bar with clear CTAs |

---

## Merge Criteria

Before merging v2 → original:
- [ ] Visual design approved by stakeholder
- [ ] Information hierarchy validated
- [ ] Prism AI hooks tested with service
- [ ] No regressions in IPS export
- [ ] Responsive on common viewport sizes
- [ ] Accessibility check (contrast, keyboard nav)

---

## How to View

1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/client-assessment-v2`
3. Compare with original: `http://localhost:3000/client-assessment`
