import { TimeSlot } from "@/types/data";

// MMM (Master of Management in Manufacturing) Course interface
export interface MMMCourse {
    courseId: string;
    courseName: string;
    quarter: "Summer" | "Fall" | "Winter" | "Spring";
    year: number;
    credits: number;
    timeSlots: TimeSlot[];
    meetingPattern: string;
    location: string;
    isLocked: true; // MMM courses cannot be removed
    type: "DSGN"; // Design courses from McCormick
}

// Helper to create time slots
function createTimeSlot(day: string, startHour: number, startMinute: number, endHour: number, endMinute: number): TimeSlot {
    return {
        day,
        startTime: startHour * 60 + startMinute,
        endTime: endHour * 60 + endMinute,
    };
}

// MMM Class of 2027 DSGN Courses
// All courses meet on weekdays - NO Saturday classes in MMM program
export const MMM_COURSES_2027: MMMCourse[] = [
    {
        courseId: "DSGN-460",
        courseName: "Appropriability by Design",
        quarter: "Summer",
        year: 2025,
        credits: 1,
        // Monday morning class
        timeSlots: [createTimeSlot("Mon", 8, 30, 11, 30)],
        meetingPattern: "Mon 8:30AM - 11:30AM",
        location: "Ford Design Center",
        isLocked: true,
        type: "DSGN",
    },
    {
        courseId: "DSGN-490",
        courseName: "Research - Design - Build (RDB)",
        quarter: "Fall",
        year: 2025,
        credits: 1,
        // Monday evening class (Section 1 - default)
        timeSlots: [createTimeSlot("Mon", 18, 30, 21, 30)],
        meetingPattern: "Mon 6:30PM - 9:30PM",
        location: "Ford Design Studio 1.230",
        isLocked: true,
        type: "DSGN",
    },
    {
        courseId: "DSGN-426",
        courseName: "Whole-Brain Communication",
        quarter: "Fall",
        year: 2025,
        credits: 0.5, // Half credit course - first 5 weeks
        // Wednesday morning class (Section 1 - default)
        timeSlots: [createTimeSlot("Wed", 8, 30, 11, 30)],
        meetingPattern: "Wed 8:30AM - 11:30AM (first 5 weeks)",
        location: "Ford Design Center",
        isLocked: true,
        type: "DSGN",
    },
    {
        courseId: "DSGN-485",
        courseName: "Master Series: Innovation Strategy",
        quarter: "Winter",
        year: 2026,
        credits: 0.5, // Half credit course - first 5 weeks
        // Thursday evening class (first 5 weeks of quarter)
        timeSlots: [createTimeSlot("Thu", 18, 30, 21, 30)],
        meetingPattern: "Thu 6:30PM - 9:30PM (first 5 weeks)",
        location: "Ford room 2.350",
        isLocked: true,
        type: "DSGN",
    },
    {
        courseId: "DSGN-465",
        courseName: "Master Series: Growth Innovation",
        quarter: "Spring",
        year: 2026,
        credits: 0.5, // Half credit course - first 5 weeks
        // Thursday evening class (first 5 weeks of quarter)
        timeSlots: [createTimeSlot("Thu", 18, 30, 21, 30)],
        meetingPattern: "Thu 6:30PM - 9:30PM (first 5 weeks)",
        location: "Ford room 2.350 (The Hive)",
        isLocked: true,
        type: "DSGN",
    },
    {
        courseId: "DSGN-475",
        courseName: "Mindful Product Management",
        quarter: "Fall",
        year: 2026,
        credits: 1,
        // Monday evening class
        timeSlots: [createTimeSlot("Mon", 18, 30, 21, 30)],
        meetingPattern: "Mon 6:30PM - 9:30PM",
        location: "Kellogg Global Hub Room L130",
        isLocked: true,
        type: "DSGN",
    },
    {
        courseId: "DSGN-470",
        courseName: "Curiosity Understanding Empathy",
        quarter: "Fall",
        year: 2026,
        credits: 0.5, // Half credit course
        // Monday & Thursday afternoon class
        timeSlots: [
            createTimeSlot("Mon", 13, 30, 15, 0),
            createTimeSlot("Thu", 13, 30, 15, 0),
        ],
        meetingPattern: "Mon & Thu 1:30PM - 3:00PM",
        location: "Ford Design Center",
        isLocked: true,
        type: "DSGN",
    },
    {
        courseId: "DSGN-425",
        courseName: "Digital Design and Development",
        quarter: "Fall",
        year: 2026,
        credits: 0.5, // Half credit course - first 5 weeks
        // Tuesday afternoon class (first 5 weeks)
        timeSlots: [createTimeSlot("Tue", 14, 0, 17, 0)],
        meetingPattern: "Tue 2:00PM - 5:00PM (first 5 weeks)",
        location: "Ford Design Center",
        isLocked: true,
        type: "DSGN",
    },
    {
        courseId: "DSGN-480",
        courseName: "Business Innovation Lab",
        quarter: "Winter",
        year: 2027,
        credits: 2, // 2 credit capstone course
        // TBA - meeting times determined by team
        timeSlots: [],
        meetingPattern: "TBA",
        location: "TBA",
        isLocked: true,
        type: "DSGN",
    },
];

// Get term string from quarter and year (e.g., "Spring 2026")
export function getTermString(quarter: string, year: number): string {
    return `${quarter} ${year}`;
}

// Parse term string to get quarter and year
export function parseTermString(term: string): { quarter: string; year: number } | null {
    const match = term.match(/^(Summer|Fall|Winter|Spring)\s+(\d{4})$/);
    if (!match) return null;
    return { quarter: match[1], year: parseInt(match[2]) };
}

// Get MMM courses for a specific term (e.g., "Spring 2026")
export function getMMMCoursesForTerm(term: string): MMMCourse[] {
    const parsed = parseTermString(term);
    if (!parsed) return [];

    return MMM_COURSES_2027.filter(
        course => course.quarter === parsed.quarter && course.year === parsed.year
    );
}

// Get all MMM courses up to and including a specific term
// Useful for showing past and current term courses
export function getMMMCoursesUpToTerm(term: string): MMMCourse[] {
    const parsed = parseTermString(term);
    if (!parsed) return [];

    const quarterOrder: Record<string, number> = {
        Winter: 0,
        Spring: 1,
        Summer: 2,
        Fall: 3,
    };

    const targetOrder = parsed.year * 10 + quarterOrder[parsed.quarter];

    return MMM_COURSES_2027.filter(course => {
        const courseOrder = course.year * 10 + quarterOrder[course.quarter];
        return courseOrder <= targetOrder;
    });
}

// Get MMM courses that might overlap with a term (for conflict detection)
// This considers courses in the same quarter regardless of exact term overlap
export function getMMMCoursesOverlappingTerm(term: string): MMMCourse[] {
    const parsed = parseTermString(term);
    if (!parsed) return [];

    // For now, just return courses from the same quarter/year
    // In practice, you might want more sophisticated overlap detection
    return getMMMCoursesForTerm(term);
}

// Convert MMMCourse to a format compatible with weekly schedule display
export interface MMMCourseDisplay {
    courseId: string;
    courseName: string;
    section: string;
    meetingPattern: string;
    timeSlots: TimeSlot[];
    location: string;
    quarter: string;
    year: number;
    credits: number;
    isLocked: true;
    type: "DSGN";
}

export function convertMMMCourseForDisplay(course: MMMCourse): MMMCourseDisplay {
    return {
        courseId: course.courseId,
        courseName: course.courseName,
        section: "MMM",
        meetingPattern: course.meetingPattern,
        timeSlots: course.timeSlots,
        location: course.location,
        quarter: course.quarter,
        year: course.year,
        credits: course.credits,
        isLocked: true,
        type: "DSGN",
    };
}

// Get all unique terms that have MMM courses
export function getAllMMMTerms(): string[] {
    const terms = new Set<string>();
    MMM_COURSES_2027.forEach(course => {
        terms.add(getTermString(course.quarter, course.year));
    });

    // Sort chronologically
    const quarterOrder: Record<string, number> = {
        Winter: 0,
        Spring: 1,
        Summer: 2,
        Fall: 3,
    };

    return Array.from(terms).sort((a, b) => {
        const parsedA = parseTermString(a);
        const parsedB = parseTermString(b);
        if (!parsedA || !parsedB) return 0;
        const orderA = parsedA.year * 10 + quarterOrder[parsedA.quarter];
        const orderB = parsedB.year * 10 + quarterOrder[parsedB.quarter];
        return orderA - orderB;
    });
}
