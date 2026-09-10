'use client';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import RoutineTableGrid from '@/components/routine/RoutineTableGrid';

// The grid is laid out at a wide "design" width and then scaled down to fit the panel.
// The design width is picked so the height-fitting scale also fills the panel horizontally.
const REFERENCE_WIDTH = 1400;
const MIN_DESIGN_WIDTH = 900;
const MAX_DESIGN_WIDTH = 2800;

// Gap between the panel and the floating button it grows out of
const ANCHOR_GAP = 12;
const FALLBACK_ANCHOR = { right: 24, bottom: 88 };

/**
 * Desktop-only preview of the routine that expands out of the floating routine
 * button and fills the lower-right quadrant of the screen. Shows the same grid as
 * the full routine modal, minus the header, action buttons, room info and colour legend.
 */
const RoutinePeek = ({
    courses = [],
    onRemoveCourse,
    isOpen = false,
    anchorRef,
    onMouseEnter,
    onMouseLeave,
}) => {
    const boxRef = useRef(null);
    const contentRef = useRef(null);
    const [scale, setScale] = useState(0);
    const [designWidth, setDesignWidth] = useState(REFERENCE_WIDTH);
    const designWidthRef = useRef(REFERENCE_WIDTH);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [anchor, setAnchor] = useState(FALLBACK_ANCHOR);
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Keep mounted while animating out
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            const timer = setTimeout(() => setIsVisible(true), 20);
            return () => clearTimeout(timer);
        }
        setIsVisible(false);
        const timer = setTimeout(() => setShouldRender(false), 220);
        return () => clearTimeout(timer);
    }, [isOpen]);

    // Align the panel with the button: right edges flush, bottom edge just above it
    const measureAnchor = useCallback(() => {
        const el = anchorRef?.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (!rect.width && !rect.height) return;
        const right = Math.max(Math.round(window.innerWidth - rect.right), 0);
        const bottom = Math.max(Math.round(window.innerHeight - rect.top + ANCHOR_GAP), 0);
        setAnchor(prev => (prev.right === right && prev.bottom === bottom ? prev : { right, bottom }));
    }, [anchorRef]);

    // Scale the full-size grid down so the whole routine fits inside the panel
    const measure = useCallback(() => {
        measureAnchor();

        const box = boxRef.current;
        const content = contentRef.current;
        if (!box || !content) return;
        const boxWidth = box.clientWidth;
        const boxHeight = box.clientHeight;
        if (!boxWidth || !boxHeight) return;

        // Pass 1 — natural height at a reference width. offsetHeight is a layout
        // value, so it is unaffected by the scale transform already applied.
        content.style.width = `${REFERENCE_WIDTH}px`;
        const referenceHeight = content.offsetHeight;
        if (!referenceHeight) {
            // Grid hasn't rendered yet (it waits a tick for the mobile breakpoint);
            // the ResizeObserver below re-runs this once it has.
            content.style.width = `${designWidthRef.current}px`;
            return;
        }

        // Pass 2 — widen the design so the routine fills the panel once scaled to fit its height
        const width = Math.round(Math.min(
            Math.max(boxWidth * (referenceHeight / boxHeight), MIN_DESIGN_WIDTH),
            MAX_DESIGN_WIDTH
        ));
        content.style.width = `${width}px`;
        const height = content.offsetHeight;
        const nextScale = Math.min(boxWidth / width, boxHeight / height, 1);

        designWidthRef.current = width;
        setDesignWidth(prev => (prev === width ? prev : width));
        setScale(prev => (Math.abs(prev - nextScale) < 0.001 ? prev : nextScale));
        setSize(prev => {
            const next = { width: width * nextScale, height: height * nextScale };
            return Math.abs(prev.width - next.width) < 0.5 && Math.abs(prev.height - next.height) < 0.5
                ? prev
                : next;
        });
    }, [measureAnchor]);

    useLayoutEffect(() => {
        if (shouldRender) measure();
    }, [shouldRender, courses, measure]);

    // The grid renders one tick late (it waits for the mobile breakpoint to resolve),
    // and the panel resizes with the viewport — re-fit on any of it.
    useEffect(() => {
        if (!shouldRender) return;
        const box = boxRef.current;
        const content = contentRef.current;
        if (!box || !content) return;

        const observer = new ResizeObserver(() => measure());
        observer.observe(box);
        observer.observe(content);
        window.addEventListener('resize', measure);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [shouldRender, measure]);

    if (!shouldRender) return null;

    return (
        <div
            className="hidden md:block fixed z-[45] pointer-events-none"
            style={{
                right: `${anchor.right}px`,
                bottom: `${anchor.bottom}px`,
                width: '50vw',
                height: `calc(50vh - ${anchor.bottom}px)`,
            }}
        >
            <div
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className={`w-full h-full origin-bottom-right transition-all duration-200 ease-out ${isVisible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-[0.2] pointer-events-none'}`}
            >
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden">
                    {/* Scaled-down grid — no header, the whole panel is grid */}
                    <div
                        ref={boxRef}
                        className="flex-1 min-h-0 overflow-hidden flex items-center justify-center p-2"
                    >
                        <div
                            style={{ width: size.width || undefined, height: size.height || undefined }}
                            className={`transition-opacity duration-150 ${scale ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <div
                                ref={contentRef}
                                style={{ width: designWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}
                            >
                                <RoutineTableGrid
                                    selectedCourses={courses}
                                    showRemoveButtons={false}
                                    onRemoveCourse={onRemoveCourse}
                                    hoverRemove={true}
                                    forceDesktop={true}
                                    compact={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoutinePeek;
