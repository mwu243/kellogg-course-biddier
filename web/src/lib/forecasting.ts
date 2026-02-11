/**
 * Advanced Bid Forecasting Algorithm for Kellogg Course Bidding
 *
 * This module implements a sophisticated forecasting system that considers:
 * - All 4 bidding phases (P1, P2, P3, P4/PWYB)
 * - Time-weighted historical data (exponential decay)
 * - Supply/demand indicators (bids-to-seats ratio)
 * - Professor rating impact (non-linear)
 * - Trend detection and momentum
 * - Confidence intervals based on data availability
 *
 * @author Claude AI
 * @version 2.0.0
 */

import { Phase } from "@/types/data";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type PhaseType = "1" | "2" | "3" | "4" | "PWYB";

export interface HistoricalBid {
    term: string;           // e.g., "Fall 2024"
    phase: PhaseType;
    clearingPrice: number;
    spotsAvailable: number;
    bidsPlaced: number;
    seatsTotal?: number;    // Total seats in the course
}

export interface ProfessorData {
    rating: number;         // 1-6 scale
    difficulty?: number;    // Optional difficulty rating
    wouldTakeAgain?: number; // Percentage
}

export interface CourseContext {
    courseId: string;
    courseName: string;
    professor: string;
    historicalBids: HistoricalBid[];
    professorData?: ProfessorData;
    meetingTime?: string;   // For time-of-day adjustments
    campus?: string;        // Evanston vs Chicago adjustments
}

export interface ForecastResult {
    phase: PhaseType;

    // Point estimates
    expectedPrice: number;      // Most likely clearing price
    safeBid: number;            // High confidence of winning (85th percentile)
    aggressiveBid: number;      // Risky but cheaper (50th percentile)
    minimumBid: number;         // Floor price (may not win)

    // Confidence metrics
    confidence: "high" | "medium" | "low" | "insufficient";
    dataPoints: number;         // Number of historical observations

    // Trend indicators
    trend: "rising" | "stable" | "falling" | "unknown";
    trendStrength: number;      // 0-1, how strong the trend is

    // Risk assessment
    volatility: number;         // Standard deviation / mean
    demandPressure: number;     // 0-1, how competitive this course is

    // Explanation
    factors: ForecastFactor[];
}

export interface ForecastFactor {
    name: string;
    impact: number;             // Positive = increases price, negative = decreases
    description: string;
}

export interface CompleteForecast {
    courseId: string;
    professor: string;
    forecasts: {
        phase1: ForecastResult;
        phase2: ForecastResult;
        phase3: ForecastResult;
        phase4: ForecastResult;
    };
    overallRecommendation: string;
    strategyNotes: string[];
}

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

const CONFIG = {
    // Time decay factor - how quickly old data loses relevance
    // Value of 0.3 means data from 1 year ago has weight e^(-0.3) ~ 0.74
    TIME_DECAY_FACTOR: 0.3,

    // Minimum data points for each confidence level
    MIN_DATA_HIGH_CONFIDENCE: 6,
    MIN_DATA_MEDIUM_CONFIDENCE: 3,
    MIN_DATA_LOW_CONFIDENCE: 1,

    // Professor rating thresholds and impact multipliers
    RATING_THRESHOLDS: {
        STAR: 5.5,          // "Star power" threshold
        ABOVE_AVERAGE: 5.0,
        AVERAGE: 4.5,
        BELOW_AVERAGE: 4.0,
    },

    // Non-linear professor rating impact on price
    // Based on sigmoid function centered at 5.0
    RATING_IMPACT_SCALE: 0.25, // Max +/- 25% adjustment

    // Demand pressure thresholds (bids/seats ratio)
    DEMAND_THRESHOLDS: {
        VERY_HIGH: 3.0,     // 3+ bids per seat
        HIGH: 2.0,
        MODERATE: 1.5,
        LOW: 1.0,
    },

    // Phase relationship multipliers (based on typical patterns)
    PHASE_RELATIONSHIPS: {
        P2_VS_P1: 1.15,     // P2 typically ~15% higher than P1 for hot courses
        P3_VS_P1: 0.85,     // P3 typically ~15% lower (combined pool)
        P4_VS_P1: 0.70,     // PWYB typically ~30% lower (except high demand)
    },

    // Confidence intervals for different bid types
    PERCENTILES: {
        SAFE: 0.85,
        EXPECTED: 0.60,
        AGGRESSIVE: 0.50,
        MINIMUM: 0.25,
    },

    // Trend detection parameters
    TREND: {
        MIN_POINTS: 3,      // Minimum points to detect trend
        SIGNIFICANCE: 0.10, // 10% change considered significant
    },

    // Campus/time adjustments
    CAMPUS_ADJUSTMENT: {
        CHICAGO: 0.95,      // Chicago campus slightly lower demand
        EVANSTON: 1.0,
    },

    // Time slot adjustments (some times are more desirable)
    TIME_SLOT_ADJUSTMENT: {
        MORNING_EARLY: 0.90,    // 8:30 AM - less popular
        MORNING: 1.0,           // 9:30-11:30 AM - baseline
        AFTERNOON: 1.05,        // 1:30-3:30 PM - slightly more popular
        EVENING: 0.95,          // 6:30 PM+ - less popular
    },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Parse term string to a sortable numeric value
 * Format: "Season Year" -> Year * 10 + SeasonOrder
 */
function parseTermToNumber(term: string): number {
    const match = term.match(/(Winter|Spring|Summer|Fall)\s+(\d{4})/i);
    if (!match) return 0;

    const seasonOrder: Record<string, number> = {
        winter: 0,
        spring: 1,
        summer: 2,
        fall: 3,
    };

    const season = match[1].toLowerCase();
    const year = parseInt(match[2]);

    return year * 10 + (seasonOrder[season] || 0);
}

/**
 * Calculate terms between two term strings
 */
function termsDifference(laterTerm: string, earlierTerm: string): number {
    return parseTermToNumber(laterTerm) - parseTermToNumber(earlierTerm);
}

/**
 * Get current term estimate (for decay calculations)
 */
function getCurrentTermNumber(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Approximate: Jan-Mar = Winter, Apr-Jun = Spring, Jul-Aug = Summer, Sep-Dec = Fall
    let season = 3; // Fall default
    if (month <= 2) season = 0;
    else if (month <= 5) season = 1;
    else if (month <= 7) season = 2;

    return year * 10 + season;
}

/**
 * Calculate exponential decay weight based on how old the data is
 */
function calculateTimeWeight(termNumber: number, currentTermNumber: number): number {
    const termsDiff = currentTermNumber - termNumber;
    // Convert to approximate years (4 terms per year)
    const yearsDiff = termsDiff / 4;
    return Math.exp(-CONFIG.TIME_DECAY_FACTOR * yearsDiff);
}

/**
 * Calculate weighted statistics with time decay
 */
function weightedStatistics(values: number[], weights: number[]): {
    mean: number;
    median: number;
    stdDev: number;
    percentile: (p: number) => number;
} {
    if (values.length === 0) {
        return {
            mean: 0,
            median: 0,
            stdDev: 0,
            percentile: () => 0,
        };
    }

    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);

    // Weighted mean
    const mean = values.reduce((sum, v, i) => sum + v * normalizedWeights[i], 0);

    // Weighted variance
    const variance = values.reduce(
        (sum, v, i) => sum + normalizedWeights[i] * Math.pow(v - mean, 2),
        0
    );
    const stdDev = Math.sqrt(variance);

    // For weighted median and percentiles, use weighted sorting
    const sortedPairs = values
        .map((v, i) => ({ value: v, weight: normalizedWeights[i] }))
        .sort((a, b) => a.value - b.value);

    const percentile = (p: number): number => {
        let cumWeight = 0;
        for (const pair of sortedPairs) {
            cumWeight += pair.weight;
            if (cumWeight >= p) {
                return pair.value;
            }
        }
        return sortedPairs[sortedPairs.length - 1]?.value || 0;
    };

    return {
        mean,
        median: percentile(0.5),
        stdDev,
        percentile,
    };
}

/**
 * Detect price trend using weighted linear regression
 */
function detectTrend(
    prices: number[],
    terms: number[],
    weights: number[]
): { trend: "rising" | "stable" | "falling" | "unknown"; strength: number } {
    if (prices.length < CONFIG.TREND.MIN_POINTS) {
        return { trend: "unknown", strength: 0 };
    }

    // Weighted linear regression
    const n = prices.length;
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Normalize x values (terms) to [0, 1] range for numerical stability
    const minTerm = Math.min(...terms);
    const maxTerm = Math.max(...terms);
    const termRange = maxTerm - minTerm || 1;
    const normalizedTerms = terms.map(t => (t - minTerm) / termRange);

    // Weighted means
    let sumWX = 0, sumWY = 0, sumWXX = 0, sumWXY = 0;
    for (let i = 0; i < n; i++) {
        const w = weights[i];
        const x = normalizedTerms[i];
        const y = prices[i];
        sumWX += w * x;
        sumWY += w * y;
        sumWXX += w * x * x;
        sumWXY += w * x * y;
    }

    const meanX = sumWX / totalWeight;
    const meanY = sumWY / totalWeight;

    // Slope calculation
    const numerator = sumWXY / totalWeight - meanX * meanY;
    const denominator = sumWXX / totalWeight - meanX * meanX;

    if (Math.abs(denominator) < 0.0001) {
        return { trend: "stable", strength: 0 };
    }

    const slope = numerator / denominator;

    // Convert slope to percentage change relative to mean price
    const percentageChange = (slope / meanY);

    // Determine trend direction and strength
    let trend: "rising" | "stable" | "falling";
    if (percentageChange > CONFIG.TREND.SIGNIFICANCE) {
        trend = "rising";
    } else if (percentageChange < -CONFIG.TREND.SIGNIFICANCE) {
        trend = "falling";
    } else {
        trend = "stable";
    }

    // Strength is the absolute percentage change, capped at 1
    const strength = Math.min(Math.abs(percentageChange) / 0.5, 1);

    return { trend, strength };
}

/**
 * Calculate professor rating impact using sigmoid function
 * Returns multiplier for price (1.0 = no change)
 */
function calculateRatingImpact(rating: number | undefined): {
    multiplier: number;
    description: string;
} {
    if (rating === undefined || rating === 0) {
        return { multiplier: 1.0, description: "No rating data" };
    }

    // Sigmoid function centered at 5.0 (middle of 1-6 scale)
    // f(x) = 1 + SCALE * tanh((x - 5.0) / 1.5)
    const normalized = (rating - 5.0) / 1.5;
    const impact = CONFIG.RATING_IMPACT_SCALE * Math.tanh(normalized);
    const multiplier = 1 + impact;

    let description: string;
    if (rating >= CONFIG.RATING_THRESHOLDS.STAR) {
        description = `Star professor (${rating.toFixed(1)}) - high demand expected`;
    } else if (rating >= CONFIG.RATING_THRESHOLDS.ABOVE_AVERAGE) {
        description = `Above average rating (${rating.toFixed(1)}) - moderate demand boost`;
    } else if (rating >= CONFIG.RATING_THRESHOLDS.AVERAGE) {
        description = `Average rating (${rating.toFixed(1)}) - typical demand`;
    } else {
        description = `Below average rating (${rating.toFixed(1)}) - potentially lower demand`;
    }

    return { multiplier, description };
}

/**
 * Calculate demand pressure from bids/seats ratio
 */
function calculateDemandPressure(
    bidsPlaced: number[],
    spotsAvailable: number[],
    weights: number[]
): { pressure: number; description: string } {
    if (bidsPlaced.length === 0 || spotsAvailable.every(s => s === 0)) {
        return { pressure: 0.5, description: "No demand data available" };
    }

    // Calculate weighted average demand ratio
    let totalWeightedRatio = 0;
    let totalWeight = 0;

    for (let i = 0; i < bidsPlaced.length; i++) {
        if (spotsAvailable[i] > 0 && bidsPlaced[i] > 0) {
            const ratio = bidsPlaced[i] / spotsAvailable[i];
            totalWeightedRatio += ratio * weights[i];
            totalWeight += weights[i];
        }
    }

    if (totalWeight === 0) {
        return { pressure: 0.5, description: "Insufficient demand data" };
    }

    const avgRatio = totalWeightedRatio / totalWeight;

    // Normalize to 0-1 scale using sigmoid
    // Centered at ratio of 2.0 (2 bids per seat)
    const normalized = (avgRatio - 2.0) / 1.5;
    const pressure = 1 / (1 + Math.exp(-normalized));

    let description: string;
    if (avgRatio >= CONFIG.DEMAND_THRESHOLDS.VERY_HIGH) {
        description = `Very high demand (${avgRatio.toFixed(1)} bids/seat)`;
    } else if (avgRatio >= CONFIG.DEMAND_THRESHOLDS.HIGH) {
        description = `High demand (${avgRatio.toFixed(1)} bids/seat)`;
    } else if (avgRatio >= CONFIG.DEMAND_THRESHOLDS.MODERATE) {
        description = `Moderate demand (${avgRatio.toFixed(1)} bids/seat)`;
    } else {
        description = `Low demand (${avgRatio.toFixed(1)} bids/seat)`;
    }

    return { pressure, description };
}

/**
 * Get time slot adjustment based on meeting time
 */
function getTimeSlotAdjustment(meetingTime: string | undefined): number {
    if (!meetingTime) return 1.0;

    // Extract time from pattern like "8:30AM" or "1:30PM"
    const match = meetingTime.match(/(\d{1,2}):(\d{2})(AM|PM)/i);
    if (!match) return 1.0;

    let hours = parseInt(match[1]);
    const isPM = match[3].toUpperCase() === "PM";
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    if (hours < 9) return CONFIG.TIME_SLOT_ADJUSTMENT.MORNING_EARLY;
    if (hours < 13) return CONFIG.TIME_SLOT_ADJUSTMENT.MORNING;
    if (hours < 17) return CONFIG.TIME_SLOT_ADJUSTMENT.AFTERNOON;
    return CONFIG.TIME_SLOT_ADJUSTMENT.EVENING;
}

/**
 * Get campus adjustment
 */
function getCampusAdjustment(campus: string | undefined): number {
    if (!campus) return 1.0;

    const normalized = campus.toLowerCase();
    if (normalized.includes("chicago")) {
        return CONFIG.CAMPUS_ADJUSTMENT.CHICAGO;
    }
    return CONFIG.CAMPUS_ADJUSTMENT.EVANSTON;
}

/**
 * Determine confidence level based on data availability
 */
function determineConfidence(dataPoints: number): "high" | "medium" | "low" | "insufficient" {
    if (dataPoints >= CONFIG.MIN_DATA_HIGH_CONFIDENCE) return "high";
    if (dataPoints >= CONFIG.MIN_DATA_MEDIUM_CONFIDENCE) return "medium";
    if (dataPoints >= CONFIG.MIN_DATA_LOW_CONFIDENCE) return "low";
    return "insufficient";
}

// =============================================================================
// PHASE-SPECIFIC FORECASTING
// =============================================================================

/**
 * Generate forecast for a specific phase
 */
function forecastPhase(
    phase: PhaseType,
    phaseBids: HistoricalBid[],
    allBids: HistoricalBid[],
    professorData: ProfessorData | undefined,
    meetingTime: string | undefined,
    campus: string | undefined
): ForecastResult {
    const factors: ForecastFactor[] = [];
    const currentTerm = getCurrentTermNumber();

    // Extract data for this phase
    const prices: number[] = [];
    const terms: number[] = [];
    const weights: number[] = [];
    const bidsPlaced: number[] = [];
    const spotsAvailable: number[] = [];

    for (const bid of phaseBids) {
        const termNum = parseTermToNumber(bid.term);
        const weight = calculateTimeWeight(termNum, currentTerm);

        prices.push(bid.clearingPrice);
        terms.push(termNum);
        weights.push(weight);

        if (bid.bidsPlaced > 0) bidsPlaced.push(bid.bidsPlaced);
        if (bid.spotsAvailable > 0) spotsAvailable.push(bid.spotsAvailable);
    }

    // If no data for this phase, estimate from other phases
    if (prices.length === 0) {
        return estimateFromOtherPhases(phase, allBids, professorData, meetingTime, campus);
    }

    // Calculate base statistics
    const stats = weightedStatistics(prices, weights);

    // Detect trend
    const { trend, strength: trendStrength } = detectTrend(prices, terms, weights);

    // Calculate adjustments
    let basePrice = stats.mean;

    // 1. Trend adjustment
    let trendMultiplier = 1.0;
    if (trend === "rising") {
        trendMultiplier = 1 + (0.10 * trendStrength); // Up to +10% for strong rising trend
        factors.push({
            name: "Rising Trend",
            impact: (trendMultiplier - 1) * basePrice,
            description: `Prices trending upward (strength: ${(trendStrength * 100).toFixed(0)}%)`,
        });
    } else if (trend === "falling") {
        trendMultiplier = 1 - (0.08 * trendStrength); // Up to -8% for strong falling trend
        factors.push({
            name: "Falling Trend",
            impact: (trendMultiplier - 1) * basePrice,
            description: `Prices trending downward (strength: ${(trendStrength * 100).toFixed(0)}%)`,
        });
    }

    // 2. Professor rating adjustment
    const { multiplier: ratingMultiplier, description: ratingDesc } =
        calculateRatingImpact(professorData?.rating);
    if (ratingMultiplier !== 1.0) {
        factors.push({
            name: "Professor Rating",
            impact: (ratingMultiplier - 1) * basePrice,
            description: ratingDesc,
        });
    }

    // 3. Demand pressure (if data available)
    const { pressure: demandPressure, description: demandDesc } =
        calculateDemandPressure(bidsPlaced, spotsAvailable, weights);
    let demandMultiplier = 1.0;
    if (bidsPlaced.length > 0) {
        // Demand impact: 0-10% based on pressure
        demandMultiplier = 1 + (demandPressure - 0.5) * 0.20;
        factors.push({
            name: "Demand Pressure",
            impact: (demandMultiplier - 1) * basePrice,
            description: demandDesc,
        });
    }

    // 4. Time slot adjustment
    const timeAdjustment = getTimeSlotAdjustment(meetingTime);
    if (timeAdjustment !== 1.0) {
        factors.push({
            name: "Time Slot",
            impact: (timeAdjustment - 1) * basePrice,
            description: timeAdjustment < 1 ? "Less popular time slot" : "Popular time slot",
        });
    }

    // 5. Campus adjustment
    const campusAdjustment = getCampusAdjustment(campus);
    if (campusAdjustment !== 1.0) {
        factors.push({
            name: "Campus Location",
            impact: (campusAdjustment - 1) * basePrice,
            description: "Chicago campus typically has lower demand",
        });
    }

    // Combine all adjustments
    const totalMultiplier = trendMultiplier * ratingMultiplier * demandMultiplier *
                           timeAdjustment * campusAdjustment;

    const expectedPrice = Math.round(basePrice * totalMultiplier);

    // Calculate bid recommendations using adjusted percentiles
    const adjustedPercentile = (p: number) => Math.round(stats.percentile(p) * totalMultiplier);

    // Volatility: coefficient of variation
    const volatility = stats.mean > 0 ? stats.stdDev / stats.mean : 0;

    return {
        phase,
        expectedPrice,
        safeBid: adjustedPercentile(CONFIG.PERCENTILES.SAFE),
        aggressiveBid: adjustedPercentile(CONFIG.PERCENTILES.AGGRESSIVE),
        minimumBid: adjustedPercentile(CONFIG.PERCENTILES.MINIMUM),
        confidence: determineConfidence(prices.length),
        dataPoints: prices.length,
        trend,
        trendStrength,
        volatility,
        demandPressure,
        factors,
    };
}

/**
 * Estimate phase price from other phases when no direct data exists
 */
function estimateFromOtherPhases(
    targetPhase: PhaseType,
    allBids: HistoricalBid[],
    professorData: ProfessorData | undefined,
    meetingTime: string | undefined,
    campus: string | undefined
): ForecastResult {
    // Find the phase with most data to use as base
    const phase1Bids = allBids.filter(b => b.phase === "1");
    const phase2Bids = allBids.filter(b => b.phase === "2");

    let baseBids = phase1Bids.length >= phase2Bids.length ? phase1Bids : phase2Bids;
    let basePhase = phase1Bids.length >= phase2Bids.length ? "1" : "2";

    if (baseBids.length === 0) {
        // No data at all - return insufficient confidence
        return {
            phase: targetPhase,
            expectedPrice: 0,
            safeBid: 0,
            aggressiveBid: 0,
            minimumBid: 0,
            confidence: "insufficient",
            dataPoints: 0,
            trend: "unknown",
            trendStrength: 0,
            volatility: 0,
            demandPressure: 0.5,
            factors: [{
                name: "No Data",
                impact: 0,
                description: "No historical data available for this course/professor combination",
            }],
        };
    }

    // Get base forecast
    const baseForecast = forecastPhase(basePhase as PhaseType, baseBids, allBids,
                                       professorData, meetingTime, campus);

    // Apply phase relationship multiplier
    let multiplier = 1.0;
    let description = "";

    if (basePhase === "1") {
        switch (targetPhase) {
            case "2":
                multiplier = CONFIG.PHASE_RELATIONSHIPS.P2_VS_P1;
                description = "Phase 2 typically 15% higher than Phase 1 for competitive courses";
                break;
            case "3":
                multiplier = CONFIG.PHASE_RELATIONSHIPS.P3_VS_P1;
                description = "Phase 3 (combined pool) typically 15% lower than Phase 1";
                break;
            case "4":
            case "PWYB":
                multiplier = CONFIG.PHASE_RELATIONSHIPS.P4_VS_P1;
                description = "PWYB typically 30% lower, but varies with demand";
                break;
        }
    } else {
        // Base is Phase 2, convert to Phase 1 first, then to target
        const p1Estimate = baseForecast.expectedPrice / CONFIG.PHASE_RELATIONSHIPS.P2_VS_P1;
        switch (targetPhase) {
            case "1":
                multiplier = 1 / CONFIG.PHASE_RELATIONSHIPS.P2_VS_P1;
                description = "Phase 1 typically 15% lower than Phase 2";
                break;
            case "3":
                multiplier = CONFIG.PHASE_RELATIONSHIPS.P3_VS_P1 / CONFIG.PHASE_RELATIONSHIPS.P2_VS_P1;
                description = "Phase 3 estimated from Phase 2 via Phase 1 relationship";
                break;
            case "4":
            case "PWYB":
                multiplier = CONFIG.PHASE_RELATIONSHIPS.P4_VS_P1 / CONFIG.PHASE_RELATIONSHIPS.P2_VS_P1;
                description = "PWYB estimated from Phase 2 via Phase 1 relationship";
                break;
        }
    }

    const factors = [
        ...baseForecast.factors,
        {
            name: "Cross-Phase Estimate",
            impact: (multiplier - 1) * baseForecast.expectedPrice,
            description,
        },
    ];

    return {
        phase: targetPhase,
        expectedPrice: Math.round(baseForecast.expectedPrice * multiplier),
        safeBid: Math.round(baseForecast.safeBid * multiplier),
        aggressiveBid: Math.round(baseForecast.aggressiveBid * multiplier),
        minimumBid: Math.round(baseForecast.minimumBid * multiplier),
        confidence: "low", // Lower confidence for cross-phase estimates
        dataPoints: baseForecast.dataPoints,
        trend: baseForecast.trend,
        trendStrength: baseForecast.trendStrength,
        volatility: baseForecast.volatility,
        demandPressure: baseForecast.demandPressure,
        factors,
    };
}

// =============================================================================
// MAIN FORECASTING FUNCTION
// =============================================================================

/**
 * Generate complete forecast for a course
 *
 * @param context - Course context including historical bids and professor data
 * @returns Complete forecast with all 4 phases and strategy recommendations
 */
export function generateForecast(context: CourseContext): CompleteForecast {
    const { historicalBids, professorData, meetingTime, campus } = context;

    // Separate bids by phase (normalize phase identifiers)
    const normalizePhaseBids = (bids: HistoricalBid[], phases: string[]): HistoricalBid[] => {
        return bids.filter(b => {
            const phaseStr = b.phase.toString().toLowerCase();
            return phases.some(p => phaseStr.includes(p.toLowerCase()));
        });
    };

    const phase1Bids = normalizePhaseBids(historicalBids, ["1"]);
    const phase2Bids = normalizePhaseBids(historicalBids, ["2"]);
    const phase3Bids = normalizePhaseBids(historicalBids, ["3"]);
    const phase4Bids = normalizePhaseBids(historicalBids, ["4", "pwyb", "pay"]);

    // Generate forecasts for each phase
    const phase1 = forecastPhase("1", phase1Bids, historicalBids, professorData, meetingTime, campus);
    const phase2 = forecastPhase("2", phase2Bids, historicalBids, professorData, meetingTime, campus);
    const phase3 = forecastPhase("3", phase3Bids, historicalBids, professorData, meetingTime, campus);
    const phase4 = forecastPhase("4", phase4Bids, historicalBids, professorData, meetingTime, campus);

    // Generate strategy recommendations
    const strategyNotes = generateStrategyNotes(phase1, phase2, phase3, phase4, professorData);
    const overallRecommendation = generateOverallRecommendation(phase1, phase2, phase3, phase4);

    return {
        courseId: context.courseId,
        professor: context.professor,
        forecasts: { phase1, phase2, phase3, phase4 },
        overallRecommendation,
        strategyNotes,
    };
}

/**
 * Generate strategy notes based on forecasts
 */
function generateStrategyNotes(
    p1: ForecastResult,
    p2: ForecastResult,
    p3: ForecastResult,
    p4: ForecastResult,
    professorData: ProfessorData | undefined
): string[] {
    const notes: string[] = [];

    // High demand warning
    if (p1.demandPressure > 0.7) {
        notes.push("HIGH DEMAND: This course consistently has more bidders than seats. Consider using safe bid.");
    }

    // Trend alerts
    if (p1.trend === "rising" && p1.trendStrength > 0.5) {
        notes.push("RISING PRICES: Strong upward trend detected. Historical prices may underestimate future clearing.");
    }
    if (p1.trend === "falling" && p1.trendStrength > 0.5) {
        notes.push("FALLING PRICES: Downward trend detected. You may be able to bid more aggressively.");
    }

    // Phase strategy
    if (p2.expectedPrice > p1.expectedPrice * 1.2) {
        notes.push("Phase 2 significantly higher than Phase 1. Strongly recommend bidding in Phase 1.");
    }

    if (p3.expectedPrice < p1.expectedPrice * 0.8 && p3.confidence !== "insufficient") {
        notes.push("Phase 3 (combined pool) offers potential savings. Consider waiting if flexible on section.");
    }

    if (p4.expectedPrice < p1.expectedPrice * 0.6 && p4.confidence !== "insufficient") {
        notes.push("PWYB phase could save significant points, but seat availability is unpredictable.");
    }

    // Star professor note
    if (professorData?.rating && professorData.rating >= 5.5) {
        notes.push(`STAR PROFESSOR: ${professorData.rating.toFixed(1)}/6.0 rating. Expect competitive bidding.`);
    }

    // Volatility warning
    if (p1.volatility > 0.4) {
        notes.push("HIGH VOLATILITY: Prices vary significantly term-to-term. Consider padding your bid.");
    }

    // Low confidence warning
    if (p1.confidence === "low" || p1.confidence === "insufficient") {
        notes.push("LIMITED DATA: Forecast based on limited history. Use with caution.");
    }

    return notes;
}

/**
 * Generate overall recommendation
 */
function generateOverallRecommendation(
    p1: ForecastResult,
    p2: ForecastResult,
    p3: ForecastResult,
    p4: ForecastResult
): string {
    // Determine best phase to bid
    const phases = [
        { phase: "Phase 1", forecast: p1, risk: "low" },
        { phase: "Phase 2", forecast: p2, risk: "medium" },
        { phase: "Phase 3", forecast: p3, risk: "medium" },
        { phase: "PWYB", forecast: p4, risk: "high" },
    ];

    // Filter to phases with sufficient confidence
    const viable = phases.filter(p =>
        p.forecast.confidence !== "insufficient" && p.forecast.expectedPrice > 0
    );

    if (viable.length === 0) {
        return "Insufficient data for recommendation. Start with the median clearing price from similar courses.";
    }

    // Find lowest cost option
    const cheapest = viable.reduce((min, p) =>
        p.forecast.expectedPrice < min.forecast.expectedPrice ? p : min
    );

    // For high-demand courses, recommend Phase 1
    if (p1.demandPressure > 0.7) {
        return `High demand course. Recommend Phase 1 with safe bid of ${p1.safeBid} points. ` +
               `Later phases are risky due to seat scarcity.`;
    }

    // For typical courses, suggest the value option
    if (cheapest.phase === "PWYB" && p4.confidence !== "low") {
        return `Value opportunity in PWYB at ~${p4.expectedPrice} points, but availability uncertain. ` +
               `Safe option: Phase 1 at ${p1.safeBid} points.`;
    }

    if (cheapest.phase === "Phase 3" && p3.confidence !== "low") {
        return `Phase 3 offers best value at ~${p3.expectedPrice} points if section flexibility is OK. ` +
               `For specific section: Phase 1 at ${p1.safeBid} points.`;
    }

    return `Recommend Phase 1 with ${p1.safeBid} points for high confidence, ` +
           `or ${p1.aggressiveBid} points if willing to risk Phase 2.`;
}

// =============================================================================
// HELPER: CONVERT FROM LEGACY DATA STRUCTURES
// =============================================================================

/**
 * Convert from the existing CourseStats/BidHistory format to our forecasting format
 * This bridges the existing data model with the new forecasting system
 */
export function convertFromLegacyFormat(
    courseStats: {
        courseId: string;
        courseName: string;
        professor: string;
        professorRating?: number;
        history: Array<{
            term: string;
            priceR1: number;
            priceR2: number;
            priceR3?: number;
            priceR4?: number;
            meetingPattern?: string;
        }>;
        meetingPattern?: string;
        campus?: string;
    },
    additionalBids?: Array<{
        term: string;
        phase: string;
        clearingPrice: number;
        spotsAvailable: number;
        bidsPlaced: number;
    }>
): CourseContext {
    const historicalBids: HistoricalBid[] = [];

    // Convert history array
    for (const h of courseStats.history) {
        if (h.priceR1 > 0) {
            historicalBids.push({
                term: h.term,
                phase: "1",
                clearingPrice: h.priceR1,
                spotsAvailable: 0,
                bidsPlaced: 0,
            });
        }
        if (h.priceR2 > 0) {
            historicalBids.push({
                term: h.term,
                phase: "2",
                clearingPrice: h.priceR2,
                spotsAvailable: 0,
                bidsPlaced: 0,
            });
        }
        if (h.priceR3 && h.priceR3 > 0) {
            historicalBids.push({
                term: h.term,
                phase: "3",
                clearingPrice: h.priceR3,
                spotsAvailable: 0,
                bidsPlaced: 0,
            });
        }
        if (h.priceR4 && h.priceR4 > 0) {
            historicalBids.push({
                term: h.term,
                phase: "4",
                clearingPrice: h.priceR4,
                spotsAvailable: 0,
                bidsPlaced: 0,
            });
        }
    }

    // Add any additional detailed bid data
    if (additionalBids) {
        for (const bid of additionalBids) {
            // Map phase string to PhaseType
            let phase: PhaseType = "1";
            const phaseLower = bid.phase.toLowerCase();
            if (phaseLower.includes("2")) phase = "2";
            else if (phaseLower.includes("3")) phase = "3";
            else if (phaseLower.includes("4") || phaseLower.includes("pwyb") || phaseLower.includes("pay")) phase = "4";

            // Check if we already have this term+phase, if so update with demand data
            const existing = historicalBids.find(
                b => b.term === bid.term && b.phase === phase
            );

            if (existing) {
                existing.spotsAvailable = bid.spotsAvailable;
                existing.bidsPlaced = bid.bidsPlaced;
            } else {
                historicalBids.push({
                    term: bid.term,
                    phase,
                    clearingPrice: bid.clearingPrice,
                    spotsAvailable: bid.spotsAvailable,
                    bidsPlaced: bid.bidsPlaced,
                });
            }
        }
    }

    return {
        courseId: courseStats.courseId,
        courseName: courseStats.courseName,
        professor: courseStats.professor,
        historicalBids,
        professorData: courseStats.professorRating
            ? { rating: courseStats.professorRating }
            : undefined,
        meetingTime: courseStats.meetingPattern,
        campus: courseStats.campus,
    };
}

// =============================================================================
// INTEGRATION FUNCTION FOR processData.ts
// =============================================================================

/**
 * Enhanced forecasting function to replace the simple logic in processing.ts
 *
 * Usage in processing.ts:
 *   import { calculateEnhancedForecasts } from './forecasting';
 *   ...
 *   const { forecastR1, forecastR2, forecastR3, forecastR4, strategyNotes } =
 *       calculateEnhancedForecasts(bids, review?.overallRating, meetingPattern, campus);
 */
export function calculateEnhancedForecasts(
    bids: Array<{
        term: string;
        phase: Phase;  // Use the Phase type from data.ts
        clearingPrice: number;
        spotsAvailable: number;
        bidsPlaced: number;
    }>,
    professorRating: number | undefined,
    meetingPattern: string | undefined,
    campus: string | undefined
): {
    forecastR1: number;
    forecastR2: number;
    forecastR3: number;
    forecastR4: number;
    confidence: "high" | "medium" | "low" | "insufficient";
    trend: "rising" | "stable" | "falling" | "unknown";
    demandLevel: "very_high" | "high" | "moderate" | "low";
    strategyNotes: string[];
} {
    // Convert bids to our format
    const historicalBids: HistoricalBid[] = bids.map(b => ({
        term: b.term,
        phase: normalizePhase(b.phase),
        clearingPrice: b.clearingPrice,
        spotsAvailable: b.spotsAvailable,
        bidsPlaced: b.bidsPlaced,
    }));

    // Create context
    const context: CourseContext = {
        courseId: "",
        courseName: "",
        professor: "",
        historicalBids,
        professorData: professorRating ? { rating: professorRating } : undefined,
        meetingTime: meetingPattern,
        campus,
    };

    // Generate forecast
    const forecast = generateForecast(context);

    // Determine demand level
    let demandLevel: "very_high" | "high" | "moderate" | "low" = "moderate";
    const pressure = forecast.forecasts.phase1.demandPressure;
    if (pressure > 0.8) demandLevel = "very_high";
    else if (pressure > 0.6) demandLevel = "high";
    else if (pressure > 0.4) demandLevel = "moderate";
    else demandLevel = "low";

    return {
        forecastR1: forecast.forecasts.phase1.safeBid,
        forecastR2: forecast.forecasts.phase2.safeBid,
        forecastR3: forecast.forecasts.phase3.safeBid,
        forecastR4: forecast.forecasts.phase4.safeBid,
        confidence: forecast.forecasts.phase1.confidence,
        trend: forecast.forecasts.phase1.trend,
        demandLevel,
        strategyNotes: forecast.strategyNotes,
    };
}

/**
 * Normalize phase identifiers from legacy format to our PhaseType
 */
function normalizePhase(phase: Phase): PhaseType {
    const p = phase.toString().toLowerCase();
    if (p === "1" || p.includes("phase 1")) return "1";
    if (p === "2" || p.includes("phase 2")) return "2";
    if (p === "3" || p.includes("phase 3")) return "3";
    if (p === "4" || p.includes("pwyb") || p.includes("pay") || p.includes("add/drop")) return "4";
    return "1"; // Default
}
