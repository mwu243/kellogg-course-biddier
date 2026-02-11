"use client";

import { useState, useMemo } from "react";
import { AvailableCourse, CourseStats, TimeSlot } from "@/types/data";
import { findAllConflicts, hasScheduleConflict } from "@/lib/processing";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SchedulePlannerProps {
    availableCourses: AvailableCourse[];
    historicalStats: CourseStats[];
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

// Weekly Schedule View Component
function WeeklyScheduleView({
    selectedCourses,
    conflicts,
}: {
    selectedCourses: AvailableCourse[];
    conflicts: Array<[AvailableCourse, AvailableCourse]>;
}) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const startHour = 8;
    const endHour = 21;
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
            <div className="p-3 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-700">Weekly Schedule</h3>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Day headers */}
                    <div className="flex border-b border-slate-200 flex-shrink-0">
                        <div className="w-10 flex-shrink-0" />
                        {days.map((day) => (
                            <div
                                key={day}
                                className="flex-1 text-center py-2 text-xs font-medium text-slate-600 border-l border-slate-100"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Time grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex h-[520px] relative">
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
                                <div key={day} className="flex-1 border-l border-slate-100 relative">
                                    {/* Hour grid lines */}
                                    {hours.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="absolute w-full border-t border-slate-50"
                                            style={{ top: `${(idx / hours.length) * 100}%` }}
                                        />
                                    ))}

                                    {/* Course blocks */}
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
                                                        "absolute left-0.5 right-0.5 rounded border overflow-hidden",
                                                        isConflicting
                                                            ? "bg-red-100 border-red-300"
                                                            : `${colors.bg} ${colors.border}`
                                                    )}
                                                    style={getSlotStyle(slot)}
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

            {selectedCourses.length === 0 && (
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

    return (
        <div className="w-full max-w-[1600px] mx-auto p-6 space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 shadow-lg">
                <h1 className="text-2xl font-bold text-white mb-2">Schedule Planner</h1>
                <p className="text-slate-300 text-sm">
                    Build your ideal course schedule. Browse available courses, preview timing conflicts, and plan your
                    bid strategy.
                </p>
            </div>

            {/* 4-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Column 1-2: Course Browser */}
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

                {/* Column 3: Weekly Schedule View */}
                <div className="min-h-[600px]">
                    <WeeklyScheduleView selectedCourses={selectedCourses} conflicts={conflicts} />
                </div>

                {/* Column 4: Summary Panel */}
                <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-xl p-5 text-white shadow-lg">
                        <h3 className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-4">
                            Schedule Summary
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                    <BookOpen className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div className="text-2xl font-bold">{selectedCourses.length}</div>
                                <div className="text-indigo-200 text-xs">Courses</div>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                    <GraduationCap className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div className="text-2xl font-bold">{totalCredits}</div>
                                <div className="text-indigo-200 text-xs">Credits</div>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                                    <Coins className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div className="text-2xl font-bold">{totalEstimatedBid}</div>
                                <div className="text-indigo-200 text-xs">Est. Bid</div>
                            </div>
                        </div>
                    </div>

                    {/* Conflicts Alert Card */}
                    {conflicts.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-red-700 font-semibold mb-3">
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <span>
                                    {conflicts.length} Conflict{conflicts.length > 1 ? "s" : ""} Detected
                                </span>
                            </div>
                            <div className="space-y-2">
                                {conflicts.map(([a, b], i) => (
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
                    {conflicts.length === 0 && selectedCourses.length > 0 && (
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
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <span className="text-sm font-semibold text-slate-700">Selected Courses</span>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-[280px] overflow-y-auto">
                            {selectedCourses.length === 0 ? (
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
                                selectedCourses.map((course, index) => {
                                    const colors = COURSE_COLORS[index % COURSE_COLORS.length];
                                    return (
                                        <div
                                            key={`${course.courseId}-${course.section}`}
                                            className="p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
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
                                                <div className="font-medium text-sm text-slate-900 truncate">
                                                    {course.courseName}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate">
                                                    {course.courseId} - {simplifyPattern(course.meetingPattern)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeCourse(course)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                title="Remove course"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
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
