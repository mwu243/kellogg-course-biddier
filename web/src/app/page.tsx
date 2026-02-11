"use client";

import { useState } from "react";
import { DataUploader } from "@/components/DataUploader";
import { Dashboard } from "@/components/Dashboard";
import { SchedulePlanner } from "@/components/SchedulePlanner";
import { CourseStats, AvailableCourse } from "@/types/data";
import { processData, processSchedule } from "@/lib/processing";
import { cn } from "@/lib/utils";
import { BarChart3, CalendarDays, Upload, Menu } from "lucide-react";

type View = "history" | "planner";

export default function Home() {
    const [historicalData, setHistoricalData] = useState<CourseStats[] | null>(null);
    const [scheduleData, setScheduleData] = useState<AvailableCourse[] | null>(null);
    const [currentView, setCurrentView] = useState<View>("history");

    const handleDataLoaded = (bids: any[], reviews: any[], schedule: any[]) => {
        const processed = processData(bids, reviews);
        setHistoricalData(processed);

        if (schedule && schedule.length > 0) {
            const availableCourses = processSchedule(schedule, processed);
            setScheduleData(availableCourses);
            setCurrentView("planner");
        }
    };

    const resetData = () => {
        setHistoricalData(null);
        setScheduleData(null);
        setCurrentView("history");
    };

    return (
        <main className="min-h-screen bg-neutral-50">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20" />
                            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                                K
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-semibold text-neutral-900 text-base leading-tight">Kellogg Bidding</h1>
                            <p className="text-xs text-neutral-500 -mt-0.5">Course Analytics</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    {historicalData && (
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* View Tabs */}
                            <nav className="hidden sm:flex items-center p-1 bg-neutral-100 rounded-lg">
                                <button
                                    onClick={() => setCurrentView("history")}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                        currentView === "history"
                                            ? "bg-white text-neutral-900 shadow-sm"
                                            : "text-neutral-500 hover:text-neutral-700"
                                    )}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    <span>Historical Data</span>
                                </button>
                                {scheduleData && (
                                    <button
                                        onClick={() => setCurrentView("planner")}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                            currentView === "planner"
                                                ? "bg-white text-neutral-900 shadow-sm"
                                                : "text-neutral-500 hover:text-neutral-700"
                                        )}
                                    >
                                        <CalendarDays className="w-4 h-4" />
                                        <span>Schedule Planner</span>
                                    </button>
                                )}
                            </nav>

                            {/* Mobile Nav */}
                            <div className="flex sm:hidden items-center gap-1 p-1 bg-neutral-100 rounded-lg">
                                <button
                                    onClick={() => setCurrentView("history")}
                                    className={cn(
                                        "p-2 rounded-md transition-all",
                                        currentView === "history"
                                            ? "bg-white text-neutral-900 shadow-sm"
                                            : "text-neutral-500"
                                    )}
                                >
                                    <BarChart3 className="w-5 h-5" />
                                </button>
                                {scheduleData && (
                                    <button
                                        onClick={() => setCurrentView("planner")}
                                        className={cn(
                                            "p-2 rounded-md transition-all",
                                            currentView === "planner"
                                                ? "bg-white text-neutral-900 shadow-sm"
                                                : "text-neutral-500"
                                        )}
                                    >
                                        <CalendarDays className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* New Data Button */}
                            <button
                                onClick={resetData}
                                className="hidden sm:flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-150"
                            >
                                <Upload className="w-4 h-4" />
                                <span>New Data</span>
                            </button>

                            {/* Mobile New Data */}
                            <button
                                onClick={resetData}
                                className="sm:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-all"
                            >
                                <Upload className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Content */}
            <div className={cn(
                "transition-all duration-300",
                !historicalData ? "" : "py-0"
            )}>
                {!historicalData ? (
                    <div className="animate-fade-in">
                        <DataUploader onDataLoaded={handleDataLoaded} />
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {currentView === "history" && (
                            <Dashboard data={historicalData} />
                        )}
                        {currentView === "planner" && scheduleData && (
                            <SchedulePlanner
                                availableCourses={scheduleData}
                                historicalStats={historicalData}
                            />
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
