# Kellogg Course Bidding Optimization Platform

MMM / Kellogg-specific course bidding visualizer.

**[View on GitHub](https://github.com/mwu243/kellogg-course-biddier)**

## Features
-   **Price Forecaster**: Predicts clearing prices for Phase 1 vs Phase 2.
-   **Phase Strategy**: Toggle between bidding rounds to identify better deals.
-   **Star Power**: Detects premium pricing for professors with ratings > 5.5.
-   **Interactive Charts**: Visualize price trends over historical terms.

## Quick Start (Installation)

### Prerequisites
You will need to upload the following .csv files (downloadable via Kellogg BidReg system):
1.  **Historical Bid Stats** (`BiddingHistory.csv`)
2.  **Professor Reviews / TCE Stats** (`ProfessorReviews.csv`)
*(Note: Takes only these 2 files currently. All processing is local.)*

### How to Run

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/mwu243/kellogg-course-biddier.git
    cd kellogg-course-biddier
    ```

2.  **Navigate to the web app**:
    ```bash
    cd web
    ```

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Run the App**:
    ```bash
    npm run dev
    ```

5.  **Open in Browser**:
    Go to [http://localhost:3000](http://localhost:3000)

## Uploading Data
Once the app is running, upload your CSV files using the drag-and-drop interface. The processing happens entirely in your browser (no data is uploaded to a server).
