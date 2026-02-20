import { ImageResponse } from 'next/og';
import { getCachedMergedRoutine } from '@/lib/api/routineFetcher';

// Image metadata
export const alt = 'Merged Routine View';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }) {
    const { id } = await params;
    const routine = await getCachedMergedRoutine(id);

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
                    Merged Routine Not Found
                </div>
            ),
            {
                ...size,
            }
        );
    }

    const title = routine.ownerName
        ? `${routine.ownerName.charAt(0).toUpperCase() + routine.ownerName.slice(1).toLowerCase()}'s Merged Routine`
        : 'Shared Merged Routine';

    const routineData = routine.routineData
        ? JSON.parse(routine.routineData)
        : [];

    const friendsCount = routineData.length;
    // Get all unique section IDs to fetch
    const allSectionIds = Array.from(new Set(routineData.flatMap(item => item.sectionIds || [])));
    const uniqueCourseCount = allSectionIds.length;

    let allCourses = [];
    if (allSectionIds.length > 0) {
        try {
            const rawCourses = await fetch('https://usis-cdn.eniamza.com/connect.json').then(res => res.json());
            allCourses = rawCourses.filter(course => allSectionIds.includes(course.sectionId));
        } catch (e) {
            allCourses = [];
        }
    }

    // Predefined palette matches the app's standard shared-routine colors
    const colorPalette = [
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Purple
        '#EC4899', // Pink
        '#14B8A6', // Teal
    ];

    // Assign colors to friends and attach their courses
    const friends = routineData.map((item, index) => ({
        ...item,
        color: colorPalette[index % colorPalette.length],
        courses: allCourses.filter(c => (item.sectionIds || []).includes(c.sectionId))
    }));

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

    const getFriendsForSlot = (dayFull, timeSlot) => {
        const [slotStart, slotEnd] = timeSlot.split('-');
        const slotStartMin = timeToMinutes(slotStart);
        const slotEndMin = timeToMinutes(slotEnd);

        const dayMapping = { 'Su': 'SUNDAY', 'Mo': 'MONDAY', 'Tu': 'TUESDAY', 'We': 'WEDNESDAY', 'Th': 'THURSDAY', 'Fr': 'FRIDAY', 'Sa': 'SATURDAY' };
        const day = dayMapping[dayFull];

        const presentFriends = [];

        for (const friend of friends) {
            for (const course of friend.courses) {
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

                if (classMatch || labMatch) {
                    presentFriends.push(friend.color);
                    break; // found one course for this friend in this slot, move to next friend
                }
            }
        }
        return presentFriends;
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
                            background: '#3b0764',
                            borderRadius: '20px',
                            marginBottom: '24px',
                            boxShadow: 'inset 0 0 0 1px rgba(147, 51, 234, 0.5)',
                        }}
                    >
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#c084fc"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
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
                        {uniqueCourseCount} course{uniqueCourseCount !== 1 ? 's' : ''} • {friendsCount} friend{friendsCount !== 1 ? 's' : ''}
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
                        ID: {id}
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
                                        const presentFriends = getFriendsForSlot(day, slot);
                                        const hasCourse = presentFriends.length > 0;

                                        // If multiple friends, show stripes. If one, solid color. If none, dark gray.
                                        let bg = '#374151';
                                        if (presentFriends.length === 1) {
                                            bg = presentFriends[0];
                                        } else if (presentFriends.length > 1) {
                                            // basic stripes in vercel/og can be tricky, so we'll just stack small divs if needed,
                                            // but linear-gradient actually works in satori for simple stripes
                                            const stripes = presentFriends.map((c, i) => `${c} ${(i / presentFriends.length) * 100}%, ${c} ${((i + 1) / presentFriends.length) * 100}%`).join(', ');
                                            bg = `linear-gradient(to right, ${stripes})`;
                                        }

                                        const opacity = hasCourse ? '1' : '0.4';
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
