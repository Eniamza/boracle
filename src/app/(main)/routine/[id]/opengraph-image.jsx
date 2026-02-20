import { ImageResponse } from 'next/og';
import { getCachedRoutine } from '@/lib/api/routineFetcher';

// Image metadata
export const alt = 'Routine View';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }) {
    const { id } = await params;
    const routine = await getCachedRoutine(id);

    if (!routine) {
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 48,
                        background: '#111827',
                        color: '#f9fafb',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    Routine Not Found
                </div>
            ),
            {
                ...size,
            }
        );
    }

    const title = routine.ownerName
        ? `${routine.ownerName.charAt(0).toUpperCase() + routine.ownerName.slice(1).toLowerCase()}'s Routine`
        : 'Shared Routine';

    const sectionIds = routine.routineStr
        ? JSON.parse(atob(routine.routineStr))
        : [];

    let courses = [];
    if (sectionIds.length > 0) {
        try {
            const rawCourses = await fetch('https://usis-cdn.eniamza.com/connect.json').then(res => res.json());
            courses = rawCourses.filter(course => sectionIds.includes(course.sectionId));
        } catch (e) {
            courses = [];
        }
    }


    const timeSlots = [
        '08:00 AM-09:20 AM',
        '09:30 AM-10:50 AM',
        '11:00 AM-12:20 PM',
        '12:30 PM-01:50 PM',
        '02:00 PM-03:20 PM',
        '03:30 PM-04:50 PM',
        '05:00 PM-06:20 PM'
    ];

    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const timeToMinutes = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let totalMinutes = hours * 60 + minutes;
        if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
        if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
        return totalMinutes;
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        return `${parseInt(hours)}:${minutes} ${parseInt(hours) >= 12 ? 'PM' : 'AM'}`;
    };

    const getHasCourse = (dayFull, timeSlot) => {
        const [slotStart, slotEnd] = timeSlot.split('-');
        const slotStartMin = timeToMinutes(slotStart);
        const slotEndMin = timeToMinutes(slotEnd);

        const dayMapping = { 'Su': 'SUNDAY', 'Mo': 'MONDAY', 'Tu': 'TUESDAY', 'We': 'WEDNESDAY', 'Th': 'THURSDAY', 'Fr': 'FRIDAY', 'Sa': 'SATURDAY' };
        const day = dayMapping[dayFull];

        for (const course of courses) {
            const classMatch = course.sectionSchedule?.classSchedules?.some(s => {
                if (s.day !== day) return false;
                const scheduleStart = timeToMinutes(formatTime(s.startTime));
                const scheduleEnd = timeToMinutes(formatTime(s.endTime));
                return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
            });
            const labMatch = course.labSchedules?.some(s => {
                if (s.day !== day) return false;
                const scheduleStart = timeToMinutes(formatTime(s.startTime));
                const scheduleEnd = timeToMinutes(formatTime(s.endTime));
                return scheduleStart < slotEndMin && scheduleEnd > slotStartMin;
            });

            if (classMatch) return 'class';
            if (labMatch) return 'lab';
        }
        return false;
    };

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom, #030712, #111827, #0f172a)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'sans-serif',
                    padding: '60px',
                }}
            >
                {/* Left side details */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        maxWidth: '450px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '80px',
                            height: '80px',
                            background: '#1e3a8a',
                            borderRadius: '20px',
                            marginBottom: '24px',
                            boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.5)',
                        }}
                    >
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#60a5fa"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <h1
                        style={{
                            fontSize: 56,
                            fontWeight: 800,
                            color: '#f9fafb',
                            lineHeight: 1.1,
                            marginBottom: '16px',
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {title}
                    </h1>
                    <p
                        style={{
                            fontSize: 28,
                            color: '#9ca3af',
                            marginTop: 0,
                            marginBottom: '32px'
                        }}
                    >
                        {courses.length > 0 ? courses.length : sectionIds.length} course{sectionIds.length !== 1 ? 's' : ''}
                    </p>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#1f2937',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        color: '#d1d5db',
                        fontSize: 20,
                        fontWeight: 500,
                        border: '1px solid #374151',
                    }}>
                        Routine ID: {id}
                    </div>
                </div>

                {/* Right side Matrix */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#1f2937',
                        borderRadius: '24px',
                        padding: '24px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                        border: '1px solid #374151',
                    }}
                >
                    <div style={{ display: 'flex', borderBottom: '1px solid #374151', paddingBottom: '12px', marginBottom: '8px' }}>
                        <div style={{ width: '40px', marginRight: '8px' }}></div>
                        {days.map(day => (
                            <div key={day} style={{ width: '56px', textAlign: 'center', fontSize: 18, color: '#9ca3af', fontWeight: 600 }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {timeSlots.map((slot, i) => (
                            <div key={slot} style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '40px', fontSize: 16, color: '#6b7280', marginRight: '8px', textAlign: 'right' }}>
                                    {slot.split('-')[0].split(':')[0]}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {days.map(day => {
                                        const type = getHasCourse(day, slot);
                                        const bg = type === 'class' ? '#1d4ed8' : type === 'lab' ? '#7e22ce' : '#374151';
                                        const opacity = type ? '1' : '0.4';
                                        return (
                                            <div
                                                key={day}
                                                style={{
                                                    width: '48px',
                                                    height: '32px',
                                                    borderRadius: '6px',
                                                    background: bg,
                                                    opacity,
                                                    marginLeft: '4px',
                                                    marginRight: '4px'
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
