# Kellogg Course Bidding Optimization Platform - Implementation Plan

## Goal Description
Build a "Premium" web application to visualize Kellogg course bidding history and forecast winning bids. The platform will help students optimize their point allocation strategies using historical data, professor reviews, and a 4-phase betting strategy model.

## Technology Stack
-   **Framework**: Next.js (App Router)
-   **Styling**: Tailwind CSS + Shadcn UI (for premium feeling)
-   **Language**: TypeScript
-   **Visualization**: Recharts
-   **Data Processing**: PapaParse (Client-side CSV parsing)

## Required Data
The user must provide:
1.  **Bidding History CSV**: Contains `Course`, `Professor`, `Phase` (Round 1-4), `Clearing Price`.
2.  **Professor Reviews CSV**: Contains `Professor Name`, `Rating` (1-6 scale).

## Core Features & Implementation Steps

### 1. Project Initialization
-   [ ] Initialize Next.js project structure
-   [ ] Setup Tailwind CSS and Shadcn UI components
-   [ ] Configure data types for `Course`, `BidHistory`, and `ProfessorReview`

### 2. Data Ingestion & Processing
-   [ ] Create a "Upload Data" page to accept user CSVs
-   [ ] Implement client-side parsing using `papaparse`
-   [ ] Implement "Data Merging" logic:
    -   Fuzzy match Professor names between Bidding and Reviews
    -   Group statistics by Course + Professor + Phase

### 3. Dashboard & Visualization
-   [ ] **Search Interface**: Filter by Course Name or Professor
-   [ ] **Price Trends**: Line chart showing clearing prices over the last 3 years
    -   Feature: Toggle to compare "Round 1" vs "Round 2" prices
-   [ ] **Value Matrix**: Scatterplot (X=Price, Y=Rating)
    -   Highlight "Hidden Gems" (High Rating > 5.5, Low Price)

### 4. Bidding Forecaster (The "Secret Sauce")
-   [ ] Implement forecasting algorithm:
    -   **Base**: Median historical price for the specific Phase
    -   **Star Power**: Average + 15% if Professor Rating > 5.5
    -   **Trend**: Detect if price is strictly increasing over last 3 terms
-   [ ] **Recommendation UI**:
    -   "Safe Bid": 90th percentile of historical prices
    -   "Bargain Bid": Median price (risky but cheap)

### 5. Verification
-   [ ] Test CSV upload with sample data
-   [ ] Verify "Star Power" logic triggers only for high-rated professors
-   [ ] Check that Phase 1 recommendations are generally higher/different than Phase 2
