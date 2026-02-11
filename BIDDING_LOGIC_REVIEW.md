# Bidding Methodology Review

## Current Methodology
The current forecasting engine (`forecasting.ts`) uses a **Weighted Statistical Model** with the following components:

1.  **Time Decay**: Historical data is weighted by recency using exponential decay ($e^{-0.3t}$). Recent terms matter significantly more than data from 2 years ago.
2.  **Trend Detection**: We use **Weighted Linear Regression** to detect if a course is "Heating Up" (Trending Up) or "Cooling Down".
    -   *Result*: If a course is trending up, we project the price *above* the historical average.
3.  **Variable Adjustments**:
    -   **Professor Rating**: We use a **Sigmoid Function** to apply a non-linear premium.
        -   Rating 4.5 (Avg) → 1.0x Multiplier
        -   Rating 6.0 (Star) → ~1.25x Multiplier
    -   **Phase Relationships**: If data is missing for Phase 2, we estimate it from Phase 1 using historical ratios (e.g., P2 is typically 1.15x P1).

## Mathematical critique & Proposed Improvements

### 1. The "Inflation" Problem (Missing)
**Issue**: The current model assumes 100 points in 2023 is worth the same as 100 points in 2026. In reality, if students are given more points or if "grade inflation" applies to bidding, prices drift up naturally.
**Refinement**: Implement a **Course Price Index (CPI)**.
-   Calculate the average clearing price of *all* courses per term.
-   Normalize historical bids: $RealPrice = NominalPrice \times \frac{CPI_{today}}{CPI_{historical}}$.

### 2. Probability vs. Point Estimate
**Issue**: We currently give a single "Safe Bid" (85th percentile).
**Refinement**: Provide a **Probability Curve**.
-   Instead of one number, show: "Bid 400 for 50% chance, 650 for 90% chance".
-   *Math*: Fit a **Log-Normal Distribution** to the historical data (since prices can't be negative and often have a long tail).

### 3. Portfolio Optimization (The "Holy Grail")
**Issue**: Users bid on multiple classes. Bidding independent "Safe Bids" on 5 classes might exceed the total budget.
**Refinement**: Solve the **Knapsack Problem**.
-   **Objective**: Maximize Total Utility (Sum of Professor Ratings).
-   **Constraint**: $\sum Bids \le Budget$.
-   **Input**: User selects 5 classes and assigns a "Desire Score" to each.
-   **Output**: "Bid 500 on A, 200 on B, 0 on C (impossible to win)".

## Recommendation
For this iteration, the current **Weighted Statistical Model** is sufficiently robust for individual course lookups. The most impactful immediate upgrade would be **Strategy #2 (Probability Curve)**, allowing users to see the trade-off between cost and win rate.
