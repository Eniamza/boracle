"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const departments = [
    { code: "CSE", name: "Computer Science & Engineering" },
    { code: "CS", name: "Computer Science" },
    { code: "ARCH", name: "Architecture" },
    { code: "BBA", name: "Business Administration" },
    { code: "LAW", name: "Law" },
];

export default function CourseProgressionPage() {
    const [selectedDept, setSelectedDept] = useState("CSE");
    const [showComingSoon, setShowComingSoon] = useState(false);

    const handleDeptClick = (code) => {
        if (code === "CSE") {
            setSelectedDept("CSE");
            setShowComingSoon(false);
        } else {
            setSelectedDept(code);
            setShowComingSoon(true);
        }
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-gray-950">
            <div className="max-w-3xl mx-auto space-y-10">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <Badge
                        variant="outline"
                        className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                    >
                        CSE Degree Plan
                    </Badge>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                        Track Your{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Course Progression
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Select the courses you have completed and plan your path to graduation!
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pb-2">
                    {departments.map((dept) => (
                        <Button
                            key={dept.code}
                            variant={selectedDept === dept.code ? "default" : "outline"}
                            className={
                                selectedDept === dept.code
                                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 dark:bg-blue-500 dark:border-blue-500 dark:hover:bg-blue-600 dark:hover:border-blue-600"
                                    : "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                            }
                            onClick={() => handleDeptClick(dept.code)}
                        >
                            {dept.code}
                        </Button>
                    ))}
                </div>
                <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl shadow p-8">
                    {showComingSoon ? (
                        <div className="flex flex-col items-center justify-center min-h-[200px]">
                            <span className="text-blue-400 dark:text-blue-300 text-xl font-semibold">
                                {departments.find((d) => d.code === selectedDept)?.name} outline coming soon...
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-blue-200 dark:border-blue-700 rounded-lg">
                            <span className="text-blue-400 dark:text-blue-300">Course progression tracker coming soon...</span>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
