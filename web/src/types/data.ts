export type Term = string; // e.g., "Fall 2024"
export type Phase = "1" | "2" | "3" | "4" | "Add/Drop" | "Year-Long" | "Unknown";

// Time slot for conflict detection
export interface TimeSlot {
    day: string; // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    startTime: number; // Minutes from midnight (e.g., 510 = 8:30AM)
    endTime: number; // Minutes from midnight (e.g., 600 = 10:00AM)
}

// Available course for next semester
export interface AvailableCourse {
    courseId: string; // e.g., "MORS-472-5"
    courseName: string; // e.g., "Negotiations Fundamentals"
    credits: number;
    term: string;
    session: string; // "10WK", "1st 5WK", "2nd 5WK", "Pre-Term"
    section: string;
    meetingPattern: string; // Raw pattern string
    timeSlots: TimeSlot[]; // Parsed time slots for conflict detection
    instructor: string;
    campus: string;
    location: string;

    // Linked historical data (if available)
    historicalStats?: CourseStats;
    estimatedBidR1?: number;
    estimatedBidR2?: number;
    estimatedBidR3?: number;
    estimatedBidR4?: number;
}

export interface BidHistory {
    courseId: string;
    courseName: string;
    professor: string;
    term: Term;
    phase: Phase;
    clearingPrice: number;
    spotsAvailable: number;
    bidsPlaced: number; // Number of bids placed (for demand calculation)
    meetingPattern?: string; // e.g., "Tue 8:30AM - 11:30AM"
    campus?: string; // e.g., "Evanston", "Chicago"
}

export interface ProfessorReview {
    professorName: string;
    overallRating: number; // 1-6 scale
    difficulty?: number;
    wouldTakeAgainPct?: number;
}

// Enhanced forecast metadata
export interface ForecastMetadata {
    confidence: "high" | "medium" | "low" | "insufficient";
    trend: "rising" | "stable" | "falling" | "unknown";
    trendStrength: number; // 0-1
    demandLevel: "very_high" | "high" | "moderate" | "low";
    volatility: number; // coefficient of variation
    strategyNotes: string[];
}

export interface CourseStats {
    courseId: string;
    courseName: string;
    professor: string;

    // Schedule Info
    meetingPattern?: string; // e.g., "Tue 8:30AM - 11:30AM"
    campus?: string; // e.g., "Evanston", "Chicago"
    terms: string[]; // List of terms this course was offered

    // Aggregated Stats - All 4 Phases
    avgClearingPriceR1: number;
    avgClearingPriceR2: number;
    avgClearingPriceR3?: number;
    avgClearingPriceR4?: number;
    medianClearingPriceR1: number;
    medianClearingPriceR2: number;
    medianClearingPriceR3?: number;
    medianClearingPriceR4?: number;

    // Review Data (Linked)
    professorRating?: number;
    professorReview?: ProfessorReview;

    // Forecasts - All 4 Phases with safe bids
    forecastedBidR1?: number;
    forecastedBidR2?: number;
    forecastedBidR3?: number;
    forecastedBidR4?: number;

    // Enhanced forecast data
    forecastMetadata?: ForecastMetadata;

    // Value assessment
    isGoodValue?: boolean; // High rating, low price

    // Time Series for Charts - All 4 Phases
    history: {
        term: string;
        priceR1: number;
        priceR2: number;
        priceR3?: number;
        priceR4?: number;
        meetingPattern?: string;
        bidsPlaced?: number;
        spotsAvailable?: number;
    }[];

    // Probability Data (per phase)
    probabilityDataR1?: Array<{ bid: number; probability: number }>;
    probabilityDataR2?: Array<{ bid: number; probability: number }>;
}
