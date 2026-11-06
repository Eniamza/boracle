'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Search, Sparkles, Wand2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import RoutineView from '@/components/routine/RoutineView';
import SemesterSwitcher from '@/components/automate-routine/SemesterSwitcher';
import TargetCourseCard from '@/components/automate-routine/TargetCourseCard';
import ConstraintPanel from '@/components/automate-routine/ConstraintPanel';
import RoutineResultCard from '@/components/automate-routine/RoutineResultCard';
import SignInPrompt from '@/components/shared/SignInPrompt';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { fetchBackupIndex, fetchCourses, normalizeSemester } from '@/lib/api/courseFetcher';
import { generateRoutines } from '@/lib/automate-routine/generate';
import { compareSections, facultyCodes } from '@/lib/automate-routine/model';
import { getRoutineTimings } from '@/constants/routineTimings';
import globalInfo from '@/constants/globalInfo';
import { useFaculty } from '@/app/contexts/FacultyContext';

const MAX_TARGETS = 6;
const RESULT_PAGE = 40;
const RESULT_LIMIT = 200;
const DEFAULT_CONSTRAINTS = {
  avoidDays: [],
  avoidSlots: [],
  avoidFaculty: [],
  minDays: 2,
  maxDays: 5,
  excludeKnownFull: false,
};
const DEFAULT_INPUTS = { items: [], constraints: DEFAULT_CONSTRAINTS };

const EXHAUSTED_TEXT = {
  avoidDay: (constraint) => `every section meets a day you chose to avoid${constraint ? ` (${constraint})` : ''}`,
  avoidSlot: (constraint) => `every section falls in a slot you chose to avoid${constraint ? ` (${constraint})` : ''}`,
  avoidFaculty: (constraint) => `every section is taught by a faculty you avoid${constraint ? ` (${constraint})` : ''}`,
  full: () => 'every remaining section is already full',
  noSections: () => 'this course has no sections in the catalog',
};

const sortAccessors = {
  days: (r) => [r.days, r.spanMinutes, r.contactMinutes],
  span: (r) => [r.spanMinutes, r.days, r.contactMinutes],
  contact: (r) => [r.contactMinutes, r.spanMinutes, r.days],
  seats: (r) => [-(r.seatsLeft ?? -1), r.days, r.spanMinutes],
};

const SORT_LABELS = [
  { key: 'days', label: 'Fewest days' },
  { key: 'span', label: 'Shortest day' },
  { key: 'contact', label: 'Least class time' },
  { key: 'seats', label: 'Most seats left' },
];

const AutomateRoutinePage = () => {
  const { data: session } = useSession();
  const { getFacultyDetails } = useFaculty();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [pastSemesters, setPastSemesters] = useState([]);
  const [inputs, setInputs] = useLocalStorage('boracle_automate_routine_inputs', DEFAULT_INPUTS);
  const [selectedCourses, setSelectedCourses] = useLocalStorage('boracle_selected_courses', []);
  const [results, setResults] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [displayCount, setDisplayCount] = useState(RESULT_PAGE);
  const [sortBy, setSortBy] = useState('days');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const searchRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingRegen, setPendingRegen] = useState(false);

  // Stable identities: these derive from a stored object, and re-spreading them each
  // render would invalidate every memo/callback that depends on them.
  const items = useMemo(() => inputs?.items ?? [], [inputs]);
  const constraints = useMemo(
    () => ({ ...DEFAULT_CONSTRAINTS, ...(inputs?.constraints ?? {}) }),
    [inputs]
  );

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // ---------------------------------------------------------------- catalog

  const sortRows = (rows) => (Array.isArray(rows) ? rows.slice().sort(compareSections) : []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const apply = (rows) => {
      if (!cancelled) setCourses(sortRows(rows));
    };

    fetchCourses(selectedSemester === 'current' ? undefined : selectedSemester, {
      onRevalidated: (fresh) => {
        if (cancelled) return;
        apply(fresh);
        toast.info('Catalog refreshed — searching again with the new sections');
        // Regenerate only once the refreshed rows have landed, otherwise the next
        // search would still read the pools built from the stale catalog.
        setPendingRegen(true);
      },
    })
      .then(apply)
      .catch((error) => {
        console.error('Automate Routine catalog error:', error);
        if (!cancelled) toast.error('Could not load the course catalog');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSemester]);

  useEffect(() => {
    let cancelled = false;
    const apply = (backups) => {
      if (!cancelled) setPastSemesters((backups || []).filter((b) => !b.isCurrent));
    };
    fetchBackupIndex({ onRevalidated: apply })
      .then(apply)
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------------------- derived

  // ---------------------------------------------------------------- catalog cache & derived

  const { rowsByCode, titleByCode, courseList } = useMemo(() => {
    const rowsMap = new Map();
    const titleMap = new Map();
    const list = [];
    courses.forEach((row) => {
      const code = row.courseCode;
      if (!code) return;
      if (!rowsMap.has(code)) {
        rowsMap.set(code, []);
        const title = row.courseName || '';
        titleMap.set(code, title);
        list.push({ code, title, count: 0 });
      }
      rowsMap.get(code).push(row);
    });
    list.forEach((entry) => {
      entry.count = rowsMap.get(entry.code)?.length || 0;
    });
    return { rowsByCode: rowsMap, titleByCode: titleMap, courseList: list };
  }, [courses]);

  const hasSeatData = useMemo(() => courses.some((row) => row.capacity != null), [courses]);

  const pools = useMemo(
    () =>
      items.map((item) => {
        const base = rowsByCode.get(item.courseCode) || [];
        const pinned = item.sections?.length
          ? base.filter((row) => item.sections.includes(row.sectionId))
          : base;
        const byFaculty = item.faculties?.length
          ? pinned.filter((row) => facultyCodes(row).some((f) => item.faculties.includes(f)))
          : pinned;
        return { courseCode: item.courseCode, sections: byFaculty };
      }),
    [items, rowsByCode]
  );

  const facultyOptions = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      const base = rowsByCode.get(item.courseCode) || [];
      base.forEach((row) => facultyCodes(row).forEach((f) => set.add(f)));
    });
    return [...set].sort();
  }, [items, rowsByCode]);

  const preferredFacultyMap = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      (item.faculties || []).forEach((f) => {
        map[f] = item.courseCode;
      });
    });
    return map;
  }, [items]);

  const preferredFacultySet = useMemo(() => {
    const set = new Set();
    items.forEach((item) => (item.faculties || []).forEach((f) => set.add(f)));
    return set;
  }, [items]);

  const slotLabels = useMemo(() => getRoutineTimings(), []);

  // Slot strings from a previous registration period (Ramadan swaps them) would be
  // invisible here and silently inert — keep only the ones the current grid offers.
  // Also ensure faculties chosen as preferred in any course are never in avoidFaculty.
  const activeConstraints = useMemo(
    () => ({
      ...constraints,
      avoidSlots: (constraints.avoidSlots || []).filter((s) => slotLabels.includes(s)),
      avoidFaculty: (constraints.avoidFaculty || []).filter((f) => !preferredFacultySet.has(f)),
    }),
    [constraints, slotLabels, preferredFacultySet]
  );

  const sortedResults = useMemo(() => {
    if (!results?.routines?.length) return [];
    const accessor = sortAccessors[sortBy] || sortAccessors.days;
    return results.routines
      .map((routine, index) => ({ routine, index }))
      .sort((a, b) => {
        const ka = accessor(a.routine);
        const kb = accessor(b.routine);
        for (let i = 0; i < ka.length; i += 1) {
          if (ka[i] !== kb[i]) return ka[i] - kb[i];
        }
        return a.index - b.index;
      })
      .map(({ routine, index }) => ({ routine, rank: index + 1 }));
  }, [results, sortBy]);

  // ---------------------------------------------------------------- actions

  const patchInputs = useCallback(
    (patch) => {
      setInputs((prev) => {
        const safe = { ...DEFAULT_INPUTS, ...(prev || {}) };
        return { ...safe, ...patch };
      });
      setDirty(true);
    },
    [setInputs]
  );

  const patchConstraints = useCallback(
    (patch) => {
      let nextItems = items;
      if (patch.avoidFaculty !== undefined) {
        // Mutual exclusivity: if a faculty is avoided, remove it from any course's preferred faculty
        const avoidSet = new Set(patch.avoidFaculty);
        const hasConflict = items.some((item) => (item.faculties || []).some((f) => avoidSet.has(f)));
        if (hasConflict) {
          nextItems = items.map((item) => ({
            ...item,
            faculties: (item.faculties || []).filter((f) => !avoidSet.has(f)),
          }));
        }
      }
      patchInputs({
        items: nextItems,
        constraints: { ...constraints, ...patch },
      });
    },
    [constraints, items, patchInputs]
  );

  const patchItem = useCallback(
    (courseCode, patch) => {
      let nextAvoidFaculty = constraints.avoidFaculty || [];
      if (patch.faculties?.length) {
        // Mutual exclusivity: if a faculty is preferred in a course, remove it from avoidFaculty
        const preferredSet = new Set(patch.faculties);
        const hadAvoided = nextAvoidFaculty.some((f) => preferredSet.has(f));
        if (hadAvoided) {
          nextAvoidFaculty = nextAvoidFaculty.filter((f) => !preferredSet.has(f));
        }
      }
      patchInputs({
        items: items.map((item) => (item.courseCode === courseCode ? { ...item, ...patch } : item)),
        constraints: { ...constraints, avoidFaculty: nextAvoidFaculty },
      });
    },
    [constraints, items, patchInputs]
  );

  const addCourse = useCallback(
    (code) => {
      const courseCode = String(code).toUpperCase().trim();
      if (!courseCode) return;
      if (items.some((item) => item.courseCode === courseCode)) {
        toast.info(`${courseCode} is already in the list`);
        return;
      }
      if (items.length >= MAX_TARGETS) {
        toast.error(`Up to ${MAX_TARGETS} courses at a time — remove one first`);
        return;
      }
      if (!rowsByCode.has(courseCode)) {
        toast.error(`${courseCode} isn't in this semester's catalog`);
        return;
      }
      patchInputs({ items: [...items, { courseCode, sections: [], faculties: [] }] });
      setSearchTerm('');
      setSearchOpen(false);
    },
    [items, rowsByCode, patchInputs]
  );

  const removeCourse = useCallback(
    (courseCode) => patchInputs({ items: items.filter((item) => item.courseCode !== courseCode) }),
    [items, patchInputs]
  );

  const seedFromPreprereg = useCallback(() => {
    const grouped = new Map();
    selectedCourses.forEach((row) => {
      if (!grouped.has(row.courseCode)) grouped.set(row.courseCode, []);
      grouped.get(row.courseCode).push(row.sectionId);
    });
    patchInputs({
      items: [...grouped.entries()].map(([courseCode, sections]) => ({ courseCode, sections, faculties: [] })),
    });
    toast.success(`Loaded ${grouped.size} course${grouped.size === 1 ? '' : 's'} from PrePreReg`);
  }, [selectedCourses, patchInputs]);

  const runGenerate = useCallback(() => {
    if (!pools.length) {
      toast.error('Add at least one course first');
      return;
    }
    setGenerating(true);
    // Let the spinner paint before the search blocks the thread (it is sub-100ms).
    setTimeout(() => {
      try {
        const out = generateRoutines(pools, activeConstraints, { limit: RESULT_LIMIT });
        setResults(out);
        setHasRun(true);
        setDisplayCount(RESULT_PAGE);
        setDirty(false);
        if (!out.routines.length && !out.exhausted.length) {
          toast.info('No combination fits those constraints');
        }
      } catch (error) {
        console.error('Routine generation failed:', error);
        toast.error('Generation failed — try pinning sections on the busy courses');
      } finally {
        setGenerating(false);
      }
    }, 0);
  }, [pools, activeConstraints]);

  useEffect(() => {
    if (!pendingRegen || loading) return;
    setPendingRegen(false);
    if (hasRun && pools.length) runGenerate();
  }, [pendingRegen, loading, hasRun, pools, runGenerate]);

  const enrich = useCallback(
    (rows) =>
      rows.map((row) => {
        const { facultyName, facultyEmail, imgUrl } = getFacultyDetails(row.faculties);
        return { ...row, employeeName: facultyName, employeeEmail: facultyEmail, imgUrl };
      }),
    [getFacultyDetails]
  );

  const adopt = useCallback(
    (routine) => {
      setSelectedCourses(routine.sections);
      toast.success('Loaded into PrePreReg');
    },
    [setSelectedCourses]
  );


  const semesterForSave = useMemo(
    () => (selectedSemester === 'current' ? globalInfo.semester : normalizeSemester(selectedSemester)),
    [selectedSemester]
  );

  const saveRoutine = useCallback(
    async (routine, key) => {
      if (!session?.user?.email) {
        setSignInOpen(true);
        return;
      }
      setSavingKey(key);
      try {
        const sectionIds = routine.sections.map((course) => course.sectionId).sort();
        const routineStr = btoa(JSON.stringify(sectionIds));

        const checkResponse = await fetch('/api/routine', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (checkResponse.ok) {
          const existing = (await checkResponse.json())?.routines || [];
          if (existing.some((r) => r.routineStr === routineStr)) {
            toast.error('This exact routine is already saved!');
            return;
          }
        }

        const response = await fetch('/api/routine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routineStr, email: session.user.email, semester: semesterForSave }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          toast.error(data.error || 'Failed to save routine');
          return;
        }
        toast.success('Routine saved');
      } catch (error) {
        console.error('Save routine error:', error);
        toast.error('Failed to save routine');
      } finally {
        setSavingKey(null);
      }
    },
    [session, semesterForSave]
  );

  // Stable card callbacks: the cards are memoised and each one holds a live grid, so
  // inline arrows here would re-render every visible routine on any keystroke.
  const handlePreview = useCallback(
    (routine, rank) => {
      setPreview({ routine, title: rank ? `Routine #${rank}` : 'Routine', courses: enrich(routine.sections) });
      setPreviewOpen(true);
    },
    [enrich]
  );
  const handleSave = useCallback((routine) => saveRoutine(routine, routine.signature), [saveRoutine]);

  const visibleCount = Math.min(displayCount, results?.routines?.length || 0);

  // Rows for the embedded grids, enriched once per visible window rather than per render.
  const visibleRows = useMemo(() => {
    const map = new Map();
    if (!results?.routines) return map;
    results.routines.slice(0, visibleCount).forEach((routine) => {
      map.set(routine.signature, enrich(routine.sections));
    });
    return map;
  }, [results, visibleCount, enrich]);

  const sentinelRef = useRef(null);
  const hasMore = !!results?.routines?.length && displayCount < results.routines.length;

  useEffect(() => {
    if (!hasMore) return undefined;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setDisplayCount((count) => count + RESULT_PAGE);
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  // ---------------------------------------------------------------- search box

  useEffect(() => {
    if (!searchOpen) return undefined;
    const onDocClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [searchOpen]);

  // Search runs against cached unique course code/title list
  const matches = useMemo(() => {
    const term = searchTerm.trim().toUpperCase();
    if (!term) return [];
    const prefix = [];
    const partial = [];
    const byTitle = [];
    courseList.forEach((entry) => {
      const code = entry.code;
      const title = entry.title.toUpperCase();
      if (code.startsWith(term)) prefix.push(entry);
      else if (code.includes(term)) partial.push(entry);
      else if (title.includes(term)) byTitle.push(entry);
    });
    const sortCode = (a, b) => (a.code < b.code ? -1 : 1);
    return [...prefix.sort(sortCode), ...partial.sort(sortCode), ...byTitle.sort(sortCode)].slice(0, 12);
  }, [searchTerm, courseList]);

  const getCourseConflictMessage = useCallback(
    (item) => {
      const base = rowsByCode.get(item.courseCode) || [];
      if (!base.length) return 'This course has no sections in the catalog.';

      const pinned = item.sections?.length
        ? base.filter((row) => item.sections.includes(row.sectionId))
        : base;

      if (item.faculties?.length) {
        const matchingFaculty = pinned.filter((row) =>
          facultyCodes(row).some((f) => item.faculties.includes(f))
        );
        if (!matchingFaculty.length) {
          return `None of the selected sections match faculty ${item.faculties.join(', ')} — select matching sections or clear the faculty filter.`;
        }
      }

      const byFaculty = item.faculties?.length
        ? pinned.filter((row) => facultyCodes(row).some((f) => item.faculties.includes(f)))
        : pinned;

      if (activeConstraints.avoidFaculty?.length) {
        const withAvoidFaculty = byFaculty.filter(
          (r) => !facultyCodes(r).some((f) => activeConstraints.avoidFaculty.includes(f))
        );
        if (!withAvoidFaculty.length) {
          const hit = [...new Set(byFaculty.flatMap(facultyCodes).filter((f) => activeConstraints.avoidFaculty.includes(f)))];
          return `Every section is taught by an avoided faculty (${hit.join(', ')}) — remove them from Avoid Faculty.`;
        }
      }

      if (activeConstraints.avoidDays?.length) {
        const withAvoidDays = byFaculty.filter((r) => {
          const days = (r.sectionSchedule?.classSchedules || []).map((s) => s.day).concat(
            (r.labSchedules || []).map((s) => s.day)
          );
          return !days.some((d) => activeConstraints.avoidDays.includes(d));
        });
        if (!withAvoidDays.length) {
          const daysHit = [...new Set(byFaculty.flatMap((r) =>
            (r.sectionSchedule?.classSchedules || []).map((s) => s.day).concat(
              (r.labSchedules || []).map((s) => s.day)
            )
          ).filter((d) => activeConstraints.avoidDays.includes(d)))];
          return `Every section meets on an avoided day (${daysHit.join(', ')}) — uncheck ${daysHit.join(', ')} in Avoid Days.`;
        }
      }

      if (activeConstraints.avoidSlots?.length) {
        return 'Every section falls in an avoided time slot — uncheck conflicting slots in Avoid Time Slots.';
      }

      if (activeConstraints.excludeKnownFull) {
        const withSeats = byFaculty.filter((r) => {
          const s = seatInfo(r);
          return s.seatsLeft === null || s.seatsLeft > 0;
        });
        if (!withSeats.length) {
          return 'All remaining sections are full — toggle off "Skip sections that are full".';
        }
      }

      return 'No sections left to schedule — try widening section or constraint choices.';
    },
    [rowsByCode, activeConstraints]
  );

  const specificFixes = useMemo(() => {
    if (!results?.exhausted?.length) return [];
    const fixes = [];
    const seen = new Set();

    results.exhausted.forEach((entry) => {
      if (entry.reason === 'avoidDay' && entry.constraint) {
        const key = `day:${entry.constraint}`;
        if (!seen.has(key)) {
          seen.add(key);
          const dayName = entry.constraint.charAt(0) + entry.constraint.slice(1).toLowerCase();
          fixes.push({
            key,
            label: `Allow ${dayName}`,
            action: () => {
              patchConstraints({
                avoidDays: (constraints.avoidDays || []).filter(
                  (d) => d.toUpperCase() !== entry.constraint.toUpperCase()
                ),
              });
              setTimeout(runGenerate, 0);
            },
          });
        }
      } else if (entry.reason === 'avoidFaculty' && entry.constraint) {
        const key = `faculty:${entry.constraint}`;
        if (!seen.has(key)) {
          seen.add(key);
          fixes.push({
            key,
            label: `Allow faculty ${entry.constraint}`,
            action: () => {
              patchConstraints({
                avoidFaculty: (constraints.avoidFaculty || []).filter(
                  (f) => f.toUpperCase() !== entry.constraint.toUpperCase()
                ),
              });
              setTimeout(runGenerate, 0);
            },
          });
        }
      } else if (entry.reason === 'avoidSlot' && entry.constraint) {
        const key = `slot:${entry.constraint}`;
        if (!seen.has(key)) {
          seen.add(key);
          fixes.push({
            key,
            label: `Allow slot ${entry.constraint}`,
            action: () => {
              patchConstraints({
                avoidSlots: (constraints.avoidSlots || []).filter((s) => s !== entry.constraint),
              });
              setTimeout(runGenerate, 0);
            },
          });
        }
      } else if (entry.reason === 'full') {
        const key = 'full';
        if (!seen.has(key)) {
          seen.add(key);
          fixes.push({
            key,
            label: 'Allow full sections',
            action: () => {
              patchConstraints({ excludeKnownFull: false });
              setTimeout(runGenerate, 0);
            },
          });
        }
      }
    });

    return fixes;
  }, [results?.exhausted, constraints, patchConstraints, runGenerate]);

  // ---------------------------------------------------------------- render

  const disabledReason = !pools.length
    ? 'Add at least one course to generate routines.'
    : pools.some((pool) => !pool.sections.length)
      ? 'One of your courses has no sections left — widen the constraints or unpin sections.'
      : null;

  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Automate Routine
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pick your courses, set the rules, and get conflict-free routines ranked by days on campus.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <SemesterSwitcher
          selectedSemester={selectedSemester}
          pastSemesters={pastSemesters}
          onChange={setSelectedSemester}
        />

        <div className="flex-1 relative" ref={searchRef}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              if (matches[0]) {
                addCourse(matches[0].code);
              } else if (searchTerm.trim()) {
                toast.error(`No course matches "${searchTerm.trim()}" in this semester`);
              }
            }}
            placeholder="Add a course by code or title… e.g. CSE101 or Calculus"
            aria-label="Search courses to add"
            className="w-full h-[50px] pl-11 pr-4 bg-white dark:bg-gray-900 border-2 border-gray-400 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 font-medium focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 shadow-sm transition-colors"
          />
          {searchOpen && matches.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
              {matches.map((match) => (
                <button
                  key={match.code}
                  type="button"
                  onClick={() => addCourse(match.code)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{match.code}</span>
                  <span className="text-gray-500 dark:text-gray-400 truncate">{match.title}</span>
                  <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {match.count} {match.count === 1 ? 'section' : 'sections'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {mounted && selectedCourses.length > 0 && (
          <button
            type="button"
            onClick={seedFromPreprereg}
            className="h-[50px] px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">From PrePreReg ({selectedCourses.length})</span>
            <span className="sm:hidden">PrePreReg</span>
          </button>
        )}
      </div>

      {/* Left: selected courses. Right: constraints + generate (stacked below lg). */}
      <div className="grid gap-5 lg:grid-cols-2 items-start">
      <div className="space-y-3 min-w-0">
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Add your courses to get started
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
            Search courses above by code or title to generate conflict-free routines.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const pool = pools.find((p) => p.courseCode === item.courseCode);
            return (
              <TargetCourseCard
                key={item.courseCode}
                courseCode={item.courseCode}
                courseName={titleByCode.get(item.courseCode) || ''}
                rows={rowsByCode.get(item.courseCode) || []}
                selectedIds={item.sections || []}
                facultyPrefs={item.faculties || []}
                candidateCount={pool?.sections?.length ?? 0}
                conflictMessage={getCourseConflictMessage(item)}
                onSectionsChange={(sections) => patchItem(item.courseCode, { sections })}
                onFacultiesChange={(faculties) => patchItem(item.courseCode, { faculties })}
                onRemove={() => removeCourse(item.courseCode)}
              />
            );
          })}
        </div>
      )}

      </div>

      <div className="space-y-4 min-w-0">
      {items.length > 0 && (
        <ConstraintPanel
          constraints={activeConstraints}
          onChange={patchConstraints}
          slotLabels={slotLabels}
          facultyOptions={facultyOptions}
          preferredFacultyMap={preferredFacultyMap}
          showSeatToggle={hasSeatData}
        />
      )}

      {items.length > 0 && (
        <div>
          <button
            type="button"
            onClick={runGenerate}
            disabled={!!disabledReason || generating}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {generating ? 'Checking combinations…' : hasRun && dirty ? 'Regenerate routines' : 'Generate routines'}
          </button>
          {disabledReason && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{disabledReason}</p>}
          {hasRun && dirty && !disabledReason && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              You changed the inputs — these results are from the previous search.
            </p>
          )}
        </div>
      )}
      </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-3">
          {results.exhausted.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Nothing can be scheduled yet
                  </h3>
                </div>
                <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200 pl-6">
                  {results.exhausted.map((entry) => (
                    <li key={entry.courseCode} className="leading-snug">
                      <span className="font-semibold">{entry.courseCode}</span>
                      {` — ${EXHAUSTED_TEXT[entry.reason]?.(entry.constraint) || 'no sections left after your choices'}`}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 md:justify-end">
                {specificFixes.map((fix) => (
                  <button
                    key={fix.key}
                    type="button"
                    onClick={fix.action}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm"
                  >
                    {fix.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    patchConstraints({ avoidDays: [], avoidSlots: [], avoidFaculty: [], excludeKnownFull: false });
                    setTimeout(runGenerate, 0);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                  Clear all constraints
                </button>
              </div>
            </div>
          )}

          {!results.routines.length && !results.exhausted.length && (
            <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                No conflict-free combination fits {constraints.minDays}&ndash;{constraints.maxDays} days
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Every possible pairing either overlaps in time or lands outside the day range.
              </p>
              <button
                type="button"
                onClick={() => {
                  patchConstraints({ maxDays: 6, minDays: 1 });
                  setTimeout(runGenerate, 0);
                }}
                className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 transition-colors"
              >
                Try days 1&ndash;6
              </button>
            </div>
          )}

          {!!results.routines.length && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {results.totalFound} routine{results.totalFound === 1 ? '' : 's'}
                  </span>{' '}
                  &middot; showing {visibleCount}
                  {results.capped && results.cappedReason === 'budget' && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {' '}
                      &middot; search stopped at {results.combosTried.toLocaleString()} combinations — pin sections
                      on busy courses to go deeper
                    </span>
                  )}
                  {results.capped && results.cappedReason === 'leaves' && (
                    <span className="text-gray-500 dark:text-gray-400"> · far more matches than we can show</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SORT_LABELS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={sortBy === option.key}
                      onClick={() => setSortBy(option.key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        sortBy === option.key
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2 items-start">
                {sortedResults.slice(0, displayCount).map(({ routine, rank }) => (
                  <RoutineResultCard
                    key={routine.signature}
                    routine={routine}
                    courses={visibleRows.get(routine.signature) || routine.sections}
                    rank={sortBy === 'days' ? rank : null}
                    showSeats={hasSeatData}
                    saving={savingKey === routine.signature}
                    onPreview={handlePreview}
                    onAdopt={adopt}
                    onSave={handleSave}
                  />
                ))}
              </div>

              {hasMore && (
                <div ref={sentinelRef} className="py-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  More routines
                </div>
              )}
            </>
          )}
        </div>
      )}

      {preview && (
        <RoutineView
          title={preview.title}
          courses={preview.courses}
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          onSave={() => saveRoutine(preview.routine, preview.routine.signature)}
          isSaving={savingKey === preview.routine.signature}
          showExportButton
          forceDesktopGrid
          showDailySpan
        />
      )}

      <SignInPrompt
        open={signInOpen}
        onOpenChange={setSignInOpen}
        featureDescription="Save generated routines to your account."
      />
    </div>
  );
};

export default AutomateRoutinePage;
