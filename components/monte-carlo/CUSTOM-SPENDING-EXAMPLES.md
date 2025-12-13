# Custom Spending Examples

## Real-World Scenarios

### Scenario 1: College Funding

**Objective**: Model tuition payments for 4 years of college starting in Year 5

**Events**:
```
Event 1: Fall Semester Tuition
- Type: Recurring
- Description: "Fall Tuition"
- Amount: $35,000
- Start Quarter: 20 (Year 5, Q4)
- End Quarter: 35 (Year 9, Q3)
- Frequency: 4 quarters (annual)

Event 2: Spring Semester Tuition
- Type: Recurring
- Description: "Spring Tuition"
- Amount: $35,000
- Start Quarter: 22 (Year 6, Q2)
- End Quarter: 37 (Year 10, Q1)
- Frequency: 4 quarters (annual)
```

**Total Impact**: $280,000 over 4 years

---

### Scenario 2: Home Purchase & Renovation

**Objective**: Down payment in Year 3, renovation in Year 5

**Events**:
```
Event 1: Home Down Payment
- Type: One-Time
- Description: "Home Down Payment"
- Amount: $250,000
- Quarter: 12 (Year 3, Q4)

Event 2: Kitchen Renovation
- Type: One-Time
- Description: "Kitchen Renovation"
- Amount: $75,000
- Quarter: 20 (Year 5, Q4)
```

**Total Impact**: $325,000

---

### Scenario 3: Planned Retirement Distributions

**Objective**: 4% withdrawal rate starting immediately

**Events**:
```
Event 1: Quarterly Retirement Distribution
- Type: Percentage
- Description: "4% Annual Withdrawal (Quarterly)"
- Percentage: 1.0% (4% annual / 4 quarters)
```

**Total Impact**: Variable based on portfolio performance

---

### Scenario 4: Complex Multi-Event Scenario

**Objective**: Combine fixed and variable withdrawals with one-time expenses

**Events**:
```
Event 1: Emergency Fund Contribution
- Type: One-Time
- Description: "Emergency Fund Top-Up"
- Amount: $50,000
- Quarter: 4 (Year 1, Q4)

Event 2: Annual Living Expenses
- Type: Recurring
- Description: "Annual Living Expenses"
- Amount: $120,000
- Start Quarter: 1
- End Quarter: 80 (20 years)
- Frequency: 4 quarters (annual)

Event 3: Portfolio Rebalancing Fee
- Type: Percentage
- Description: "Annual Management Fee"
- Percentage: 0.25% (1% annual / 4 quarters)

Event 4: Vacation Home Purchase
- Type: One-Time
- Description: "Vacation Property Down Payment"
- Amount: $300,000
- Quarter: 40 (Year 10)

Event 5: Semi-Annual Charitable Giving
- Type: Recurring
- Description: "Charitable Donations"
- Amount: $25,000
- Start Quarter: 2
- End Quarter: 80
- Frequency: 2 quarters (semi-annual)
```

**Total Impact**:
- Fixed: $2,400,000 (living) + $1,000,000 (charity) + $350,000 (one-time) = $3,750,000
- Variable: 0.25% quarterly on portfolio value

---

## Tips & Best Practices

### 1. Quarter Calculation
- Quarter 1 = Year 1, Q1
- Quarter 4 = Year 1, Q4
- Quarter 5 = Year 2, Q1
- Quarter 8 = Year 2, Q4
- Formula: `Quarter = (Year - 1) * 4 + QuarterInYear`

### 2. Frequency Options
- **1 quarter**: Every quarter
- **2 quarters**: Semi-annual (twice per year)
- **4 quarters**: Annual (once per year)
- **12 quarters**: Every 3 years

### 3. Percentage vs. Fixed
- **Use Percentage** when:
  - Withdrawal amount should scale with portfolio
  - Modeling percentage-based strategies (4% rule)
  - Management fees, rebalancing costs

- **Use Fixed** when:
  - Withdrawal amount is known and constant
  - Major purchases, tuition, gifts
  - Specific one-time expenses

### 4. Testing Scenarios
1. Start with baseline (no custom spending)
2. Add custom spending events
3. Compare median outcomes
4. Adjust amounts/timing based on results

### 5. Common Patterns

**Retirement Withdrawal Strategy**:
- Percentage: 4% annual (1% quarterly)
- One-Time: Major purchases as needed
- Recurring: Predictable annual expenses

**Pre-Retirement Accumulation**:
- Recurring: Regular contributions (negative spending)
- One-Time: Major life events
- Percentage: Fee drag modeling

**Legacy Planning**:
- One-Time: Large gifts at specific times
- Recurring: Annual charitable giving
- Percentage: Estate planning fees

---

## Validation Rules

The system validates:
1. Description is required
2. Amounts must be positive (for withdrawals)
3. Quarters must be within simulation duration
4. Start quarter < End quarter (for recurring)
5. Frequency must be >= 1
6. Percentage must be 0-100%

---

## Viewing Impact

After adding events:
1. **Impact Summary Card**: Shows total fixed, percentage, and estimated impact
2. **Spending Schedule Table**: Lists all quarters with withdrawals
3. **Simulation Results**: Median/percentile lines reflect custom spending
4. **Probability Metrics**: Updated to account for custom withdrawals

---

## Exporting/Sharing

Currently, spending events are session-based. To share scenarios:
1. Screenshot the spending schedule table
2. Document event details in a spreadsheet
3. Re-create events in new session

Future enhancement: JSON import/export for spending templates.
