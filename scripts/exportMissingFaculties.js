// Export faculty initials that appear in the course catalog but have no
// name/email in the database, as a CSV matching the admin faculty import
// template (facultyName,email,imgURL,initials).
//
// Run with:
//   node scripts/exportMissingFaculties.js              # current semester
//   node scripts/exportMissingFaculties.js --all        # every semester in the backup index
//   node scripts/exportMissingFaculties.js Spring2026   # one past semester
//
// Reads only — it never writes to the database.

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

const CURRENT_COURSES_URL = 'https://usis-cdn.eniamza.com/connect.json';
const BACKUP_INDEX_URL = 'https://connect-cdn.itzmrz.xyz/connect_backup.json';
// Output name carries the scope so a --all run can't clobber a per-semester one
const outputPath = (scope) => path.join(process.cwd(), `missing_faculties${scope ? `_${scope}` : ''}.csv`);

const connectionString = process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

const csvEscape = (value) => {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const asSections = (data) => (Array.isArray(data) ? data : (data.sections || []));

const readJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
};

// Course rows carry a comma-separated initials string; TBA is not a person
const collectInitials = (sections, into) => {
  for (const section of sections) {
    for (const field of [section.faculties, section.labFaculties]) {
      if (!field) continue;
      for (const part of field.split(',')) {
        const initial = part.trim().toUpperCase();
        if (initial && initial !== 'TBA') into.add(initial);
      }
    }
  }
};

async function main() {
  const arg = process.argv[2];
  const wantsAll = arg === '--all';
  const targetSemester = wantsAll ? null : arg;

  const sql = postgres(connectionString, { ssl: 'require', max: 1 });

  try {
    // Known initials: an initial only counts as known if it maps to a faculty
    // row that actually carries a name and an email.
    const knownRows = await sql`
      SELECT upper(btrim(i.facultyinitial)) AS initial
      FROM initial i
      INNER JOIN faculty f ON f.facultyid = i.facultyid
      WHERE btrim(f.facultyname) <> '' AND btrim(f.email) <> ''`;
    const known = new Set(knownRows.map(r => r.initial));
    console.log(`Known initials in database: ${known.size}`);

    // Catalog initials
    const seen = new Set();
    const sources = [];

    if (wantsAll) {
      const index = await readJson(BACKUP_INDEX_URL);
      for (const backup of index.backups || []) {
        sources.push({ label: backup.semester, url: backup.cdnLink });
      }
      if (!sources.some(s => s.url === CURRENT_COURSES_URL)) {
        sources.push({ label: 'current', url: CURRENT_COURSES_URL });
      }
    } else if (targetSemester) {
      const index = await readJson(BACKUP_INDEX_URL);
      const match = (index.backups || [])
        .filter(b => b.semester?.toLowerCase().replace(/[-\s]/g, '') === targetSemester.toLowerCase().replace(/[-\s]/g, ''))
        .sort((a, b) => new Date(b.backupTime) - new Date(a.backupTime))[0];
      if (!match) throw new Error(`No backup found for semester "${targetSemester}"`);
      sources.push({ label: match.semester, url: match.cdnLink });
    } else {
      sources.push({ label: 'current', url: CURRENT_COURSES_URL });
    }

    for (const source of sources) {
      const sections = asSections(await readJson(source.url));
      const before = seen.size;
      collectInitials(sections, seen);
      console.log(`  ${source.label}: ${sections.length} sections, ${seen.size - before} new initials`);
    }
    console.log(`Unique initials in catalog: ${seen.size}`);

    const missing = [...seen].filter(initial => !known.has(initial)).sort();
    console.log(`Missing name/email in database: ${missing.length}`);

    if (missing.length === 0) {
      console.log('Nothing to export — every catalog initial resolves to a named faculty.');
      return;
    }

    // Same column order as the admin import template; name/email/image are left
    // blank for whoever fills the sheet in.
    const csv = ['facultyName,email,imgURL,initials']
      .concat(missing.map(initial => `,,,${csvEscape(initial)}`))
      .join('\n') + '\n';

    const target = outputPath(wantsAll ? 'all' : (targetSemester ? targetSemester.toLowerCase().replace(/[-\s]/g, '') : ''));
    fs.writeFileSync(target, csv, 'utf8');
    console.log(`\nWrote ${missing.length} rows to ${target}`);
    console.log('Fill in facultyName and email, then import from Dashboard → Data Import.');
  } finally {
    await sql.end();
  }
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exitCode = 1;
});
