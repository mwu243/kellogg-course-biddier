export type Term = string; // e.g., "Fall 2024"
export type Phase = "1" | "2" | "Add/Drop" | "Year-Long" | "Unknown";

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
}

export interface BidHistory {
    courseId: string;
    courseName: string;
    professor: string;
    term: Term;
    phase: Phase;
    clearingPrice: number;
    spotsAvailable: number;
    bidsPlaced: number; // Optional, often not in public data
    meetingPattern?: string; // e.g., "Tue 8:30AM - 11:30AM"
    campus?: string; // e.g., "Evanston", "Chicago"
}

export interface ProfessorReview {
    professorName: string;
    overallRating: number; // 1-6 scale
    difficulty?: number;
    wouldTakeAgainPct?: number;
}

export interface CourseStats {
    courseId: string;
    courseName: string;
    professor: string;

    // Schedule Info
    meetingPattern?: string; // e.g., "Tue 8:30AM - 11:30AM"
    campus?: string; // e.g., "Evanston", "Chicago"
    terms: string[]; // List of terms this course was offered

    // Aggregated Stats
    avgClearingPriceR1: number;
    avgClearingPriceR2: number;
    medianClearingPriceR1: number;
    medianClearingPriceR2: number;

    // Review Data (Linked)
    professorRating?: number;
    professorReview?: ProfessorReview;

    // Forecasts
    forecastedBidR1?: number;
    forecastedBidR2?: number;
    isGoodValue?: boolean; // High rating, low price

    // Time Series for Charts
    history: { term: string; priceR1: number; priceR2: number; meetingPattern?: string }[];
}
