"use client";

import { useState, useMemo } from "react";
import { CourseStats, Phase } from "@/types/data";
import { Search, Filter, X, Star, Clock, MapPin, TrendingUp, BookOpen, Users, DollarSign, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceChart } from "./PriceChart";
import { BidProbabilityChart } from "./BidProbabilityChart";

interface DashboardProps {
    data: CourseStats[];
}

export function Dashboard({ data }: DashboardProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPhase, setSelectedPhase] = useState<Phase>("1");
    const [selectedCourse, setSelectedCourse] = useState<CourseStats | null>(null);

    // Compute stats
    const stats = useMemo(() => {
        const uniqueProfessors = new Set(data.map((c) => c.professor)).size;
        const uniqueTerms = new Set(data.flatMap((c) => c.terms)).size;
        const avgR1Price = data.length > 0
            ? Math.round(data.reduce((sum, c) => sum + c.medianClearingPriceR1, 0) / data.length)
            : 0;
        return {
            totalCourses: data.length,
            uniqueProfessors,
            avgR1Price,
            termsCovered: uniqueTerms,
        };
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter((course) => {
            const matchesSearch =
                course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.professor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.courseId.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [data, searchTerm]);

    const getPriceColor = (price: number) => {
        if (price < 100) return "text-emerald-600 bg-emerald-50";
        if (price < 300) return "text-amber-600 bg-amber-50";
        return "text-rose-600 bg-rose-50";
    };

    const clearSearch = () => setSearchTerm("");

    return (
        <div className="w-full min-h-screen bg-neutral-50">
            {/* Stats Bar */}
            <div className="bg-white border-b border-neutral-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full">
                            <BookOpen className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-neutral-700">{stats.totalCourses}</span>
                            <span className="text-xs text-neutral-500">Courses</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-neutral-700">{stats.uniqueProfessors}</span>
                            <span className="text-xs text-neutral-500">Professors</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-neutral-700">{stats.avgR1Price}</span>
                            <span className="text-xs text-neutral-500">Avg R1 Price</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-neutral-700">{stats.termsCovered}</span>
                            <span className="text-xs text-neutral-500">Terms</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Section */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* Search Input */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search courses, professors, or course IDs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-12 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-neutral-900 placeholder:text-neutral-400 shadow-sm transition-shadow hover:shadow-md"
                        />
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Phase Toggle - Segmented Control - All 4 Phases */}
                    <div className="flex items-center bg-neutral-100 p-1 rounded-xl">
                        {(["1", "2", "3", "4"] as Phase[]).map((phase) => (
                            <button
                                key={phase}
                                onClick={() => setSelectedPhase(phase)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                                    selectedPhase === phase
                                        ? "bg-white text-purple-700 shadow-sm"
                                        : "text-neutral-500 hover:text-neutral-700"
                                )}
                            >
                                {phase === "4" ? "PWYB" : `P${phase}`}
                            </button>
                        ))}
                    </div>

                    {/* Filter Button */}
                    <button className="flex items-center gap-2 px-5 py-2.5 h-12 bg-white border border-neutral-200 rounded-xl text-neutral-700 font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm">
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                    </button>
                </div>

                {/* Results count */}
                <div className="mt-4 text-sm text-neutral-500">
                    Showing <span className="font-medium text-neutral-700">{filteredData.length}</span> courses
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Course List */}
                    <div className="lg:col-span-3 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 scrollbar-thin">
                        {filteredData.map((course) => {
                            const isSelected = selectedCourse?.courseId === course.courseId && selectedCourse?.professor === course.professor;
                            const price = Math.round(course.medianClearingPriceR1);

                            return (
                                <div
                                    key={course.courseId + course.professor}
                                    onClick={() => setSelectedCourse(course)}
                                    className={cn(
                                        "bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 border-2",
                                        isSelected
                                            ? "border-purple-500 bg-purple-50/50 shadow-md"
                                            : "border-transparent hover:border-neutral-200 hover:shadow-md shadow-sm"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-neutral-900 truncate">{course.courseName}</h3>
                                                {course.isGoodValue && (
                                                    <span className="flex-shrink-0 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                                        Value
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-neutral-500 mb-2">{course.courseId}</p>

                                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                                <span className="text-neutral-700 font-medium">{course.professor}</span>
                                                {course.meetingPattern && (
                                                    <span className="flex items-center gap-1 text-neutral-500">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {course.meetingPattern}
                                                    </span>
                                                )}
                                                {course.campus && (
                                                    <span className="flex items-center gap-1 text-neutral-500">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {course.campus}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-bold",
                                                getPriceColor(price)
                                            )}>
                                                {price} pts
                                            </span>
                                            {course.professorRating && (
                                                <span className="flex items-center gap-1 text-sm text-amber-600">
                                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                    <span className="font-semibold">{course.professorRating.toFixed(1)}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredData.length === 0 && (
                            <div className="bg-white rounded-xl p-12 text-center">
                                <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                                <p className="text-neutral-500">No courses match your search criteria</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Course Details Panel */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-6">
                            {selectedCourse ? (
                                <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden">
                                    {/* Header */}
                                    <div className="p-6 border-b border-neutral-100">
                                        <h2 className="text-xl font-bold text-neutral-900 mb-1">{selectedCourse.courseName}</h2>
                                        <p className="text-neutral-600 font-medium mb-3">{selectedCourse.professor}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCourse.meetingPattern && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-700 text-sm rounded-full">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {selectedCourse.meetingPattern}
                                                </span>
                                            )}
                                            {selectedCourse.campus && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 text-neutral-700 text-sm rounded-full">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {selectedCourse.campus}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recommended Bid Card */}
                                    <div className="p-6">
                                        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl p-6 text-white">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-5 h-5 text-purple-400" />
                                                <span className="text-neutral-400 text-sm font-medium">
                                                    Recommended Bid ({selectedPhase === "4" ? "PWYB" : `Phase ${selectedPhase}`})
                                                </span>
                                            </div>
                                            <div className="text-5xl font-bold mb-3 tracking-tight">
                                                {(() => {
                                                    const forecasts: Record<string, number | undefined> = {
                                                        "1": selectedCourse.forecastedBidR1,
                                                        "2": selectedCourse.forecastedBidR2,
                                                        "3": selectedCourse.forecastedBidR3,
                                                        "4": selectedCourse.forecastedBidR4,
                                                    };
                                                    return forecasts[selectedPhase] ?? "N/A";
                                                })()}
                                                <span className="text-2xl font-normal text-neutral-400 ml-2">pts</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full">
                                                    Safe Bid
                                                </span>
                                                {selectedCourse.forecastMetadata?.confidence && (
                                                    <span className={cn(
                                                        "px-3 py-1 text-xs font-semibold rounded-full",
                                                        selectedCourse.forecastMetadata.confidence === "high" && "bg-emerald-500/20 text-emerald-300",
                                                        selectedCourse.forecastMetadata.confidence === "medium" && "bg-amber-500/20 text-amber-300",
                                                        selectedCourse.forecastMetadata.confidence === "low" && "bg-orange-500/20 text-orange-300",
                                                        selectedCourse.forecastMetadata.confidence === "insufficient" && "bg-red-500/20 text-red-300"
                                                    )}>
                                                        {selectedCourse.forecastMetadata.confidence} confidence
                                                    </span>
                                                )}
                                                {selectedCourse.forecastMetadata?.trend && selectedCourse.forecastMetadata.trend !== "unknown" && (
                                                    <span className={cn(
                                                        "px-3 py-1 text-xs font-semibold rounded-full",
                                                        selectedCourse.forecastMetadata.trend === "rising" && "bg-rose-500/20 text-rose-300",
                                                        selectedCourse.forecastMetadata.trend === "falling" && "bg-emerald-500/20 text-emerald-300",
                                                        selectedCourse.forecastMetadata.trend === "stable" && "bg-blue-500/20 text-blue-300"
                                                    )}>
                                                        {selectedCourse.forecastMetadata.trend} trend
                                                    </span>
                                                )}
                                                {selectedCourse.isGoodValue && (
                                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full">
                                                        Great Value
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Strategy Notes */}
                                        {selectedCourse.forecastMetadata?.strategyNotes && selectedCourse.forecastMetadata.strategyNotes.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Strategy Notes</h4>
                                                {selectedCourse.forecastMetadata.strategyNotes.map((note, i) => (
                                                    <div key={i} className="text-sm text-neutral-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                                        {note}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats Grid - All 4 Phases */}
                                    <div className="px-6 pb-6">
                                        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Historical Medians</h4>
                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            <div className="bg-purple-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-purple-600 font-medium mb-1">P1</p>
                                                <p className="text-lg font-bold text-purple-900">{Math.round(selectedCourse.medianClearingPriceR1) || "-"}</p>
                                            </div>
                                            <div className="bg-emerald-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-emerald-600 font-medium mb-1">P2</p>
                                                <p className="text-lg font-bold text-emerald-900">{Math.round(selectedCourse.medianClearingPriceR2) || "-"}</p>
                                            </div>
                                            <div className="bg-amber-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-amber-600 font-medium mb-1">P3</p>
                                                <p className="text-lg font-bold text-amber-900">{Math.round(selectedCourse.medianClearingPriceR3 ?? 0) || "-"}</p>
                                            </div>
                                            <div className="bg-rose-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-rose-600 font-medium mb-1">PWYB</p>
                                                <p className="text-lg font-bold text-rose-900">{Math.round(selectedCourse.medianClearingPriceR4 ?? 0) || "-"}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-neutral-50 rounded-xl p-4">
                                                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Prof Rating</p>
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                                    <p className="text-2xl font-bold text-neutral-900">
                                                        {selectedCourse.professorRating?.toFixed(1) ?? "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-neutral-50 rounded-xl p-4">
                                                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Terms Offered</p>
                                                <p className="text-2xl font-bold text-neutral-900">{selectedCourse.terms?.length ?? 0}</p>
                                            </div>
                                            {selectedCourse.forecastMetadata?.demandLevel && (
                                                <div className="bg-neutral-50 rounded-xl p-4 col-span-2">
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Demand Level</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-lg font-bold capitalize",
                                                            selectedCourse.forecastMetadata.demandLevel === "very_high" && "text-rose-600",
                                                            selectedCourse.forecastMetadata.demandLevel === "high" && "text-orange-600",
                                                            selectedCourse.forecastMetadata.demandLevel === "moderate" && "text-amber-600",
                                                            selectedCourse.forecastMetadata.demandLevel === "low" && "text-emerald-600"
                                                        )}>
                                                            {selectedCourse.forecastMetadata.demandLevel.replace("_", " ")}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price History Chart */}
                                    <div className="px-6 pb-6">
                                        <h4 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-purple-600" />
                                            Price History
                                        </h4>
                                        <div className="bg-neutral-50 rounded-xl p-4">
                                            <PriceChart data={selectedCourse.history} />
                                        </div>
                                    </div>

                                    {/* Win Probability Chart */}
                                    <div className="px-6 pb-6 border-t border-neutral-100 pt-6">
                                        <h4 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                                            Win Probability (Phase {selectedPhase === "4" ? "PWYB" : selectedPhase})
                                        </h4>
                                        <div className="bg-neutral-50 rounded-xl p-4">
                                            <BidProbabilityChart
                                                data={selectedPhase === "1" ? selectedCourse.probabilityDataR1 ?? [] : selectedPhase === "2" ? selectedCourse.probabilityDataR2 ?? [] : []}
                                                safeBid={(() => {
                                                    const forecasts: Record<string, number | undefined> = {
                                                        "1": selectedCourse.forecastedBidR1,
                                                        "2": selectedCourse.forecastedBidR2,
                                                        "3": selectedCourse.forecastedBidR3,
                                                        "4": selectedCourse.forecastedBidR4,
                                                    };
                                                    return forecasts[selectedPhase] ?? 0;
                                                })()}
                                            />
                                        </div>
                                    </div>

                                    {/* Terms Offered Tags */}
                                    {selectedCourse.terms && selectedCourse.terms.length > 0 && (
                                        <div className="px-6 pb-6">
                                            <h4 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-purple-600" />
                                                Terms Offered
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedCourse.terms.map((term) => (
                                                    <span
                                                        key={term}
                                                        className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-md"
                                                    >
                                                        {term}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Empty State */
                                <div className="bg-white rounded-2xl border-2 border-dashed border-neutral-200 p-12 text-center">
                                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <BookOpen className="w-8 h-8 text-neutral-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Course Selected</h3>
                                    <p className="text-neutral-500 text-sm">
                                        Select a course from the list to view detailed analytics and bid recommendations
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
