"use client";

import { useState, useMemo, useEffect } from "react";
import { AvailableCourse, CourseStats, TimeSlot } from "@/types/data";
import { findAllConflicts, hasScheduleConflict } from "@/lib/processing";
import {
    getMMMCoursesForTerm,
    MMMCourse,
    MMMCourseDisplay,
    convertMMMCourseForDisplay,
    getAllMMMTerms,
} from "@/lib/mmm-courses";
import {
    Search,
    Plus,
    X,
    AlertTriangle,
    CheckCircle,
    Clock,
    MapPin,
    DollarSign,
    BookOpen,
    GraduationCap,
    Coins,
    Save,
    Eye,
    Edit3,
    TrendingUp,
    Star,
    ChevronRight,
    Calendar,
    Info,
    Lock,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceChart } from "./PriceChart";

interface SchedulePlannerProps {
    availableCourses: AvailableCourse[];
    historicalStats: CourseStats[];
}

// LocalStorage key for saved plan
const SAVED_PLAN_KEY = "kellogg-bidder-saved-plan";
const MMM_TOGGLE_KEY = "kellogg-bidder-mmm-visible";

// Course Detail Modal Component
function CourseDetailModal({
    course,
    onClose,
}: {
    course: AvailableCourse;
    onClose: () => void;
}) {
    const stats = course.historicalStats;

    // Click outside to close
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Escape key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold mb-1">{course.courseName}</h2>
                            <p className="text-purple-200 text-sm">{course.courseId}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                            {course.instructor}
                        </span>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                            {course.session}
                        </span>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                            {course.credits} credits
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Schedule Info */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                            Schedule Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutral-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-neutral-600 mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-medium">Meeting Time</span>
                                </div>
                                <p className="text-sm text-neutral-900">
                                    {course.meetingPattern || "TBA"}
                                </p>
                            </div>
                            <div className="bg-neutral-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-neutral-600 mb-1">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-xs font-medium">Location</span>
                                </div>
                                <p className="text-sm text-neutral-900">
                                    {course.campus || "TBA"} {course.location && `- ${course.location}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bid Recommendations */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                            Recommended Bids (Safe Bids)
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <p className="text-xs text-purple-600 font-medium mb-1">Phase 1</p>
                                <p className="text-2xl font-bold text-purple-900">
                                    {course.estimatedBidR1 || "-"}
                                </p>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-4 text-center">
                                <p className="text-xs text-emerald-600 font-medium mb-1">Phase 2</p>
                                <p className="text-2xl font-bold text-emerald-900">
                                    {course.estimatedBidR2 || "-"}
                                </p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-4 text-center">
                                <p className="text-xs text-amber-600 font-medium mb-1">Phase 3</p>
                                <p className="text-2xl font-bold text-amber-900">
                                    {course.estimatedBidR3 || "-"}
                                </p>
                            </div>
                            <div className="bg-rose-50 rounded-lg p-4 text-center">
                                <p className="text-xs text-rose-600 font-medium mb-1">PWYB</p>
                                <p className="text-2xl font-bold text-rose-900">
                                    {course.estimatedBidR4 || "-"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Historical Stats */}
                    {stats ? (
                        <>
                            {/* Forecast Metadata */}
                            {stats.forecastMetadata && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                                        Forecast Analysis
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className={cn(
                                            "px-3 py-1.5 rounded-full text-sm font-medium",
                                            stats.forecastMetadata.confidence === "high" && "bg-emerald-100 text-emerald-700",
                                            stats.forecastMetadata.confidence === "medium" && "bg-amber-100 text-amber-700",
                                            stats.forecastMetadata.confidence === "low" && "bg-orange-100 text-orange-700",
                                            stats.forecastMetadata.confidence === "insufficient" && "bg-red-100 text-red-700"
                                        )}>
                                            {stats.forecastMetadata.confidence} confidence
                                        </span>
                                        {stats.forecastMetadata.trend !== "unknown" && (
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-full text-sm font-medium",
                                                stats.forecastMetadata.trend === "rising" && "bg-rose-100 text-rose-700",
                                                stats.forecastMetadata.trend === "falling" && "bg-emerald-100 text-emerald-700",
                                                stats.forecastMetadata.trend === "stable" && "bg-blue-100 text-blue-700"
                                            )}>
                                                {stats.forecastMetadata.trend} trend
                                            </span>
                                        )}
                                        <span className={cn(
                                            "px-3 py-1.5 rounded-full text-sm font-medium capitalize",
                                            stats.forecastMetadata.demandLevel === "very_high" && "bg-rose-100 text-rose-700",
                                            stats.forecastMetadata.demandLevel === "high" && "bg-orange-100 text-orange-700",
                                            stats.forecastMetadata.demandLevel === "moderate" && "bg-amber-100 text-amber-700",
                                            stats.forecastMetadata.demandLevel === "low" && "bg-emerald-100 text-emerald-700"
                                        )}>
                                            {stats.forecastMetadata.demandLevel.replace("_", " ")} demand
                                        </span>
                                    </div>

                                    {/* Strategy Notes */}
                                    {stats.forecastMetadata.strategyNotes.length > 0 && (
                                        <div className="space-y-2">
                                            {stats.forecastMetadata.strategyNotes.map((note, i) => (
                                                <div key={i} className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                                    <span className="text-amber-800">{note}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Professor Rating */}
                            {stats.professorRating && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                                        Professor
                                    </h3>
                                    <div className="flex items-center gap-4 bg-neutral-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                                            <span className="text-3xl font-bold text-neutral-900">
                                                {stats.professorRating.toFixed(1)}
                                            </span>
                                            <span className="text-neutral-500">/6.0</span>
                                        </div>
                                        <div className="text-sm text-neutral-600">
                                            {stats.professorRating >= 5.5 ? "Star Professor" :
                                             stats.professorRating >= 5.0 ? "Above Average" :
                                             stats.professorRating >= 4.5 ? "Average" : "Below Average"}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Historical Medians */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                                    Historical Median Prices
                                </h3>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="bg-neutral-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-neutral-500 mb-1">P1 Median</p>
                                        <p className="text-lg font-bold text-neutral-900">
                                            {Math.round(stats.medianClearingPriceR1) || "-"}
                                        </p>
                                    </div>
                                    <div className="bg-neutral-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-neutral-500 mb-1">P2 Median</p>
                                        <p className="text-lg font-bold text-neutral-900">
                                            {Math.round(stats.medianClearingPriceR2) || "-"}
                                        </p>
                                    </div>
                                    <div className="bg-neutral-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-neutral-500 mb-1">P3 Median</p>
                                        <p className="text-lg font-bold text-neutral-900">
                                            {Math.round(stats.medianClearingPriceR3 || 0) || "-"}
                                        </p>
                                    </div>
                                    <div className="bg-neutral-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-neutral-500 mb-1">PWYB Median</p>
                                        <p className="text-lg font-bold text-neutral-900">
                                            {Math.round(stats.medianClearingPriceR4 || 0) || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Price History Chart */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Price History ({stats.terms.length} terms)
                                </h3>
                                <div className="bg-neutral-50 rounded-lg p-4">
                                    <PriceChart data={stats.history} showAllPhases={true} />
                                </div>
                            </div>

                            {/* Terms Offered */}
                            <div>
                                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Terms Offered
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {stats.terms.map((term) => (
                                        <span key={term} className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-md">
                                            {term}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-neutral-500">
                            <Info className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                            <p className="font-medium">No Historical Data Available</p>
                            <p className="text-sm mt-1">This course doesn't have historical bid data in the uploaded file.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Color palette for course blocks in weekly view
const COURSE_COLORS = [
    { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-800" },
    { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-800" },
    { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-800" },
    { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-800" },
    { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-800" },
    { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-800" },
    { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-800" },
    { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-800" },
];

// MMM/DSGN course color scheme (slate/gray)
const MMM_COURSE_COLOR = {
    bg: "bg-slate-200",
    border: "border-slate-400",
    text: "text-slate-700",
};

// Weekly Schedule View Component - now includes MMM courses
// Note: Saturday removed since MMM program has NO Saturday classes
function WeeklyScheduleView({
    selectedCourses,
    mmmCourses,
    conflicts,
    showMMMCourses,
    onCourseDoubleClick,
}: {
    selectedCourses: AvailableCourse[];
    mmmCourses: MMMCourseDisplay[];
    conflicts: Array<[AvailableCourse, AvailableCourse]>;
    showMMMCourses: boolean;
    onCourseDoubleClick?: (course: AvailableCourse) => void;
}) {
    // Monday through Friday only - no Saturday classes in MMM program
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const startHour = 8;
    const endHour = 22; // Extended to 10pm for evening DSGN courses
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

    // Create a map of courseId to color index
    const courseColorMap = useMemo(() => {
        const map = new Map<string, number>();
        selectedCourses.forEach((course, index) => {
            const key = `${course.courseId}-${course.section}`;
            map.set(key, index % COURSE_COLORS.length);
        });
        return map;
    }, [selectedCourses]);

    // Get conflicting course IDs
    const conflictingCourseIds = useMemo(() => {
        const ids = new Set<string>();
        conflicts.forEach(([a, b]) => {
            ids.add(`${a.courseId}-${a.section}`);
            ids.add(`${b.courseId}-${b.section}`);
        });
        return ids;
    }, [conflicts]);

    // Format time for display
    const formatHour = (hour: number) => {
        if (hour === 12) return "12pm";
        if (hour > 12) return `${hour - 12}pm`;
        return `${hour}am`;
    };

    // Calculate position and height for a time slot
    const getSlotStyle = (slot: TimeSlot) => {
        const startMinutes = slot.startTime;
        const endMinutes = slot.endTime;
        const startHourDecimal = startMinutes / 60;
        const endHourDecimal = endMinutes / 60;

        const topPercent = ((startHourDecimal - startHour) / (endHour - startHour + 1)) * 100;
        const heightPercent = ((endHourDecimal - startHourDecimal) / (endHour - startHour + 1)) * 100;

        return {
            top: `${topPercent}%`,
            height: `${Math.max(heightPercent, 3)}%`, // Minimum 3% height for visibility
        };
    };

    // Map day abbreviations
    const dayMap: Record<string, string> = {
        Mon: "Mon",
        Tue: "Tue",
        Wed: "Wed",
        Thu: "Thu",
        Fri: "Fri",
        Monday: "Mon",
        Tuesday: "Tue",
        Wednesday: "Wed",
        Thursday: "Thu",
        Friday: "Fri",
    };

    // Filter MMM courses to only those with scheduled time slots (exclude TBA courses from calendar)
    const scheduledMMMCourses = mmmCourses.filter(course => course.timeSlots.length > 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Weekly Schedule</h3>
                {/* Legend */}
                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300"></div>
                        <span className="text-slate-500">Kellogg</span>
                    </div>
                    {showMMMCourses && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-slate-200 border border-slate-400"></div>
                            <span className="text-slate-500">DSGN (MMM)</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Day headers */}
                    <div className="flex border-b border-slate-200 flex-shrink-0">
                        <div className="w-10 flex-shrink-0" />
                        {days.map((day) => (
                            <div
                                key={day}
                                className="flex-1 text-center py-2 text-xs font-medium border-l border-slate-100 text-slate-600"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Time grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex h-[560px] relative">
                            {/* Time labels */}
                            <div className="w-10 flex-shrink-0 relative">
                                {hours.map((hour, idx) => (
                                    <div
                                        key={hour}
                                        className="absolute w-full text-right pr-1"
                                        style={{
                                            top: `${(idx / (hours.length)) * 100}%`,
                                            transform: "translateY(-50%)",
                                        }}
                                    >
                                        <span className="text-[10px] text-slate-400">{formatHour(hour)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Day columns */}
                            {days.map((day) => (
                                <div
                                    key={day}
                                    className="flex-1 border-l border-slate-100 relative"
                                >
                                    {/* Hour grid lines */}
                                    {hours.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="absolute w-full border-t border-slate-50"
                                            style={{ top: `${(idx / hours.length) * 100}%` }}
                                        />
                                    ))}

                                    {/* MMM Course blocks (rendered first, behind Kellogg courses) */}
                                    {/* Only show courses with scheduled time slots (not TBA) */}
                                    {showMMMCourses && scheduledMMMCourses.map((course) => {
                                        const courseKey = `mmm-${course.courseId}`;

                                        return course.timeSlots
                                            .filter((slot) => dayMap[slot.day] === day)
                                            .map((slot, slotIdx) => (
                                                <div
                                                    key={`${courseKey}-${slotIdx}`}
                                                    className={cn(
                                                        "absolute left-0.5 right-0.5 rounded border overflow-hidden",
                                                        MMM_COURSE_COLOR.bg,
                                                        MMM_COURSE_COLOR.border
                                                    )}
                                                    style={getSlotStyle(slot)}
                                                    title={`${course.courseId}: ${course.courseName} (MMM - Locked)`}
                                                >
                                                    <div className="p-0.5 h-full flex flex-col relative">
                                                        <span
                                                            className={cn(
                                                                "text-[9px] font-medium leading-tight truncate",
                                                                MMM_COURSE_COLOR.text
                                                            )}
                                                        >
                                                            {course.courseId}
                                                        </span>
                                                        {/* Lock icon for MMM courses */}
                                                        <Lock className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 text-slate-400" />
                                                    </div>
                                                </div>
                                            ));
                                    })}

                                    {/* Kellogg Course blocks */}
                                    {selectedCourses.map((course) => {
                                        const courseKey = `${course.courseId}-${course.section}`;
                                        const colorIndex = courseColorMap.get(courseKey) || 0;
                                        const colors = COURSE_COLORS[colorIndex];
                                        const isConflicting = conflictingCourseIds.has(courseKey);

                                        return course.timeSlots
                                            .filter((slot) => dayMap[slot.day] === day)
                                            .map((slot, slotIdx) => (
                                                <div
                                                    key={`${courseKey}-${slotIdx}`}
                                                    className={cn(
                                                        "absolute left-0.5 right-0.5 rounded border overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-offset-1",
                                                        isConflicting
                                                            ? "bg-red-100 border-red-300 hover:ring-red-400"
                                                            : `${colors.bg} ${colors.border} hover:ring-indigo-400`
                                                    )}
                                                    style={getSlotStyle(slot)}
                                                    onDoubleClick={() => onCourseDoubleClick?.(course)}
                                                    title="Double-click to view details"
                                                >
                                                    <div className="p-0.5 h-full flex flex-col">
                                                        <span
                                                            className={cn(
                                                                "text-[9px] font-medium leading-tight truncate",
                                                                isConflicting ? "text-red-700" : colors.text
                                                            )}
                                                        >
                                                            {course.courseId.split("-").slice(0, 2).join("-")}
                                                        </span>
                                                    </div>
                                                </div>
                                            ));
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {selectedCourses.length === 0 && mmmCourses.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-slate-300 text-xs text-center px-4">
                        Select courses to see them on the schedule
                    </p>
                </div>
            )}
        </div>
    );
}

export function SchedulePlanner({ availableCourses, historicalStats }: SchedulePlannerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCourses, setSelectedCourses] = useState<AvailableCourse[]>([]);
    const [sessionFilter, setSessionFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"edit" | "saved">("edit");
    const [savedPlan, setSavedPlan] = useState<AvailableCourse[]>([]);
    const [detailCourse, setDetailCourse] = useState<AvailableCourse | null>(null);
    const [hasSavedPlan, setHasSavedPlan] = useState(false);
    const [showMMMCourses, setShowMMMCourses] = useState(true);
    const [selectedMMMTerm, setSelectedMMMTerm] = useState<string>("Spring 2026");

    // Get available MMM terms
    const mmmTerms = useMemo(() => getAllMMMTerms(), []);

    // Get MMM courses for the selected term
    const mmmCourses = useMemo(() => {
        if (!showMMMCourses) return [];
        return getMMMCoursesForTerm(selectedMMMTerm).map(convertMMMCourseForDisplay);
    }, [showMMMCourses, selectedMMMTerm]);

    // Load saved plan and MMM toggle from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(SAVED_PLAN_KEY);
        if (saved) {
            try {
                const savedIds: { courseId: string; section: string }[] = JSON.parse(saved);
                // Match saved IDs with available courses
                const matched = savedIds
                    .map(({ courseId, section }) =>
                        availableCourses.find((c) => c.courseId === courseId && c.section === section)
                    )
                    .filter((c): c is AvailableCourse => c !== undefined);
                setSavedPlan(matched);
                setHasSavedPlan(matched.length > 0);
            } catch (e) {
                console.error("Failed to load saved plan:", e);
            }
        }

        const mmmToggle = localStorage.getItem(MMM_TOGGLE_KEY);
        if (mmmToggle !== null) {
            setShowMMMCourses(mmmToggle === "true");
        }
    }, [availableCourses]);

    // Save MMM toggle preference
    useEffect(() => {
        localStorage.setItem(MMM_TOGGLE_KEY, showMMMCourses.toString());
    }, [showMMMCourses]);

    // Save plan to localStorage
    const savePlan = () => {
        const toSave = selectedCourses.map((c) => ({ courseId: c.courseId, section: c.section }));
        localStorage.setItem(SAVED_PLAN_KEY, JSON.stringify(toSave));
        setSavedPlan(selectedCourses);
        setHasSavedPlan(true);
        setViewMode("saved");
    };

    // Clear saved plan
    const clearSavedPlan = () => {
        localStorage.removeItem(SAVED_PLAN_KEY);
        setSavedPlan([]);
        setHasSavedPlan(false);
        setViewMode("edit");
    };

    // Load saved plan into editor
    const editSavedPlan = () => {
        setSelectedCourses(savedPlan);
        setViewMode("edit");
    };

    // Get unique sessions for filter
    const sessions = useMemo(() => {
        const s = new Set(availableCourses.map((c) => c.session));
        return Array.from(s).sort();
    }, [availableCourses]);

    // Filter courses
    const filteredCourses = useMemo(() => {
        return availableCourses.filter((course) => {
            const matchesSearch =
                course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.courseId.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSession = sessionFilter === "all" || course.session === sessionFilter;
            return matchesSearch && matchesSession;
        });
    }, [availableCourses, searchTerm, sessionFilter]);

    // Find conflicts in selected courses
    const conflicts = useMemo(() => {
        return findAllConflicts(selectedCourses);
    }, [selectedCourses]);

    // Check if adding a course would create conflicts
    const wouldConflict = (course: AvailableCourse) => {
        return selectedCourses.some((selected) => hasScheduleConflict(selected, course));
    };

    const addCourse = (course: AvailableCourse) => {
        if (!selectedCourses.find((c) => c.courseId === course.courseId && c.section === course.section)) {
            setSelectedCourses([...selectedCourses, course]);
        }
    };

    const removeCourse = (course: AvailableCourse) => {
        setSelectedCourses(
            selectedCourses.filter((c) => !(c.courseId === course.courseId && c.section === course.section))
        );
    };

    const isSelected = (course: AvailableCourse) => {
        return selectedCourses.some((c) => c.courseId === course.courseId && c.section === course.section);
    };

    // Calculate totals
    const totalEstimatedBid = selectedCourses.reduce((sum, c) => sum + (c.estimatedBidR1 || 0), 0);
    const totalCredits = selectedCourses.reduce((sum, c) => sum + c.credits, 0);
    const totalMMMCredits = mmmCourses.reduce((sum, c) => sum + c.credits, 0);

    // Simplify meeting pattern for display
    const simplifyPattern = (pattern: string) => {
        if (!pattern || pattern === "TBA" || pattern === "TBA ") return "TBA";
        if (pattern.includes("|")) {
            const entries = pattern.split("|");
            const dayTimes = new Set<string>();
            entries.forEach((entry) => {
                const match = entry.trim().match(/^([A-Za-z]{3})\s+\d{2}\/\d{2}\/\d{4}\s+(.+)$/);
                if (match) {
                    dayTimes.add(`${match[1]} ${match[2]}`);
                }
            });
            return Array.from(dayTimes).slice(0, 2).join(", ") + (dayTimes.size > 2 ? "..." : "");
        }
        return pattern;
    };

    // Courses to display based on view mode
    const displayCourses = viewMode === "saved" ? savedPlan : selectedCourses;
    const displayConflicts = useMemo(() => findAllConflicts(displayCourses), [displayCourses]);

    return (
        <div className="w-full max-w-[1600px] mx-auto p-6 space-y-6">
            {/* Course Detail Modal */}
            {detailCourse && (
                <CourseDetailModal
                    course={detailCourse}
                    onClose={() => setDetailCourse(null)}
                />
            )}

            {/* Page Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Schedule Planner</h1>
                        <p className="text-slate-300 text-sm">
                            Build your ideal course schedule. Double-click any course to view historical data and bid recommendations.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        {hasSavedPlan && (
                            <div className="flex items-center bg-slate-700 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode("edit")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                        viewMode === "edit"
                                            ? "bg-white text-slate-900"
                                            : "text-slate-300 hover:text-white"
                                    )}
                                >
                                    <Edit3 className="w-4 h-4 inline mr-1.5" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => setViewMode("saved")}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                        viewMode === "saved"
                                            ? "bg-white text-slate-900"
                                            : "text-slate-300 hover:text-white"
                                    )}
                                >
                                    <Eye className="w-4 h-4 inline mr-1.5" />
                                    Saved Plan
                                </button>
                            </div>
                        )}
                        {/* Save Button */}
                        {viewMode === "edit" && selectedCourses.length > 0 && (
                            <button
                                onClick={savePlan}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm transition-colors shadow-lg"
                            >
                                <Save className="w-4 h-4" />
                                Save Plan
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Grid Layout - changes based on view mode */}
            <div className={cn(
                "grid gap-6",
                viewMode === "saved"
                    ? "grid-cols-1 lg:grid-cols-3"
                    : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-4"
            )}>
                {/* Column 1-2: Course Browser (only in edit mode) */}
                {viewMode === "edit" && (
                <div className="lg:col-span-2 space-y-4">
                    {/* Search & Filter Row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by course name, ID, or instructor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                        </div>
                        <select
                            value={sessionFilter}
                            onChange={(e) => setSessionFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm min-w-[140px]"
                        >
                            <option value="all">All Sessions</option>
                            {sessions.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Course List */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Available Courses</span>
                            <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                {filteredCourses.length} courses
                            </span>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-50">
                            {filteredCourses.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No courses match your search criteria
                                </div>
                            ) : (
                                filteredCourses.map((course) => {
                                    const selected = isSelected(course);
                                    const wouldHaveConflict = !selected && wouldConflict(course);

                                    return (
                                        <div
                                            key={`${course.courseId}-${course.section}`}
                                            className={cn(
                                                "p-4 transition-all duration-150",
                                                selected
                                                    ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                                                    : wouldHaveConflict
                                                    ? "bg-amber-50/50 border-l-4 border-l-amber-400"
                                                    : "hover:bg-slate-50 border-l-4 border-l-transparent"
                                            )}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    {/* Course name and badges */}
                                                    <div className="flex items-start gap-2 flex-wrap mb-1">
                                                        <span className="font-semibold text-slate-900 text-sm leading-tight">
                                                            {course.courseName}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                            {course.courseId}
                                                        </span>
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                                            {course.session}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {course.credits} credits
                                                        </span>
                                                    </div>

                                                    {/* Instructor */}
                                                    <div className="text-sm text-slate-600 mb-2">
                                                        {course.instructor}
                                                    </div>

                                                    {/* Time and Campus */}
                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-slate-400" />
                                                            {simplifyPattern(course.meetingPattern)}
                                                        </span>
                                                        {course.campus && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3 text-slate-400" />
                                                                {course.campus}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Estimated Bid */}
                                                    {course.estimatedBidR1 !== undefined && course.estimatedBidR1 > 0 && (
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <DollarSign className="w-3 h-3 text-green-600" />
                                                            <span className="text-xs text-green-700 font-semibold">
                                                                Est. Bid: {course.estimatedBidR1} pts
                                                            </span>
                                                            {course.estimatedBidR2 !== undefined &&
                                                                course.estimatedBidR2 > 0 && (
                                                                    <span className="text-xs text-slate-400 ml-1">
                                                                        (R2: {course.estimatedBidR2})
                                                                    </span>
                                                                )}
                                                        </div>
                                                    )}

                                                    {/* Conflict Warning */}
                                                    {wouldHaveConflict && (
                                                        <div className="flex items-center gap-1.5 mt-2 text-amber-600">
                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                            <span className="text-xs font-medium">
                                                                Would conflict with selected course
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Add/Remove Button */}
                                                <button
                                                    onClick={() => (selected ? removeCourse(course) : addCourse(course))}
                                                    className={cn(
                                                        "p-2.5 rounded-lg transition-all duration-150 flex-shrink-0",
                                                        selected
                                                            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                                                            : "bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600"
                                                    )}
                                                    title={selected ? "Remove from schedule" : "Add to schedule"}
                                                >
                                                    {selected ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
                )}

                {/* Column 3: Weekly Schedule View (spans 2 cols in saved view) */}
                <div className={cn(
                    "min-h-[600px]",
                    viewMode === "saved" && "lg:col-span-2"
                )}>
                    <WeeklyScheduleView
                        selectedCourses={displayCourses}
                        mmmCourses={mmmCourses}
                        conflicts={displayConflicts}
                        showMMMCourses={showMMMCourses}
                        onCourseDoubleClick={setDetailCourse}
                    />
                </div>

                {/* Column 4: Summary Panel */}
                <div className="space-y-4">
                    {/* Summary Card */}
                    <div className={cn(
                        "rounded-xl p-5 text-white shadow-lg",
                        viewMode === "saved"
                            ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700"
                            : "bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700"
                    )}>
                        <h3 className={cn(
                            "text-xs font-semibold uppercase tracking-wider mb-4",
                            viewMode === "saved" ? "text-emerald-100" : "text-indigo-100"
                        )}>
                            {viewMode === "saved" ? "Saved Plan" : "Schedule Summary"}
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                    <BookOpen className={cn("w-5 h-5", viewMode === "saved" ? "text-emerald-200" : "text-indigo-200")} />
                                </div>
                                <div className="text-2xl font-bold">{displayCourses.length + (showMMMCourses ? mmmCourses.length : 0)}</div>
                                <div className={cn("text-xs", viewMode === "saved" ? "text-emerald-200" : "text-indigo-200")}>Courses</div>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                    <GraduationCap className={cn("w-5 h-5", viewMode === "saved" ? "text-emerald-200" : "text-indigo-200")} />
                                </div>
                                <div className="text-2xl font-bold">
                                    {(displayCourses.reduce((sum, c) => sum + c.credits, 0) + (showMMMCourses ? totalMMMCredits : 0)).toFixed(1).replace(/\.0$/, '')}
                                </div>
                                <div className={cn("text-xs", viewMode === "saved" ? "text-emerald-200" : "text-indigo-200")}>Credits</div>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                    <Coins className={cn("w-5 h-5", viewMode === "saved" ? "text-emerald-200" : "text-indigo-200")} />
                                </div>
                                <div className="text-2xl font-bold">{displayCourses.reduce((sum, c) => sum + (c.estimatedBidR1 || 0), 0)}</div>
                                <div className={cn("text-xs", viewMode === "saved" ? "text-emerald-200" : "text-indigo-200")}>Est. Bid</div>
                            </div>
                        </div>
                        {/* Saved Plan Actions */}
                        {viewMode === "saved" && (
                            <div className="mt-4 pt-4 border-t border-white/20 flex gap-2">
                                <button
                                    onClick={editSavedPlan}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit Plan
                                </button>
                                <button
                                    onClick={clearSavedPlan}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* MMM Courses Toggle & Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-700">MMM Courses</span>
                                <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">DSGN</span>
                            </div>
                            <button
                                onClick={() => setShowMMMCourses(!showMMMCourses)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                                    showMMMCourses
                                        ? "bg-slate-700 text-white"
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                )}
                            >
                                {showMMMCourses ? (
                                    <>
                                        <ToggleRight className="w-4 h-4" />
                                        Visible
                                    </>
                                ) : (
                                    <>
                                        <ToggleLeft className="w-4 h-4" />
                                        Hidden
                                    </>
                                )}
                            </button>
                        </div>

                        {showMMMCourses && (
                            <>
                                {/* Term Selector */}
                                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                                    <select
                                        value={selectedMMMTerm}
                                        onChange={(e) => setSelectedMMMTerm(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-sm"
                                    >
                                        {mmmTerms.map((term) => (
                                            <option key={term} value={term}>
                                                {term}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* MMM Course List */}
                                <div className="divide-y divide-slate-50 max-h-[200px] overflow-y-auto">
                                    {mmmCourses.length === 0 ? (
                                        <div className="p-4 text-center text-slate-400 text-sm">
                                            No DSGN courses for {selectedMMMTerm}
                                        </div>
                                    ) : (
                                        mmmCourses.map((course) => (
                                            <div
                                                key={course.courseId}
                                                className="p-3 flex items-center gap-3 bg-slate-50/30"
                                            >
                                                <div
                                                    className={cn(
                                                        "w-2 h-10 rounded-full flex-shrink-0",
                                                        // Use different indicator for TBA courses
                                                        course.timeSlots.length === 0
                                                            ? "bg-amber-200 border-amber-400"
                                                            : MMM_COURSE_COLOR.bg,
                                                        course.timeSlots.length === 0
                                                            ? "border-amber-400"
                                                            : MMM_COURSE_COLOR.border,
                                                        "border"
                                                    )}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-sm text-slate-900 truncate flex items-center gap-2">
                                                        {course.courseName}
                                                        <Lock className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                    <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                                                        {course.courseId} - {course.meetingPattern}
                                                        {course.credits !== 1 && (
                                                            <span className="text-xs bg-slate-200 text-slate-600 px-1 rounded ml-1">
                                                                {course.credits} cr
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* MMM Summary */}
                                {mmmCourses.length > 0 && (
                                    <div className="px-4 py-2 bg-slate-100 border-t border-slate-200">
                                        <div className="flex items-center justify-between text-xs text-slate-600">
                                            <span>{mmmCourses.length} DSGN course{mmmCourses.length !== 1 ? "s" : ""}</span>
                                            <span>{totalMMMCredits.toFixed(1).replace(/\.0$/, '')} credit{totalMMMCredits !== 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Conflicts Alert Card */}
                    {displayConflicts.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-red-700 font-semibold mb-3">
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <span>
                                    {displayConflicts.length} Conflict{displayConflicts.length > 1 ? "s" : ""} Detected
                                </span>
                            </div>
                            <div className="space-y-2">
                                {displayConflicts.map(([a, b], i) => (
                                    <div key={i} className="text-xs text-red-600 bg-red-100 rounded-lg p-2.5">
                                        <span className="font-semibold">{a.courseId}</span>
                                        <span className="mx-1.5 text-red-400">conflicts with</span>
                                        <span className="font-semibold">{b.courseId}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No Conflicts Success Card */}
                    {displayConflicts.length === 0 && displayCourses.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-green-700 font-semibold">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                <span>No schedule conflicts</span>
                            </div>
                            <p className="text-xs text-green-600 mt-2 ml-10">
                                All selected courses have compatible times.
                            </p>
                        </div>
                    )}

                    {/* Selected Courses List */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">
                                {viewMode === "saved" ? "Saved Courses" : "Selected Courses"}
                            </span>
                            <span className="text-xs text-slate-400">Double-click for details</span>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-[280px] overflow-y-auto">
                            {displayCourses.length === 0 ? (
                                <div className="p-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                        <Plus className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <p className="text-slate-400 text-sm">No courses selected</p>
                                    <p className="text-slate-300 text-xs mt-1">
                                        Click + to add courses to your schedule
                                    </p>
                                </div>
                            ) : (
                                displayCourses.map((course, index) => {
                                    const colors = COURSE_COLORS[index % COURSE_COLORS.length];
                                    return (
                                        <div
                                            key={`${course.courseId}-${course.section}`}
                                            className="p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                                            onDoubleClick={() => setDetailCourse(course)}
                                        >
                                            <div
                                                className={cn(
                                                    "w-2 h-10 rounded-full flex-shrink-0",
                                                    colors.bg,
                                                    colors.border,
                                                    "border"
                                                )}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-sm text-slate-900 truncate flex items-center gap-2">
                                                    {course.courseName}
                                                    <ChevronRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="text-xs text-slate-500 truncate">
                                                    {course.courseId} - {course.estimatedBidR1 ? `${course.estimatedBidR1} pts` : "No bid data"}
                                                </div>
                                            </div>
                                            {viewMode === "edit" && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeCourse(course); }}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                    title="Remove course"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
