"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cseCurriculum, getTotalCredits, prerequisiteOverrides } from "@/constants/cseCurriculum";
import { CheckCircle2, Lock, Unlock, RefreshCw } from "lucide-react";

const departments = [
    { code: "CSE", name: "Computer Science & Engineering" },
    { code: "CS", name: "Computer Science" },
    { code: "ARCH", name: "Architecture" },
    { code: "BBA", name: "Business Administration" },
    { code: "LAW", name: "Law" },
];

function getSectionAnchorId(sectionName) {
    return `section-${sectionName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function getCourseCardId(courseCode) {
    return `course-card-${courseCode.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

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
                        const overridePrereq = prerequisiteOverrides[c.courseCode];
                        const effectivePrereqRaw = overridePrereq ?? c.prerequisiteCourses;
                        const effectivePrereqTree = parsePrereqString(effectivePrereqRaw);

                        map[c.courseCode] = {
                            code: c.courseCode,
                            name: c.courseName,
                            credits: c.courseCredit,
                            prereqRaw: effectivePrereqRaw,
                            prereqTree: effectivePrereqTree,
                            allPrereqs: getAllPrerequisiteCodes(effectivePrereqTree),
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
function CourseCard({ course, isCompleted, isAvailable, isSelected, isHighlighted, onClick, onPrereqClick, courseDetails }) {
    const [showTooltip, setShowTooltip] = useState(false);

    let statusColor = "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
    let statusIcon = null;
    let statusText = "";

    if (isCompleted) {
        statusColor = "border-green-500 bg-green-50 dark:bg-green-900/20 hover:border-green-600";
        statusIcon = <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />;
        statusText = "Completed (Click to undo)";
    } else if (isAvailable) {
        statusColor = "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:border-yellow-600";
        statusIcon = <Unlock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
        statusText = "Available (Click to complete)";
    } else {
        statusColor = "border-gray-300 dark:border-gray-800 bg-gray-200 dark:bg-gray-900/50 text-black dark:text-white";
        statusIcon = <Lock className="w-4 h-4 text-black dark:text-white" />;
        statusText = "Locked - Prerequisites needed";
    }

    const highlightClass = isHighlighted
        ? "ring-2 ring-cyan-500 dark:ring-cyan-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 shadow-lg shadow-cyan-500/30"
        : "";

    return (
        <div
            id={getCourseCardId(course.code)}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${statusColor} ${highlightClass}`}
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
                    <div className="text-xs text-gray-500 mt-2">{course.credits ?? courseDetails?.credits ?? 3} credits</div>

                    {courseDetails?.allPrereqs?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {courseDetails.allPrereqs.map((prereq) => (
                                <button
                                    key={`${course.code}-prereq-${prereq}`}
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onPrereqClick?.(prereq);
                                    }}
                                    className="px-2 py-0.5 text-[10px] rounded-full border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                    title={`Jump to prerequisite ${prereq}`}
                                >
                                    {prereq}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="ml-2">{statusIcon}</div>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                    {statusText}
                    {isSelected && <div className="text-xs text-gray-300 mt-1">Selected</div>}
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
function SectionCourses({ section, completedCourses, highlightedCourseCode, onCourseToggle, onCourseUntoggle, onPrereqClick }) {
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

            if (isCompleted) return "completed";

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
        [completedCourses, courseMap],
    );

    // Handle course click
    const handleCourseClick = (courseCode) => {
        const status = getCourseStatus(courseCode);

        // Toggle completed state directly for any course.
        if (status === "completed") {
            onCourseUntoggle(courseCode);
            if (selectedCourse === courseCode) {
                setSelectedCourse(null);
            }
        } else {
            onCourseToggle(courseCode);
            setSelectedCourse(courseCode);
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
                                            isHighlighted={highlightedCourseCode === course.code}
                                            onClick={handleCourseClick}
                                            onPrereqClick={onPrereqClick}
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
                                isHighlighted={highlightedCourseCode === course.code}
                                onClick={handleCourseClick}
                                onPrereqClick={onPrereqClick}
                                courseDetails={courseMap[course.code]}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

//! MARK: Main Page
export default function CourseProgressionPage() {
    const [selectedDept, setSelectedDept] = useState(null);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [completedCourses, setCompletedCourses] = useState([]);
    const [highlightedCourseCode, setHighlightedCourseCode] = useState(null);
    const [showAvailableNow, setShowAvailableNow] = useState(true);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Use CDN prerequisite graph to auto-mark prerequisite chains when selecting a course.
    const { courseMap } = useConnectCDN();

    const handleDeptClick = (code) => {
        if (code === "CSE") {
            setSelectedDept("CSE");
            setShowComingSoon(false);
        } else {
            setSelectedDept(code);
            setShowComingSoon(true);
        }
    };

    // Mark as completed
    const handleCourseToggle = (courseCode) => {
        setCompletedCourses((prev) => {
            const next = new Set(prev);
            const stack = [courseCode];

            while (stack.length > 0) {
                const code = stack.pop();
                if (!code || next.has(code)) continue;

                next.add(code);

                const prereqCodes = getAllPrerequisiteCodes(courseMap[code]?.prereqTree);
                for (const prereqCode of prereqCodes) {
                    if (!next.has(prereqCode)) {
                        stack.push(prereqCode);
                    }
                }
            }

            return Array.from(next);
        });
    };

    // Mark as incomplete and remove its prerequisite chain.
    const handleCourseUntoggle = (courseCode) => {
        setCompletedCourses((prev) => {
            const toRemove = new Set();
            const stack = [courseCode];

            while (stack.length > 0) {
                const code = stack.pop();
                if (!code || toRemove.has(code)) continue;

                toRemove.add(code);

                const prereqCodes = getAllPrerequisiteCodes(courseMap[code]?.prereqTree);
                for (const prereqCode of prereqCodes) {
                    if (!toRemove.has(prereqCode)) {
                        stack.push(prereqCode);
                    }
                }
            }

            return prev.filter((c) => !toRemove.has(c));
        });
    };

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
        referenceLink: s.referenceLink,
    }));

    const allSectionCourses = useMemo(
        () =>
            cseCurriculum.flatMap((section) => {
                const courses = section.courses
                    ? section.courses
                    : section.streams
                      ? section.streams.flatMap((stream) => stream.courses)
                      : [];

                return courses.map((course) => ({
                    code: course.code,
                    name: course.name,
                    sectionName: section.section,
                }));
            }),
        [],
    );

    const availableCourses = useMemo(() => {
        const completedSet = new Set(completedCourses);

        return allSectionCourses.filter((course) => {
            if (completedSet.has(course.code)) return false;

            const prereqTree = courseMap[course.code]?.prereqTree;
            if (!prereqTree) return true;

            return arePrerequisitesSatisfied(prereqTree, completedCourses);
        });
    }, [allSectionCourses, courseMap, completedCourses]);

    const handleJumpToCourse = useCallback((sectionName, courseCode) => {
        setHighlightedCourseCode(courseCode);
        const cardEl = document.getElementById(getCourseCardId(courseCode));
        if (cardEl) {
            cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        const sectionEl = document.getElementById(getSectionAnchorId(sectionName));
        if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, []);

    const handlePrereqJump = useCallback((courseCode) => {
        setHighlightedCourseCode(courseCode);
        const cardEl = document.getElementById(getCourseCardId(courseCode));
        if (cardEl) {
            cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, []);

    useEffect(() => {
        if (!highlightedCourseCode) return;

        const timer = setTimeout(() => {
            setHighlightedCourseCode(null);
        }, 2600);

        return () => clearTimeout(timer);
    }, [highlightedCourseCode]);

    // Calculate total completed credits
    const totalCompletedCredits = completedCourses.reduce((total, code) => {
        // Find course in curriculum
        for (const section of cseCurriculum) {
            let courses = [];
            if (section.courses) courses = section.courses;
            else if (section.streams) courses = section.streams.flatMap((s) => s.courses);

            const course = courses.find((c) => c.code === code);
            if (course) return total + Number(course.credits ?? 3);
        }
        return total + 3; // Default 3 credits if not found
    }, 0);

    return (
        <div className="min-h-screen py-12 pb-44 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
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

                {/* Main Content */}
                <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl shadow p-8">
                    {!selectedDept ? (
                        <div className="flex flex-col items-center justify-center min-h-[200px]">
                            <span className="text-blue-500 dark:text-blue-300 text-lg font-semibold text-center">
                                Select a department to view its course progression.
                            </span>
                        </div>
                    ) : showComingSoon ? (
                        <div className="flex flex-col items-center justify-center min-h-[200px]">
                            <span className="text-blue-400 dark:text-blue-300 text-xl font-semibold">
                                {departments.find((d) => d.code === selectedDept)?.name} outline coming soon...
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {cseSections.map((section) => (
                                <div key={section.name} id={getSectionAnchorId(section.name)} className="space-y-4 scroll-mt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-blue-200 dark:border-blue-800 pb-3">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{section.name}</h2>
                                        <Badge variant="secondary" className="w-fit text-sm">
                                            {section.credits} credits
                                        </Badge>
                                    </div>
                                    {section.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{section.description}</p>
                                    )}
                                    {section.referenceLink && (
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            <a
                                                href={section.referenceLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline font-medium hover:text-blue-800 dark:hover:text-blue-200"
                                            >
                                                Reference Link
                                            </a>
                                        </p>
                                    )}
                                    <SectionCourses
                                        section={section.name}
                                        completedCourses={completedCourses}
                                        highlightedCourseCode={highlightedCourseCode}
                                        onCourseToggle={handleCourseToggle}
                                        onCourseUntoggle={handleCourseUntoggle}
                                        onPrereqClick={handlePrereqJump}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Mini Sticky Progress (CSE) */}
            {selectedDept === "CSE" && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-5xl z-50">
                    <div className="bg-white/55 dark:bg-gray-900/45 backdrop-blur-xl border border-white/50 dark:border-gray-700/70 rounded-xl shadow-2xl px-4 py-3">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-full max-w-4xl">
                                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-200">
                                    <p>
                                        Completed Courses:{" "}
                                        <span className="font-bold text-green-600 dark:text-green-400">
                                            {completedCourses.length}
                                        </span>
                                    </p>
                                    <p>
                                        Completed Credits:{" "}
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            {totalCompletedCredits} / {getTotalCredits()}
                                        </span>
                                    </p>
                                </div>
                                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(totalCompletedCredits / getTotalCredits()) * 100}%` }}
                                    />
                                </div>
                                <div className="mt-3 flex flex-wrap justify-center items-center gap-3 text-xs text-gray-700 dark:text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded border border-green-600"></div>
                                        <span>Completed (Click to undo)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-yellow-500 rounded border border-yellow-600"></div>
                                        <span>Available</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-gray-300 rounded border border-gray-400 opacity-70"></div>
                                        <span>Locked</span>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-col items-center">
                                    <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                            Available now ({availableCourses.length})
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShowAvailableNow((prev) => !prev)}
                                            className="text-xs px-2 py-1 rounded border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors"
                                        >
                                            {showAvailableNow ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    {showAvailableNow && (
                                        <div className="flex flex-wrap justify-center gap-2 max-h-24 overflow-y-auto pr-1">
                                            {availableCourses.length > 0 ? (
                                                availableCourses.map((course) => (
                                                    <button
                                                        key={`${course.sectionName}-${course.code}`}
                                                        type="button"
                                                        onClick={() => handleJumpToCourse(course.sectionName, course.code)}
                                                        className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                        title={`Jump to ${course.sectionName}`}
                                                    >
                                                        {course.code}
                                                    </button>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    No available courses right now.
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {completedCourses.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
