'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FacultyContext = createContext();

export function FacultyProvider({ children }) {
    const [facultyMap, setFacultyMap] = useState({});
    const [loading, setLoading] = useState(true);

    // Fetch faculty data once on provider mount
    useEffect(() => {
        fetch('/api/faculty/lookup')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setFacultyMap(data.facultyMap || {});
                }
            })
            .catch(err => console.error('Error fetching global faculty data:', err))
            .finally(() => setLoading(false));
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
