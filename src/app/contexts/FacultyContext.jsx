'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStaleCache, setCache } from '@/lib/idb';

const FacultyContext = createContext();

// This provider mounts on every route, so the lookup used to cost a DB join per
// cold start. Serve the last map immediately, then revalidate in the background.
const FACULTY_CACHE_KEY = 'faculty_map';
const FACULTY_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export function FacultyProvider({ children }) {
    const [facultyMap, setFacultyMap] = useState({});
    const [loading, setLoading] = useState(true);

    // Fetch faculty data once on provider mount (stale-while-revalidate)
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const cached = await getStaleCache(FACULTY_CACHE_KEY);
            if (cancelled) return;
            if (cached && Object.keys(cached).length > 0) {
                setFacultyMap(cached);
                setLoading(false);
            }

            try {
                const res = await fetch('/api/faculty/lookup');
                const data = await res.json();
                if (data.success) {
                    const map = data.facultyMap || {};
                    if (!cancelled) setFacultyMap(map);
                    if (Object.keys(map).length > 0) {
                        await setCache(FACULTY_CACHE_KEY, map, FACULTY_CACHE_TTL);
                    }
                }
            } catch (err) {
                console.error('Error fetching global faculty data:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    // Helper to get faculty details for a single course
    const getFacultyDetails = useCallback((faculties) => {
        if (!faculties) return { facultyName: null, facultyEmail: null, imgUrl: null };
        const firstInitial = faculties.split(',')[0]?.trim().toUpperCase();
        const facultyInfo = facultyMap[firstInitial];
        if (facultyInfo) {
            return {
                facultyName: facultyInfo.facultyName,
                facultyEmail: facultyInfo.email,
                imgUrl: facultyInfo.imgUrl,
            };
        }
        return { facultyName: null, facultyEmail: null, imgUrl: null };
    }, [facultyMap]);

    // Bulk enrich a list of courses
    const enrichCoursesWithFaculty = useCallback((courses) => {
        if (!courses || !Array.isArray(courses)) return [];
        return courses.map(course => {
            const { facultyName, facultyEmail, imgUrl } = getFacultyDetails(course.faculties);
            return {
                ...course,
                employeeName: facultyName,
                employeeEmail: facultyEmail,
                imgUrl,
            };
        });
    }, [getFacultyDetails]);

    return (
        <FacultyContext.Provider value={{ facultyMap, loading, getFacultyDetails, enrichCoursesWithFaculty }}>
            {children}
        </FacultyContext.Provider>
    );
}

export function useFaculty() {
    const context = useContext(FacultyContext);
    if (!context) {
        throw new Error('useFaculty must be used within a FacultyProvider');
    }
    return context;
}
