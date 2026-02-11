import { AvailableCourse, BidHistory, CourseStats, Phase, ProfessorReview, TimeSlot } from "@/types/data";

// Helper to normalize strings for comparison
const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

export function processData(rawBids: any[], rawReviews: any[]): CourseStats[] {
    const coursesMap = new Map<string, CourseStats>();

    // 1. Process Reviews into a lookup map
    const reviewsMap = new Map<string, ProfessorReview>();
    rawReviews.forEach((row) => {
        const name = row["Professor Name"] || row["Name"] || row["professor"];
        const rating = parseFloat(row["Rating"] || row["Overall Rating"] || row["rating"] || "0");
        if (name) {
            reviewsMap.set(normalize(name), {
                professorName: name,
                overallRating: rating,
            });
        }
    });

    // 2. Group Bids by Course + Professor
    type GroupKey = string;
    const groups = new Map<GroupKey, BidHistory[]>();

    rawBids.forEach((row) => {
        // Adapter for various CSV header formats (including Kellogg BidStats format)
        const courseId = row["CourseName"] || row["Course ID"] || row["Course"] || row["course_id"];
        const courseName = row["Course Title"] || row["Course Name"] || row["Title"] || row["course_name"];
        const professor = row["Faculty"] || row["Professor"] || row["Instructor"] || row["professor"];
        const price = parseInt(row["Closing Cost"] || row["Clearing Price"] || row["Price"] || row["price"] || "0");
        const rawPhase = (row["Phase"] || row["Round"] || row["phase"] || "Unknown").toString();

        // Extract phase number from strings like "Fall 2023 Bid Phase 1" or "Fall 2023 Pay What You Bid"
        let phase: Phase = "Unknown";
        if (rawPhase.includes("Phase 1") || rawPhase.includes("Round 1")) {
            phase = "1";
        } else if (rawPhase.includes("Phase 2") || rawPhase.includes("Round 2")) {
            phase = "2";
        } else if (rawPhase.includes("Phase 3") || rawPhase.includes("Round 3")) {
            phase = "1"; // Treat Phase 3 as similar to Phase 1 for stats
        } else if (rawPhase.includes("Pay What You Bid") || rawPhase.includes("Add/Drop")) {
            phase = "Add/Drop";
        } else if (rawPhase === "1" || rawPhase === "2") {
            phase = rawPhase as Phase;
        }

        if (!courseId || !professor) return;

        const key = `${normalize(courseId)}|${normalize(professor)}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        // Extract meeting pattern - simplify multi-line patterns to just the day/time
        const rawMeetingPattern = row["Meeting Pattern"] || row["Schedule"] || "";
        // If it has <br/> tags, extract the core pattern (day and time)
        let meetingPattern = rawMeetingPattern;
        if (rawMeetingPattern.includes("<br/>")) {
            // Take first line and extract day + time range
            const firstLine = rawMeetingPattern.split("<br/>")[0];
            // Try to extract just "Day HH:MMAM - HH:MMPM" pattern
            const match = firstLine.match(/^([A-Za-z]{3})\s+\d{2}\/\d{2}\/\d{4}\s+(.+)$/);
            if (match) {
                meetingPattern = `${match[1]} ${match[2]}`;
            } else {
                meetingPattern = firstLine;
            }
        }

        groups.get(key)?.push({
            courseId,
            courseName,
            professor,
            term: row["Term"] || row["Quarter"] || "Unknown",
            phase,
            clearingPrice: price,
            spotsAvailable: parseInt(row["Seats Available"] || row["Spots"] || "0"),
            bidsPlaced: parseInt(row["Number of Bids"] || row["Bids"] || "0"),
            meetingPattern,
            campus: row["Campus"] || "",
        });
    });

    // 3. Aggregate Stats
    groups.forEach((bids, key) => {
        const { courseId, courseName, professor } = bids[0]; // Take metadata from first entry

        // Sort by price to calc median
        const bidsR1 = bids.filter(b => b.phase === "1");
        const bidsR2 = bids.filter(b => b.phase === "2");

        const calcMedian = (items: BidHistory[]) => {
            if (items.length === 0) return 0;
            const sorted = [...items].sort((a, b) => a.clearingPrice - b.clearingPrice);
            const midpoint = Math.floor(sorted.length / 2);
            return sorted[midpoint].clearingPrice;
        };

        const calcAvg = (items: BidHistory[]) => {
            if (items.length === 0) return 0;
            return items.reduce((sum, b) => sum + b.clearingPrice, 0) / items.length;
        };

        // Build History Series
        const terms = Array.from(new Set(bids.map(b => b.term))); // Unique terms
        // Sort terms chronologically
        terms.sort((a, b) => {
            const parseTermOrder = (t: string) => {
                const match = t.match(/(Winter|Spring|Summer|Fall)\s+(\d{4})/);
                if (!match) return 0;
                const seasonOrder: Record<string, number> = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 };
                return parseInt(match[2]) * 10 + seasonOrder[match[1]];
            };
            return parseTermOrder(a) - parseTermOrder(b);
        });

        const history = terms.map(term => {
            const turnBids = bids.filter(b => b.term === term);
            const p1 = turnBids.find(b => b.phase === "1")?.clearingPrice || 0;
            const p2 = turnBids.find(b => b.phase === "2")?.clearingPrice || 0;
            const pattern = turnBids[0]?.meetingPattern || "";
            return { term, priceR1: p1, priceR2: p2, meetingPattern: pattern };
        });

        // Get most recent meeting pattern and campus
        const latestBid = bids[bids.length - 1];
        const meetingPattern = latestBid?.meetingPattern || "";
        const campus = latestBid?.campus || "";

        // Link Review
        const normProf = normalize(professor);
        let review: ProfessorReview | undefined;

        // Simple fuzzy match attempt
        for (const [rName, rObj] of reviewsMap.entries()) {
            if (normProf.includes(rName) || rName.includes(normProf)) {
                review = rObj;
                break;
            }
        }

        // Forecasting Logic
        const basePriceR1 = calcMedian(bidsR1);
        const starPower = (review?.overallRating || 0) > 5.5;

        // Simple Forecast: Median + 15% if Star Power
        let forecastR1 = basePriceR1;
        if (starPower) forecastR1 = Math.ceil(forecastR1 * 1.15);
        // If no history, maybe fallback? For now 0.

        // Forecast R2
        const basePriceR2 = calcMedian(bidsR2);
        let forecastR2 = basePriceR2;
        // R2 is usually cheaper, but if R1 was super high, maybe R2 is also high?

        coursesMap.set(key, {
            courseId,
            courseName,
            professor,
            meetingPattern,
            campus,
            terms,
            avgClearingPriceR1: calcAvg(bidsR1),
            avgClearingPriceR2: calcAvg(bidsR2),
            medianClearingPriceR1: calcMedian(bidsR1),
            medianClearingPriceR2: calcMedian(bidsR2),
            professorReview: review,
            professorRating: review?.overallRating,
            forecastedBidR1: forecastR1,
            forecastedBidR2: forecastR2,
            isGoodValue: (review?.overallRating || 0) > 5.0 && basePriceR1 < 500,
            history,
        });
    });

    return Array.from(coursesMap.values());
}

// Parse time string like "8:30AM" or "1:30PM" to minutes from midnight
function parseTime(timeStr: string): number {
    const match = timeStr.match(/(\d{1,2}):(\d{2})(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const isPM = match[3].toUpperCase() === "PM";
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
}

// Parse meeting pattern into time slots
// Handles formats like:
// - "Tue/Fri 8:30AM - 10:00AM"
// - "Thu 04/02/2026 8:30AM - 10:00AM|Mon 04/06/2026 8:30AM - 10:00AM|..."
// - "Wed 6:30PM - 9:30PM"
function parseMeetingPattern(pattern: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    if (!pattern || pattern === "TBA" || pattern === "TBA ") return slots;

    // Handle pipe-separated specific dates
    if (pattern.includes("|")) {
        const entries = pattern.split("|");
        const dayTimeMap = new Map<string, { start: number; end: number }>();

        entries.forEach(entry => {
            // Format: "Thu 04/02/2026 8:30AM - 10:00AM"
            const match = entry.trim().match(/^([A-Za-z]{3})\s+\d{2}\/\d{2}\/\d{4}\s+(\d{1,2}:\d{2}[AP]M)\s*-\s*(\d{1,2}:\d{2}[AP]M)$/i);
            if (match) {
                const day = match[1];
                const key = `${day}-${match[2]}-${match[3]}`;
                if (!dayTimeMap.has(key)) {
                    dayTimeMap.set(key, {
                        start: parseTime(match[2]),
                        end: parseTime(match[3])
                    });
                    slots.push({
                        day: day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(),
                        startTime: parseTime(match[2]),
                        endTime: parseTime(match[3])
                    });
                }
            }
        });
        return slots;
    }

    // Handle simple format: "Tue/Fri 8:30AM - 10:00AM" or "Wed 6:30PM - 9:30PM"
    const simpleMatch = pattern.match(/^([A-Za-z\/]+)\s+(\d{1,2}:\d{2}[AP]M)\s*-\s*(\d{1,2}:\d{2}[AP]M)$/i);
    if (simpleMatch) {
        const days = simpleMatch[1].split("/");
        const startTime = parseTime(simpleMatch[2]);
        const endTime = parseTime(simpleMatch[3]);

        days.forEach(day => {
            slots.push({
                day: day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(),
                startTime,
                endTime
            });
        });
    }

    return slots;
}

// Check if two time slots overlap
function timeSlotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
    if (a.day !== b.day) return false;
    return a.startTime < b.endTime && b.startTime < a.endTime;
}

// Check if two courses have schedule conflicts
export function hasScheduleConflict(courseA: AvailableCourse, courseB: AvailableCourse): boolean {
    // If different sessions that don't overlap (1st 5WK vs 2nd 5WK), no conflict
    if ((courseA.session === "1st 5WK" && courseB.session === "2nd 5WK") ||
        (courseA.session === "2nd 5WK" && courseB.session === "1st 5WK")) {
        return false;
    }

    for (const slotA of courseA.timeSlots) {
        for (const slotB of courseB.timeSlots) {
            if (timeSlotsOverlap(slotA, slotB)) {
                return true;
            }
        }
    }
    return false;
}

// Find all conflicts for a set of selected courses
export function findAllConflicts(courses: AvailableCourse[]): Array<[AvailableCourse, AvailableCourse]> {
    const conflicts: Array<[AvailableCourse, AvailableCourse]> = [];
    for (let i = 0; i < courses.length; i++) {
        for (let j = i + 1; j < courses.length; j++) {
            if (hasScheduleConflict(courses[i], courses[j])) {
                conflicts.push([courses[i], courses[j]]);
            }
        }
    }
    return conflicts;
}

// Process schedule CSV and link to historical data
export function processSchedule(rawSchedule: any[], historicalStats: CourseStats[]): AvailableCourse[] {
    const courses: AvailableCourse[] = [];

    // Build lookup for historical data by course ID (without section) and instructor
    const statsLookup = new Map<string, CourseStats>();
    historicalStats.forEach(stat => {
        // Key by course base ID (e.g., "MORS-472" from "MORS-472-5") and normalized professor
        const baseId = stat.courseId.replace(/-\d+$/, ""); // Remove section suffix
        const key = `${normalize(baseId)}|${normalize(stat.professor)}`;
        statsLookup.set(key, stat);

        // Also key by just course ID for fallback
        statsLookup.set(normalize(baseId), stat);
    });

    rawSchedule.forEach(row => {
        const courseId = row["Course Name"] || "";
        const courseName = row["Course Title"] || "";
        const instructor = row["Instructor"] || "";
        const meetingPattern = row["Meeting Pattern"] || "";
        const session = row["Session"] || "10WK";

        if (!courseId) return;

        const timeSlots = parseMeetingPattern(meetingPattern);

        // Try to find historical data
        const baseId = courseId.replace(/-\d+$/, "");
        const key = `${normalize(baseId)}|${normalize(instructor)}`;
        let historicalStats = statsLookup.get(key);

        // Fallback: try just course ID
        if (!historicalStats) {
            historicalStats = statsLookup.get(normalize(baseId));
        }

        courses.push({
            courseId,
            courseName,
            credits: parseFloat(row["Credits"] || "1"),
            term: row["Term"] || "",
            session,
            section: row["Section"] || "",
            meetingPattern,
            timeSlots,
            instructor,
            campus: row["Campus"] || "",
            location: row["Location"] || "",
            historicalStats,
            estimatedBidR1: historicalStats?.forecastedBidR1,
            estimatedBidR2: historicalStats?.forecastedBidR2,
        });
    });

    return courses;
}

// Format time slot for display
export function formatTimeSlot(slot: TimeSlot): string {
    const formatMinutes = (mins: number) => {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        return `${displayHours}:${minutes.toString().padStart(2, "0")}${period}`;
    };
    return `${slot.day} ${formatMinutes(slot.startTime)} - ${formatMinutes(slot.endTime)}`;
}
