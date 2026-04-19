"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cseCurriculum, getTotalCredits } from "@/constants/cseCurriculum";
import { CheckCircle2, Circle, Lock, Unlock, BookOpen, RefreshCw } from "lucide-react";

const departments = [
    { code: "CSE", name: "Computer Science & Engineering" },
    { code: "CS", name: "Computer Science" },
    { code: "ARCH", name: "Architecture" },
    { code: "BBA", name: "Business Administration" },
    { code: "LAW", name: "Law" },
];

//! MARK: Prereq Parsing
function parsePrereqString(prereqStr) {
    if (!prereqStr || typeof prereqStr !== "string" || !prereqStr.trim()) return null;

    let cleaned = prereqStr.trim();

    if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
        const inner = cleaned.slice(1, -1);
        if (inner.match(/^[A-Z]{3,}[0-9]{3,}$/)) {
            return inner;
        }
        cleaned = inner;
    }

    const tokens = [];
    const regex = /\(|\)|AND|OR|[A-Z]{3,}[0-9]{3,}/gi;
    let match;

    while ((match = regex.exec(cleaned)) !== null) {
        tokens.push(match[0].toUpperCase());
    }

    if (tokens.length === 0) return null;

    let pos = 0;

    function parseExpression() {
        let args = [];
        let currentOp = null;

        while (pos < tokens.length) {
            const token = tokens[pos];

            if (token === "(") {
                pos++;
                args.push(parseExpression());
            } else if (token === ")") {
                pos++;
                break;
            } else if (token === "AND" || token === "OR") {
                currentOp = token;
                pos++;
            } else {
                args.push(token);
                pos++;
            }
        }

        if (args.length === 0) return null;
        if (args.length === 1) return args[0];
        if (!currentOp && args.length > 1) return { op: "AND", args };
        return { op: currentOp, args };
    }

    return parseExpression();
}

//! MARK: Prereq Tree
function getAllPrerequisiteCodes(prereqTree) {
    if (!prereqTree) return [];
    if (typeof prereqTree === "string") return [prereqTree];
    if (Array.isArray(prereqTree)) return prereqTree.flatMap(getAllPrerequisiteCodes);
    if (prereqTree.args) return prereqTree.args.flatMap(getAllPrerequisiteCodes);
    return [];
}

//! MARK: Prereq Satisfaction
function arePrerequisitesSatisfied(prereqTree, completedCourses) {
    if (!prereqTree) return true;

    function evaluate(expr) {
        if (typeof expr === "string") {
            return completedCourses.includes(expr);
        }
        if (expr.op === "AND") {
            return expr.args.every(evaluate);
        }
        if (expr.op === "OR") {
            return expr.args.some(evaluate);
        }
        return false;
    }

    return evaluate(prereqTree);
}

//! MARK: Course Data Fetch
//! CDN
function useConnectCDN() {
    const [courseMap, setCourseMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("https://usis-cdn.eniamza.com/connect.json");
                if (!res.ok) throw new Error("Failed to fetch connect.json");
                const data = await res.json();

                const map = {};
                for (const c of data) {
                    if (!map[c.courseCode]) {
                        map[c.courseCode] = {
                            code: c.courseCode,
                            name: c.courseName,
                            credits: c.courseCredit,
                            prereqRaw: c.prerequisiteCourses,
                            prereqTree: parsePrereqString(c.prerequisiteCourses),
                            allPrereqs: getAllPrerequisiteCodes(parsePrereqString(c.prerequisiteCourses)),
                        };
                    }
                }
                setCourseMap(map);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return { courseMap, loading, error };
}

//! MARK: Course Card
function CourseCard({ course, isCompleted, isAvailable, isSelected, onClick, courseDetails }) {
    const [showTooltip, setShowTooltip] = useState(false);

    let statusColor = "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
    let statusIcon = null;
    let statusText = "";

    if (isCompleted) {
        statusColor = "border-green-500 bg-green-50 dark:bg-green-900/20 hover:border-green-600";
        statusIcon = <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />;
        statusText = "Completed (Click to undo)";
    } else if (isSelected) {
        statusColor = "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500";
        statusIcon = <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
        statusText = "Selected";
    } else if (isAvailable) {
        statusColor = "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:border-yellow-600";
        statusIcon = <Unlock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
        statusText = "Available (Click to complete)";
    } else {
        statusColor = "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-60";
        statusIcon = <Lock className="w-4 h-4 text-gray-400" />;
        statusText = "Locked - Prerequisites needed";
    }

    return (
        <div
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${statusColor}`}
            onClick={() => onClick(course.code)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="font-mono font-bold text-sm mb-1">{course.code}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {course.name || courseDetails?.name || "Course"}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{course.credits || courseDetails?.credits || 3} credits</div>
                </div>
                <div className="ml-2">{statusIcon}</div>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                    {statusText}
                    {courseDetails?.allPrereqs?.length > 0 && !isCompleted && !isAvailable && (
                        <div className="text-xs text-gray-300 mt-1">Requires: {courseDetails.allPrereqs.join(", ")}</div>
                    )}
                    {isCompleted && courseDetails?.allPrereqs?.length > 0 && (
                        <div className="text-xs text-gray-300 mt-1">Note: Uncompleting will lock dependent courses</div>
                    )}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
}

//! MARK: SectionCourses
function SectionCourses({ section, completedCourses, onCourseToggle, onCourseUntoggle }) {
    const { courseMap, loading, error } = useConnectCDN();
    const [selectedCourse, setSelectedCourse] = useState(null);

    const sectionObj = cseCurriculum.find((s) => s.section === section);

    if (!sectionObj) return <div>Section not found.</div>;

    // Get all courses in this section
    let allCourses = [];
    if (sectionObj.courses) {
        allCourses = sectionObj.courses;
    } else if (sectionObj.streams) {
        allCourses = sectionObj.streams.flatMap((stream) => stream.courses);
    }

    // Calculate course statuses based on prerequisites
    const getCourseStatus = useCallback(
        (courseCode) => {
            const isCompleted = completedCourses.includes(courseCode);
            const isSelectedCourse = selectedCourse === courseCode;

            if (isCompleted) return "completed";
            if (isSelectedCourse) return "selected";

            // Check if prerequisites are satisfied
            const courseDetails = courseMap[courseCode];
            if (courseDetails && courseDetails.prereqTree) {
                const prerequisitesMet = arePrerequisitesSatisfied(courseDetails.prereqTree, completedCourses);
                if (prerequisitesMet) return "available";
            } else if (!courseDetails || !courseDetails.prereqTree) {
                // No prerequisites means it's always available
                return "available";
            }

            return "locked";
        },
        [completedCourses, selectedCourse, courseMap],
    );

    // Handle course click
    const handleCourseClick = (courseCode) => {
        const status = getCourseStatus(courseCode);

        // Allow clicking on completed courses to undo them
        if (status === "completed") {
            if (
                window.confirm(
                    `Are you sure you want to mark ${courseCode} as incomplete?\nThis will also lock any courses that depend on it.`,
                )
            ) {
                onCourseUntoggle(courseCode);
                if (selectedCourse === courseCode) {
                    setSelectedCourse(null);
                }
            }
        }
        // Allow clicking on available courses to complete them
        else if (status === "available") {
            onCourseToggle(courseCode);
            setSelectedCourse(courseCode);
        }
        // Allow clicking on selected to deselect
        else if (status === "selected") {
            setSelectedCourse(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading course data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Error loading course data: {error}</div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Section Description */}
            {sectionObj.description && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">{sectionObj.description}</p>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mt-2">
                        Total Credits: {sectionObj.credits}
                    </p>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div>
                    <span>Completed (Click to undo)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600 ring-2 ring-blue-500"></div>
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded border border-yellow-600"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded border border-gray-400 opacity-60"></div>
                    <span>Locked</span>
                </div>
            </div>

            {/* Streams/Categories */}
            {sectionObj.streams ? (
                <div className="space-y-4">
                    {sectionObj.streams.map((stream) => (
                        <div key={stream.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{stream.name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                    {stream.credits} credits
                                </Badge>
                            </div>
                            {stream.note && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">{stream.note}</p>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {stream.courses.map((course) => {
                                    const status = getCourseStatus(course.code);
                                    return (
                                        <CourseCard
                                            key={course.code}
                                            course={course}
                                            isCompleted={status === "completed"}
                                            isAvailable={status === "available"}
                                            isSelected={status === "selected"}
                                            onClick={handleCourseClick}
                                            courseDetails={courseMap[course.code]}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {allCourses.map((course) => {
                        const status = getCourseStatus(course.code);
                        return (
                            <CourseCard
                                key={course.code}
                                course={course}
                                isCompleted={status === "completed"}
                                isAvailable={status === "available"}
                                isSelected={status === "selected"}
                                onClick={handleCourseClick}
                                courseDetails={courseMap[course.code]}
                            />
                        );
                    })}
                </div>
            )}

            {/* Selected Course Info */}
            {selectedCourse && courseMap[selectedCourse] && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Selected Course: {selectedCourse}</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">{courseMap[selectedCourse].name}</p>
                    {courseMap[selectedCourse].allPrereqs?.length > 0 && (
                        <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                            <span className="font-semibold">Prerequisites:</span>{" "}
                            {courseMap[selectedCourse].allPrereqs.join(", ")}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

//! MARK: Main Page
export default function CourseProgressionPage() {
    const [selectedDept, setSelectedDept] = useState("CSE");
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [selectedSection, setSelectedSection] = useState("Foundation & Core Skills");
    const [completedCourses, setCompletedCourses] = useState([]);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const handleDeptClick = (code) => {
        if (code === "CSE") {
            setSelectedDept("CSE");
            setShowComingSoon(false);
        } else {
            setSelectedDept(code);
            setShowComingSoon(true);
        }
    };

    // Get courseMap from CDN for dependency checks
    const { courseMap } = useConnectCDN();

    // Mark as completed
    const handleCourseToggle = (courseCode) => {
        if (!completedCourses.includes(courseCode)) {
            setCompletedCourses([...completedCourses, courseCode]);
        }
    };

    // Mark as incomplete and recursively lock dependents
    const handleCourseUntoggle = useCallback(
        (courseCode) => {
            setCompletedCourses((prev) => {
                // Find all dependents that should be removed
                const toRemove = new Set([courseCode]);

                // Build a map of prerequisites for quick lookup
                const prerequisiteMap = new Map();
                for (const [code, details] of Object.entries(courseMap)) {
                    if (details.prereqTree) {
                        prerequisiteMap.set(code, getAllPrerequisiteCodes(details.prereqTree));
                    }
                }

                // Recursively find all courses that depend on courseCode
                let changed = true;
                while (changed) {
                    changed = false;
                    for (const [code, prereqs] of prerequisiteMap) {
                        if (!toRemove.has(code) && prev.includes(code)) {
                            // Check if any prerequisite is being removed
                            const hasRemovedPrereq = prereqs.some((prereq) => toRemove.has(prereq));
                            if (hasRemovedPrereq) {
                                // Check if prerequisites are still satisfied without the removed ones
                                const newCompletedSet = new Set(prev.filter((c) => !toRemove.has(c)));
                                const stillSatisfied = arePrerequisitesSatisfied(
                                    courseMap[code]?.prereqTree,
                                    Array.from(newCompletedSet),
                                );
                                if (!stillSatisfied) {
                                    toRemove.add(code);
                                    changed = true;
                                }
                            }
                        }
                    }
                }

                return prev.filter((c) => !toRemove.has(c));
            });
        },
        [courseMap],
    );

    // Reset all progress
    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
            setCompletedCourses([]);
            setShowResetConfirm(false);
        }
    };

    const cseSections = cseCurriculum.map((s) => ({
        name: s.section,
        credits: s.credits,
        description: s.description,
    }));

    // Calculate total completed credits
    const totalCompletedCredits = completedCourses.reduce((total, code) => {
        // Find course in curriculum
        for (const section of cseCurriculum) {
            let courses = [];
            if (section.courses) courses = section.courses;
            else if (section.streams) courses = section.streams.flatMap((s) => s.courses);

            const course = courses.find((c) => c.code === code);
            if (course) return total + (course.credits || 3);
        }
        return total + 3; // Default 3 credits if not found
    }, 0);

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-gray-950">
            <div className="max-w-7xl mx-auto space-y-10">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                        Track Your{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Course Progression
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Click on available courses (yellow) to mark them as completed. Click on completed courses (green) to undo
                        and automatically lock dependencies.
                    </p>
                </div>

                {/* Department Selection */}
                <div className="flex flex-wrap justify-center gap-3">
                    {departments.map((dept) => (
                        <Button
                            key={dept.code}
                            variant={selectedDept === dept.code ? "default" : "outline"}
                            className={
                                selectedDept === dept.code
                                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                    : "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                            }
                            onClick={() => handleDeptClick(dept.code)}
                        >
                            {dept.code}
                        </Button>
                    ))}
                </div>

                {/* Section Navigation for CSE */}
                {selectedDept === "CSE" && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap justify-center gap-2">
                            {cseSections.map((section) => (
                                <Button
                                    key={section.name}
                                    variant={selectedSection === section.name ? "default" : "outline"}
                                    className={
                                        selectedSection === section.name
                                            ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                                            : "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                                    }
                                    onClick={() => setSelectedSection(section.name)}
                                >
                                    <div className="flex flex-col items-center">
                                        <span>{section.name}</span>
                                        <span className="text-xs opacity-80">{section.credits} credits</span>
                                    </div>
                                </Button>
                            ))}
                        </div>

                        {/* Progress Stats with Reset Button */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <div className="text-center flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Completed Courses:{" "}
                                        <span className="font-bold text-green-600 dark:text-green-400">
                                            {completedCourses.length}
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        Completed Credits:{" "}
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            {totalCompletedCredits} / {getTotalCredits()}
                                        </span>
                                    </p>
                                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(totalCompletedCredits / getTotalCredits()) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                {completedCourses.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleReset}
                                        className="ml-4 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl shadow p-8">
                    {showComingSoon ? (
                        <div className="flex flex-col items-center justify-center min-h-[200px]">
                            <span className="text-blue-400 dark:text-blue-300 text-xl font-semibold">
                                {departments.find((d) => d.code === selectedDept)?.name} outline coming soon...
                            </span>
                        </div>
                    ) : (
                        <SectionCourses
                            section={selectedSection}
                            completedCourses={completedCourses}
                            onCourseToggle={handleCourseToggle}
                            onCourseUntoggle={handleCourseUntoggle}
                        />
                    )}
                </section>
            </div>
        </div>
    );
}
