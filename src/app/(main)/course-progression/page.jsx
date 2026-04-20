"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    cseCurriculum,
    getTotalCredits as getCseTotalCredits,
    prerequisiteOverrides as csePrerequisiteOverrides,
} from "@/constants/cseCurriculum";
import {
    csCurriculum,
    getTotalCredits as getCsTotalCredits,
    prerequisiteOverrides as csPrerequisiteOverrides,
} from "@/constants/csCurriculum";
import { CheckCircle2, ChevronDown, ChevronUp, Lock, Unlock, RefreshCw } from "lucide-react";

const departments = [
    { code: "CSE", name: "Computer Science & Engineering" },
    { code: "CS", name: "Computer Science" },
    { code: "ARCH", name: "Architecture" },
    { code: "BBA", name: "Business Administration" },
    { code: "LAW", name: "Law" },
];

const departmentCurricula = {
    CSE: cseCurriculum,
    CS: csCurriculum,
};

const departmentPrerequisiteOverrides = {
    CSE: csePrerequisiteOverrides,
    CS: csPrerequisiteOverrides,
};

const supportedDepartments = new Set(["CSE", "CS"]);

function getCurriculumForDepartment(code) {
    return departmentCurricula[code] ?? [];
}

function getPrerequisiteOverridesForDepartment(code) {
    return departmentPrerequisiteOverrides[code] ?? csePrerequisiteOverrides;
}

function getCompletedCoursesForCurriculum(curriculum, completedCourses) {
    return completedCourses.reduce((total, courseCode) => {
        for (const section of curriculum) {
            let courses = [];
            if (section.courses) courses = section.courses;
            else if (section.streams) courses = section.streams.flatMap((stream) => stream.courses);

            const course = courses.find((c) => c.code === courseCode);
            if (course) return total + Number(course.credits ?? 3);
        }

        return total;
    }, 0);
}

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
function useConnectCDN(prereqOverrides = csePrerequisiteOverrides) {
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
                        const overridePrereq = prereqOverrides[c.courseCode];
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
    }, [prereqOverrides]);

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
                    <div className="font-mono font-bold text-base mb-1">{course.code}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {course.name || courseDetails?.name || "Course"}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">{course.credits ?? courseDetails?.credits ?? 3} credits</div>

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
                                    className="px-2.5 py-0.5 text-[11px] rounded-full border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
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
function SectionCourses({
    section,
    curriculum,
    courseMap,
    loading,
    error,
    completedCourses,
    highlightedCourseCode,
    onCourseToggle,
    onCourseUntoggle,
    onPrereqClick,
}) {
    const [selectedCourse, setSelectedCourse] = useState(null);

    const sectionObj = curriculum.find((s) => s.section === section);

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

export default function CourseProgressionPage() {
    const [selectedDept, setSelectedDept] = useState(null);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [completedCoursesByDept, setCompletedCoursesByDept] = useState({});
    const [highlightedCourseCode, setHighlightedCourseCode] = useState(null);
    const [showProgressPanel, setShowProgressPanel] = useState(false);

    const activeCurriculum = getCurriculumForDepartment(selectedDept);
    const activePrerequisiteOverrides = getPrerequisiteOverridesForDepartment(selectedDept);
    const completedCourses = selectedDept ? (completedCoursesByDept[selectedDept] ?? []) : [];

    // Use the selected department's prerequisite graph to auto-mark prerequisite chains when selecting a course.
    const { courseMap, loading, error } = useConnectCDN(activePrerequisiteOverrides);

    const handleDeptClick = (code) => {
        if (supportedDepartments.has(code)) {
            setSelectedDept(code);
            setShowComingSoon(false);
        } else {
            setSelectedDept(code);
            setShowComingSoon(true);
        }
    };

    // Mark as completed
    const handleCourseToggle = (courseCode) => {
        if (!selectedDept || !supportedDepartments.has(selectedDept)) return;

        setCompletedCoursesByDept((prev) => {
            const currentCompleted = prev[selectedDept] ?? [];
            const next = new Set(currentCompleted);
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

            return {
                ...prev,
                [selectedDept]: Array.from(next),
            };
        });
    };

    // Mark as incomplete and remove its prerequisite chain.
    const handleCourseUntoggle = (courseCode) => {
        if (!selectedDept || !supportedDepartments.has(selectedDept)) return;

        setCompletedCoursesByDept((prev) => {
            const currentCompleted = prev[selectedDept] ?? [];
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

            return {
                ...prev,
                [selectedDept]: currentCompleted.filter((c) => !toRemove.has(c)),
            };
        });
    };

    // Reset all progress
    const handleReset = () => {
        if (!selectedDept || !supportedDepartments.has(selectedDept)) return;

        if (window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
            setCompletedCoursesByDept((prev) => ({
                ...prev,
                [selectedDept]: [],
            }));
        }
    };

    const activeSections = activeCurriculum.map((s) => ({
        name: s.section,
        credits: s.credits,
        description: s.description,
        referenceLink: s.referenceLink,
    }));

    const allSectionCourses = useMemo(
        () =>
            activeCurriculum.flatMap((section) => {
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
        [activeCurriculum],
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
    const totalCompletedCredits = getCompletedCoursesForCurriculum(activeCurriculum, completedCourses);

    const totalCredits = selectedDept === "CS" ? getCsTotalCredits(activeCurriculum) : getCseTotalCredits(activeCurriculum);
    const progressPercent = totalCredits > 0 ? Math.min(100, Math.round((totalCompletedCredits / totalCredits) * 100)) : 0;
    const coursesLeft = Math.max(0, allSectionCourses.length - completedCourses.length);

    return (
        <div className="min-h-screen py-12 pb-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="max-w-7xl mx-auto space-y-10">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                        Track Your{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Course Progression
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Click any <span className="font-semibold text-yellow-600 dark:text-yellow-400">Available</span> course to
                        mark it complete. Click a{" "}
                        <span className="font-semibold text-green-600 dark:text-green-400">Completed</span> course to undo it;
                        dependent courses will become{" "}
                        <span className="font-semibold text-gray-500 dark:text-gray-300">Locked</span> again automatically.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Completed
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1">
                            <span className="h-2 w-2 rounded-full bg-yellow-500" />
                            Available
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 px-2.5 py-1">
                            <span className="h-2 w-2 rounded-full bg-gray-400" />
                            Locked
                        </span>
                    </div>
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
                            {activeSections.map((section) => (
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
                                        curriculum={activeCurriculum}
                                        courseMap={courseMap}
                                        loading={loading}
                                        error={error}
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

            {selectedDept && (
                <>
                    {!showProgressPanel ? (
                        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowProgressPanel(true)}
                                    className="group inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-4 py-2 text-xs font-semibold text-gray-700 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white dark:border-gray-700/70 dark:bg-gray-900/90 dark:text-gray-200"
                                >
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
                                        <ChevronUp className="h-3.5 w-3.5" />
                                    </span>
                                    {selectedDept} credits {totalCompletedCredits} / {totalCredits}
                                </button>

                                {completedCourses.length > 0 && supportedDepartments.has(selectedDept) && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-white/90 px-3 py-2 text-xs font-semibold text-red-600 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-red-50 dark:border-red-700 dark:bg-gray-900/90 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-2xl -translate-x-1/2">
                            <div className="rounded-2xl border border-white/60 bg-white/85 px-4 py-3 shadow-2xl backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/80">
                                <div className="flex items-start gap-3">
                                    <div className="relative min-w-0 flex-1 space-y-3">
                                        <div className="absolute right-0 top-0 flex items-center gap-2">
                                            {completedCourses.length > 0 && supportedDepartments.has(selectedDept) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleReset}
                                                    className="h-8 border-red-300 px-3 text-[13px] text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                                                >
                                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                                    Reset
                                                </Button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setShowProgressPanel(false)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                                                aria-label="Hide progress panel"
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex flex-col items-center justify-center gap-2 pt-1 text-center">
                                            <div
                                                className="relative flex h-16 w-16 items-center justify-center rounded-full"
                                                style={{
                                                    background: `conic-gradient(rgb(34 197 94) ${progressPercent}%, rgb(229 231 235) ${progressPercent}%)`,
                                                }}
                                            >
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[13px] font-bold text-gray-900 dark:bg-gray-900 dark:text-white">
                                                    {progressPercent}%
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] text-gray-700 dark:text-gray-200">
                                                <p>
                                                    Courses{" "}
                                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                                        {completedCourses.length}
                                                    </span>
                                                </p>
                                                <p>
                                                    Courses left{" "}
                                                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                                                        {coursesLeft}
                                                    </span>
                                                </p>
                                                <p>
                                                    Credits{" "}
                                                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                        {totalCompletedCredits} / {totalCredits}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-gray-200/70 bg-gray-50/90 px-3 py-2 text-center dark:border-gray-700/70 dark:bg-gray-800/60">
                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                <p className="inline-flex items-center gap-2 text-[13px] font-medium text-gray-700 dark:text-gray-200">
                                                    <span>Available now</span>
                                                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-white dark:text-gray-900">
                                                        {availableCourses.length}
                                                    </span>
                                                </p>
                                            </div>

                                            <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
                                                Click any course code to navigate.
                                            </p>

                                            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 pr-1">
                                                {supportedDepartments.has(selectedDept) && availableCourses.length > 0 ? (
                                                    availableCourses.map((course) => (
                                                        <button
                                                            key={`${course.sectionName}-${course.code}`}
                                                            type="button"
                                                            onClick={() => handleJumpToCourse(course.sectionName, course.code)}
                                                            className="cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1 text-[13px] font-medium text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900/80 dark:text-gray-100 dark:hover:bg-gray-800"
                                                            title={`Jump to ${course.sectionName}`}
                                                        >
                                                            {course.code}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <span className="text-[13px] text-gray-500 dark:text-gray-400">
                                                        No available courses right now.
                                                    </span>
                                                )}
                                            </div>

                                            {!supportedDepartments.has(selectedDept) && (
                                                <p className="mt-2 text-[13px] text-amber-600 dark:text-amber-400">
                                                    Progress tracking for this department is not configured yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
