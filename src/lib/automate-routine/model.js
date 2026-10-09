/**
 * Section meeting model for the Automate Routine tool.
 *
 * Pure module: no React, no fetching, no side effects. It reads the structured
 * schedules the catalog already ships (`sectionSchedule.classSchedules` and
 * `labSchedules`) so nothing here parses `preRegSchedule` strings.
 */

export const DAY_ORDER = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

/** 'HH:MM:SS' (24h, as the catalog ships it) → minutes since midnight. */
export const toMinutes = (hhmmss) => {
  const [h, m] = String(hhmmss).split(':');
  return Number(h) * 60 + Number(m);
};

/** '08:00 AM-09:20 AM' (a getRoutineTimings() slot) → [startMin, endMin]. */
export const slotToMinutes = (slot) => {
  const [start, end] = String(slot).split('-');
  return [clockToMinutes(start), clockToMinutes(end)];
};

export const clockToMinutes = (time) => {
  const match = String(time).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return NaN;
  const hour = Number(match[1]) % 12;
  const isPm = match[3].toUpperCase() === 'PM';
  return hour * 60 + Number(match[2]) + (isPm ? 720 : 0);
};

/**
 * One catalog row → flat meeting list in minutes.
 * Class meetings first, then the inline lab meetings (kind: 'lab').
 * Rows with no schedules (thesis, internship) yield [] — they never conflict.
 */
export const meetingsOf = (section) => {
  const meetings = [];
  const seen = new Set();

  const push = (schedule, kind, room) => {
    if (!schedule?.day || schedule.startTime == null || schedule.endTime == null) return;
    const start = toMinutes(schedule.startTime);
    const end = toMinutes(schedule.endTime);
    if (Number.isNaN(start) || Number.isNaN(end)) return;
    const day = String(schedule.day).toUpperCase();
    const key = `${day}|${start}|${end}|${kind}`;
    if (seen.has(key)) return;
    seen.add(key);
    meetings.push({ day, start, end, kind, room: room ?? null });
  };

  (section.sectionSchedule?.classSchedules || []).forEach((s) =>
    push(s, 'class', section.roomName)
  );
  (section.labSchedules || []).forEach((s) => push(s, 'lab', section.labRoomName));

  return meetings;
};

/** 'RKBM, ANKH' → ['RKBM','ANKH']; missing faculty is 'TBA', which is a real value. */
export const facultyCodes = (section) => {
  const raw = String(section.faculties ?? '').trim();
  if (!raw) return ['TBA'];
  return raw
    .split(',')
    .map((f) => f.trim().toUpperCase())
    .filter(Boolean);
};

/** Catalog numbers arrive as strings; this is the one place that coerces them. */
export const creditsOf = (section) => {
  const credit = Number(section.courseCredit);
  return Number.isFinite(credit) ? credit : 0;
};

/**
 * Seats are advisory. Current-semester catalogs ship without capacity/consumedSeat
 * (courseFetcher strips them on purpose), so both may be null — every consumer must
 * handle "unknown" rather than guessing.
 */
export const seatInfo = (section) => {
  const consumed = section.consumedSeat == null ? null : Number(section.consumedSeat);
  const capacity = section.capacity == null ? null : Number(section.capacity);
  const known = Number.isFinite(consumed) && Number.isFinite(capacity);
  return {
    consumed: known ? consumed : null,
    capacity: known ? capacity : null,
    seatsLeft: known ? Math.max(capacity - consumed, 0) : null,
    knownFull: known ? consumed >= capacity : false,
  };
};

export const sectionLabel = (section) =>
  `${section.courseCode}-[${section.sectionName ?? '?'}]`;

/** Numeric-first ordering of '04', '12', '02 (ALL)' so results are deterministic. */
export const sectionSortKey = (section) => {
  const name = String(section.sectionName ?? '');
  const num = parseInt(name, 10);
  return [Number.isNaN(num) ? Infinity : num, name];
};

export const compareSections = (a, b) => {
  const [na, ta] = sectionSortKey(a);
  const [nb, tb] = sectionSortKey(b);
  if (na !== nb) return na - nb;
  if (ta !== tb) return ta < tb ? -1 : 1;
  return String(a.sectionId) < String(b.sectionId) ? -1 : 1;
};
