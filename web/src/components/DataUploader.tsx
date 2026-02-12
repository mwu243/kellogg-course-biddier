"use client";

import { useState } from "react";
import Papa from "papaparse";
import {
    Upload,
    BarChart3,
    Star,
    Calendar,
    CheckCircle,
    AlertCircle,
    Shield,
    ArrowRight,
    Loader2,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataUploaderProps {
    onDataLoaded: (bids: any[], reviews: any[], schedule: any[]) => void;
}

interface UploadCardProps {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    file: File | null;
    required?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function UploadCard({ id, icon, title, description, file, required, onChange }: UploadCardProps) {
    const isSelected = !!file;

    return (
        <div
            className={cn(
                "group relative rounded-xl border-2 border-dashed p-4 transition-all duration-200",
                isSelected
                    ? "border-solid border-emerald-500 bg-emerald-50/50"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50"
            )}
        >
            <input
                type="file"
                accept=".csv"
                onChange={onChange}
                className="hidden"
                id={id}
            />
            <label htmlFor={id} className="flex items-center gap-4 cursor-pointer">
                {/* Icon */}
                <div
                    className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                        isSelected
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200"
                    )}
                >
                    {icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900">{title}</span>
                        {required ? (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-neutral-900 text-white rounded">
                                Required
                            </span>
                        ) : (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-neutral-200 text-neutral-600 rounded">
                                Optional
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-neutral-500 mt-0.5 truncate">
                        {file ? file.name : description}
                    </p>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                    {isSelected ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
                            <Upload className="w-4 h-4 text-neutral-400" />
                        </div>
                    )}
                </div>
            </label>
        </div>
    );
}

export function DataUploader({ onDataLoaded }: DataUploaderProps) {
    const [bidsFile, setBidsFile] = useState<File | null>(null);
    const [reviewsFile, setReviewsFile] = useState<File | null>(null);
    const [scheduleFile, setScheduleFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "bids" | "reviews" | "schedule") => {
        if (e.target.files && e.target.files[0]) {
            if (type === "bids") setBidsFile(e.target.files[0]);
            else if (type === "reviews") setReviewsFile(e.target.files[0]);
            else setScheduleFile(e.target.files[0]);
            setError(null);
        }
    };

    const processFiles = () => {
        if (!bidsFile || !reviewsFile || !scheduleFile) {
            setError("Please upload all three required files to continue.");
            return;
        }

        setLoading(true);
        let bidsData: any[] = [];
        let reviewsData: any[] = [];
        let scheduleData: any[] = [];
        let filesProcessed = 0;
        const totalFiles = 3;

        const checkComplete = () => {
            filesProcessed++;
            if (filesProcessed === totalFiles) {
                onDataLoaded(bidsData, reviewsData, scheduleData);
                setLoading(false);
            }
        };

        Papa.parse(bidsFile, {
            header: true,
            complete: (results) => {
                bidsData = results.data;
                checkComplete();
            },
            error: (err) => {
                setError("Error parsing Bids CSV: " + err.message);
                setLoading(false);
            }
        });

        Papa.parse(reviewsFile, {
            header: true,
            complete: (results) => {
                reviewsData = results.data;
                checkComplete();
            },
            error: (err) => {
                setError("Error parsing Reviews CSV: " + err.message);
                setLoading(false);
            }
        });

        Papa.parse(scheduleFile, {
            header: true,
            complete: (results) => {
                scheduleData = results.data;
                checkComplete();
            },
            error: (err) => {
                setError("Error parsing Schedule CSV: " + err.message);
                setLoading(false);
            }
        });
    };

    const isReady = bidsFile && reviewsFile && scheduleFile;

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Hero Section */}
                <div className="text-center mb-10">
                    {/* Gradient Icon */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-500/25 mb-6">
                        <Upload className="w-8 h-8 text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
                        Upload Your Data
                    </h1>
                    <p className="text-neutral-500 mt-3 max-w-md mx-auto leading-relaxed">
                        Import your Kellogg bidding history and professor reviews to unlock personalized course insights.
                    </p>
                </div>

                {/* Upload Cards */}
                <div className="space-y-3 mb-8">
                    <UploadCard
                        id="bids-upload"
                        icon={<BarChart3 className="w-5 h-5" />}
                        title="Bidding History"
                        description="BidStatsResults.csv"
                        file={bidsFile}
                        required
                        onChange={(e) => handleFileChange(e, "bids")}
                    />

                    <UploadCard
                        id="reviews-upload"
                        icon={<Star className="w-5 h-5" />}
                        title="Professor Reviews"
                        description="Reviews.csv"
                        file={reviewsFile}
                        required
                        onChange={(e) => handleFileChange(e, "reviews")}
                    />

                    <UploadCard
                        id="schedule-upload"
                        icon={<Calendar className="w-5 h-5" />}
                        title="Next Semester Schedule"
                        description="CourseSchedule.csv from Kellogg"
                        file={scheduleFile}
                        required
                        onChange={(e) => handleFileChange(e, "schedule")}
                    />
                </div>

                {/* Error Display */}
                {error && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 mb-6">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-red-900 text-sm">Upload Error</p>
                            <p className="text-red-700 text-sm mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={processFiles}
                    disabled={loading || !isReady}
                    className={cn(
                        "w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2",
                        loading || !isReady
                            ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                            : "bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg shadow-neutral-900/10 hover:shadow-xl hover:shadow-neutral-900/15 active:scale-[0.98]"
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Visualize Insights
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                {/* Privacy Badge */}
                <div className="flex items-center justify-center gap-2 mt-6 text-neutral-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Your data stays in your browser. Nothing is uploaded to any server.</span>
                </div>
            </div>
        </div>
    );
}
