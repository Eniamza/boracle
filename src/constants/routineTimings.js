import globalInfo from './globalInfo';

export const REGULAR_TIMINGS = [
    '08:00 AM-09:20 AM',
    '09:30 AM-10:50 AM',
    '11:00 AM-12:20 PM',
    '12:30 PM-01:50 PM',
    '02:00 PM-03:20 PM',
    '03:30 PM-04:50 PM',
    '05:00 PM-06:20 PM'
];

export const RAMADAN_TIMINGS = [
    '08:00 AM-09:05 AM',
    '09:15 AM-10:20 AM',
    '10:30 AM-11:35 AM',
    '11:45 AM-12:50 PM',
    '01:00 PM-02:05 PM',
    '02:15 PM-03:20 PM',
    '03:30 PM-04:35 PM'
];

export const getRoutineTimings = () => {
    return globalInfo.isRamadan ? RAMADAN_TIMINGS : REGULAR_TIMINGS;
};


export const getTimingMapping = () => {
    return REGULAR_TIMINGS.map((time, index) => ({
        regular: time,
        ramadan: RAMADAN_TIMINGS[index]
    }));
}

const TIME_CONVERSION_MAP = {
    // Start times (Regular -> Ramadan)
    '08:00 AM': '08:00 AM', '8:00 AM': '08:00 AM',
    '09:30 AM': '09:15 AM', '9:30 AM': '09:15 AM',
    '11:00 AM': '10:30 AM', // 11 is 2 digits
    '12:30 PM': '11:45 AM',
    '02:00 PM': '01:00 PM', '2:00 PM': '01:00 PM',
    '03:30 PM': '02:15 PM', '3:30 PM': '02:15 PM',
    '05:00 PM': '03:30 PM', '5:00 PM': '03:30 PM',

    // End times (Regular -> Ramadan)
    '09:20 AM': '09:05 AM', '9:20 AM': '09:05 AM',
    '10:50 AM': '10:20 AM', // 10 is 2 digits
    '12:20 PM': '11:35 AM',
    '01:50 PM': '12:50 PM', '1:50 PM': '12:50 PM',
    '03:20 PM': '02:05 PM', '3:20 PM': '02:05 PM',
    '04:50 PM': '03:20 PM', '4:50 PM': '03:20 PM',
    '06:20 PM': '04:35 PM', '6:20 PM': '04:35 PM'
};

export const getAdjustedTime = (time) => {
    if (!globalInfo.isRamadan || !time) return time;
    return TIME_CONVERSION_MAP[time] || time;
};
