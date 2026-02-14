#!/usr/bin/env node
/*
  convertFacultyJsonToCsv.js

  Usage:
    node scripts/convertFacultyJsonToCsv.js <input.json> [output.csv]

  Example:
    node scripts/convertFacultyJsonToCsv.js "C:\\Users\\eniam\\Downloads\\faculty_data_with_images.json" faculty.csv

  This script reads a JSON file (array or object containing an array) and writes a CSV
  containing only these columns: facultyInitials, fullName, email, profile_image_url

  The script will try common key name variations for each field.
*/

const fs = require('fs').promises;
const path = require('path');

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // If contains quotes, commas, or newlines, wrap in double quotes and escape existing quotes
  if (/[",\n\r,]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function firstTruthy(obj, keys) {
  for (const k of keys) {
    if (!obj) continue;
    // support nested keys like 'profile.image.url' if provided
    if (k.includes('.')) {
      const parts = k.split('.');
      let cur = obj;
      let found = true;
      for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
        else { found = false; break; }
      }
      if (found && cur != null) return cur;
    } else if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) {
      return obj[k];
    }
    // try case-insensitive lookup
    const lower = Object.keys(obj || {}).find(x => x.toLowerCase() === k.toLowerCase());
    if (lower && obj[lower] != null) return obj[lower];
  }
  return undefined;
}

async function loadJson(file) {
  const txt = await fs.readFile(file, 'utf8');
  try {
    return JSON.parse(txt);
  } catch (e) {
    throw new Error('Failed to parse JSON: ' + e.message);
  }
}

function findArrayRoot(json) {
  if (Array.isArray(json)) return json;
  // common wrappers
  const candidates = ['data', 'items', 'faculties', 'faculty', 'results'];
  for (const c of candidates) {
    if (Array.isArray(json[c])) return json[c];
  }
  // otherwise, try to find first array in object
  for (const k of Object.keys(json || {})) {
    if (Array.isArray(json[k])) return json[k];
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/convertFacultyJsonToCsv.js <input.json> [output.csv]');
    process.exit(2);
  }
  const inputPath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1] || path.join(process.cwd(), 'faculty_export.csv'));

  const raw = await loadJson(inputPath);
  const arr = findArrayRoot(raw);
  if (!arr) {
    console.error('Could not find an array in JSON file. Please pass an array or a wrapper object with an array.');
    process.exit(3);
  }

  // New required CSV heading and output order per request
  const header = ['facultyName', 'email', 'imgURL', 'initials'];
  const rows = [header.map(csvEscape).join(',')];
  let writtenCount = 0;
  let skippedCount = 0;
  let missingRequiredCount = 0;
  let invalidEmailCount = 0;
  let newlineFieldCount = 0;

  // simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const [idx, item] of arr.entries()) {
    // Attempt to extract fields using common key names
    const initials = firstTruthy(item, ['facultyInitials', 'initials', 'faculty_initials', 'initial']);
    const fullName = firstTruthy(item, ['fullName', 'name', 'full_name', 'displayName', 'facultyName']);
    const email = firstTruthy(item, ['email', 'emailAddress', 'email_address', 'employeeEmail']);

    // profile image url might be nested or different key names
    let profile = firstTruthy(item, ['profile_image_url', 'profileImageUrl', 'image_url', 'imageUrl', 'profileImage', 'avatar', 'photo', 'photo_url', 'profile.image.url', 'image.url']);
    // if profile is an object with url or src
    if (profile && typeof profile === 'object') {
      profile = firstTruthy(profile, ['url', 'src', 'path']);
    }

    // Validate required fields
    if (!initials || !fullName || !email) {
      missingRequiredCount++;
      skippedCount++;
      continue;
    }

    // Validate email format
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
      invalidEmailCount++;
      skippedCount++;
      continue;
    }

    const facultyName = String(fullName);
    const imgURL = profile ? String(profile) : '';
    const initialsStr = String(initials);

    // If any field contains raw newlines it can break CSV consumers that don't handle quoted newlines;
    // treat those as problematic and skip. (We still escape values, but user asked to filter such rows.)
    if (/[\r\n]/.test(facultyName) || /[\r\n]/.test(email) || /[\r\n]/.test(imgURL) || /[\r\n]/.test(initialsStr)) {
      newlineFieldCount++;
      skippedCount++;
      continue;
    }

    rows.push([
      csvEscape(facultyName),
      csvEscape(email.trim()),
      csvEscape(imgURL || ''),
      csvEscape(initialsStr)
    ].join(','));
    writtenCount++;
  }

  await fs.writeFile(outputPath, rows.join('\n'), 'utf8');
  const summaryParts = [`Wrote ${writtenCount} rows to ${outputPath}`];
  if (skippedCount) {
    summaryParts.push(`Skipped ${skippedCount} entries:`);
    const reasons = [];
    if (missingRequiredCount) reasons.push(`${missingRequiredCount} missing required fields`);
    if (invalidEmailCount) reasons.push(`${invalidEmailCount} invalid email format`);
    if (newlineFieldCount) reasons.push(`${newlineFieldCount} contained newline characters`);
    summaryParts.push(reasons.join(', '));
  }
  console.log(summaryParts.join(' '));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
