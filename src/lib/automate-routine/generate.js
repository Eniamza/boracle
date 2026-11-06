/**
 * Conflict-free routine search for the Automate Routine tool.
 *
 * Pure: takes catalog rows in, returns ranked section combinations. No fetching,
 * no React. The search is a depth-first walk over per-course candidate pools with
 * interval-based conflict pruning, replacing the brute cartesian product the
 * original tool used (see out/notes/automate-routine/../automate-routine-mechanics.md).
 */

import {
  compareSections,
  creditsOf,
  facultyCodes,
  meetingsOf,
  seatInfo,
  slotToMinutes,
} from './model.js';

const DEFAULT_LIMIT = 200;
const DEFAULT_COMBO_BUDGET = 200000;
// Leaf ceiling is memory/serialisation protection, not a quality knob: it sits far
// above any limit we show, so the returned top-N is the true best-N except in queries
// so huge the combo budget stops the search first (cappedReason 'budget').
const DEFAULT_MAX_LEAVES = 20000;

/** Two meetings clash only on strict overlap; back-to-back is legal. */
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

const narrowsTo = (row, constraints, slots, avoidDays, avoidFaculty) => {
  const meetings = meetingsOf(row);
  const drops = [];

  for (const meeting of meetings) {
    if (avoidDays.has(meeting.day)) {
      drops.push({ reason: 'avoidDay', constraint: meeting.day });
      break;
    }
  }
  if (!drops.length) {
    for (const meeting of meetings) {
      const hit = slots.find(([start, end]) => overlaps(meeting.start, meeting.end, start, end));
      if (hit) {
        drops.push({ reason: 'avoidSlot', constraint: hit[2] });
        break;
      }
    }
  }
  if (!drops.length && avoidFaculty.size) {
    const hit = facultyCodes(row).find((f) => avoidFaculty.has(f));
    if (hit) drops.push({ reason: 'avoidFaculty', constraint: hit });
  }
  if (!drops.length && constraints.excludeKnownFull && seatInfo(row).knownFull) {
    drops.push({ reason: 'full' });
  }
  return { meetings, dropped: drops[0] || null };
};

const preparePools = (targets, constraints) => {
  const avoidDays = new Set((constraints.avoidDays || []).map((d) => String(d).toUpperCase()));
  const avoidFaculty = new Set((constraints.avoidFaculty || []).map((f) => String(f).toUpperCase()));
  const slots = (constraints.avoidSlots || []).map((slot) => {
    const [start, end] = slotToMinutes(slot);
    return [start, end, slot];
  });

  const exhausted = [];
  const pools = targets.map((target, index) => {
    const rows = (target.sections || []).slice().sort(compareSections);
    const candidates = [];
    const blockers = {};

    rows.forEach((row) => {
      const { meetings, dropped } = narrowsTo(row, constraints, slots, avoidDays, avoidFaculty);
      if (dropped) {
        const key = `${dropped.reason}:${dropped.constraint || ''}`;
        blockers[key] = (blockers[key] || 0) + 1;
        return;
      }
      candidates.push({ row, meetings });
    });

    if (rows.length === 0) {
      exhausted.push({ courseCode: target.courseCode, index, candidates: 0, reason: 'noSections', blockers });
    } else if (!candidates.length) {
      const [topKey, topCount] = Object.entries(blockers).sort((a, b) => b[1] - a[1])[0] || ['unknown', rows.length];
      const [reason, constraint] = topKey.split(':');
      exhausted.push({
        courseCode: target.courseCode,
        index,
        candidates: rows.length,
        reason,
        constraint: constraint || null,
        blockers,
      });
    }

    return { index, courseCode: target.courseCode, candidates };
  });

  return { pools, exhausted };
};

const sortRoutines = (routines) =>
  routines.sort((a, b) => {
    if (a.days !== b.days) return a.days - b.days;
    if (a.spanMinutes !== b.spanMinutes) return a.spanMinutes - b.spanMinutes;
    if (a.contactMinutes !== b.contactMinutes) return a.contactMinutes - b.contactMinutes;
    const seatsA = a.seatsLeft === null ? -1 : a.seatsLeft;
    const seatsB = b.seatsLeft === null ? -1 : b.seatsLeft;
    if (seatsA !== seatsB) return seatsB - seatsA;
    return a.signature < b.signature ? -1 : 1;
  });

/**
 * @param {Array<{courseCode: string, sections: Array}>} targets one entry per course
 * @param {object} constraints { avoidDays, avoidSlots, avoidFaculty, minDays, maxDays, excludeKnownFull }
 * @param {{limit?: number, comboBudget?: number}} [options]
 * @returns {{routines: Array, exhausted: Array, capped: boolean, combosTried: number, totalFound: number}}
 */
export const generateRoutines = (targets = [], constraints = {}, options = {}) => {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const comboBudget = options.comboBudget ?? DEFAULT_COMBO_BUDGET;
  const maxLeaves = options.maxLeaves ?? DEFAULT_MAX_LEAVES;
  const minDays = constraints.minDays ?? 1;
  const maxDays = constraints.maxDays ?? 6;

  const { pools, exhausted } = preparePools(targets, constraints);

  // A routine must cover every requested course; one dead pool means no routines at all,
  // and `exhausted` says exactly why (the original tool failed silently here).
  if (exhausted.length) {
    return { routines: [], exhausted, capped: false, cappedReason: null, combosTried: 0, totalFound: 0 };
  }

  const order = pools.slice().sort((a, b) => a.candidates.length - b.candidates.length);
  const routines = [];
  const occupancy = new Map(); // day -> [[start, end], ...]
  const bounds = new Map(); // day -> [earliest, latest]
  const placedSections = new Array(order.length);
  let daysCount = 0;
  let contactMinutes = 0;
  let credits = 0;
  let seatsLeft = 0;
  let seatsUnknownCount = 0;
  let combosTried = 0;
  let capped = false;
  let cappedReason = null;

  const conflicts = (meetings) => {
    for (const meeting of meetings) {
      const list = occupancy.get(meeting.day);
      if (!list) continue;
      for (const [start, end] of list) {
        if (overlaps(meeting.start, meeting.end, start, end)) return true;
      }
    }
    return false;
  };

  const recomputeBound = (day) => {
    const list = occupancy.get(day);
    if (!list || !list.length) {
      bounds.delete(day);
      return;
    }
    let start = Infinity;
    let end = -Infinity;
    for (const [s, e] of list) {
      if (s < start) start = s;
      if (e > end) end = e;
    }
    bounds.set(day, [start, end]);
  };

  const place = (meetings) => {
    meetings.forEach(({ day, start, end }) => {
      if (!occupancy.has(day)) {
        occupancy.set(day, []);
        daysCount += 1;
      }
      occupancy.get(day).push([start, end]);
      recomputeBound(day);
      contactMinutes += end - start;
    });
  };

  const unplace = (meetings) => {
    meetings.forEach(({ day, start, end }) => {
      const list = occupancy.get(day);
      // Remove this exact interval (searching from the end keeps LIFO symmetry and
      // survives a future refactor that unwinds out of order).
      let index = -1;
      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (list[i][0] === start && list[i][1] === end) {
          index = i;
          break;
        }
      }
      if (index >= 0) list.splice(index, 1);
      if (!list.length) {
        occupancy.delete(day);
        bounds.delete(day);
        daysCount -= 1;
      } else {
        recomputeBound(day);
      }
      contactMinutes -= end - start;
    });
  };

  const record = () => {
    let spanMinutes = 0;
    bounds.forEach(([start, end]) => {
      spanMinutes += end - start;
    });
    // Restore the order the user listed their courses in.
    const sections = new Array(order.length);
    order.forEach((pool, position) => {
      sections[pool.index] = placedSections[position];
    });
    if (daysCount < minDays) return;
    routines.push({
      sections,
      days: daysCount,
      daysList: [...bounds.keys()],
      spanMinutes,
      contactMinutes,
      credits,
      seatsLeft: seatsUnknownCount ? null : seatsLeft,
      signature: sections.map((s) => `${s.courseCode}:${s.sectionId}`).join('|'),
    });
  };

  const walk = (position) => {
    if (capped) return;
    const pool = order[position];

    for (const candidate of pool.candidates) {
      if (++combosTried > comboBudget) {
        capped = true;
        cappedReason = 'budget';
        return;
      }
      if (candidate.meetings.length && conflicts(candidate.meetings)) continue;

      const seat = seatInfo(candidate.row);
      const addedDays = candidate.meetings.reduce((set, m) => {
        if (!occupancy.has(m.day)) set.push(m.day);
        return set;
      }, []);
      if (daysCount + addedDays.length > maxDays) continue;

      placedSections[position] = candidate.row;
      place(candidate.meetings);
      credits += creditsOf(candidate.row);
      if (seat.seatsLeft === null) seatsUnknownCount += 1;
      else seatsLeft += seat.seatsLeft;

      if (position + 1 === order.length) {
        record();
        if (routines.length >= maxLeaves) {
          capped = true;
          cappedReason = 'leaves';
        }
      } else {
        walk(position + 1);
      }

      if (seat.seatsLeft === null) seatsUnknownCount -= 1;
      else seatsLeft -= seat.seatsLeft;
      credits -= creditsOf(candidate.row);
      unplace(candidate.meetings);
      placedSections[position] = undefined;

      if (capped) return;
    }
  };

  walk(0);

  sortRoutines(routines);
  const totalFound = routines.length;

  return {
    routines: routines.slice(0, limit),
    exhausted: [],
    capped,
    cappedReason,
    combosTried,
    totalFound,
  };
};
