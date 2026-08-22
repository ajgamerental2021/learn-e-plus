/**
 * Fill in `VocabularyItem.pronunciationTh` for rows that lack a Thai reading.
 *
 * Two cases are repaired:
 *   - the column is NULL or blank
 *   - the column holds the English word verbatim (a seed bug), so the card
 *     showed "box" where the Thai reading belongs
 *
 * Rows that already hold Thai script are left untouched. Readings come from
 * lib/thai-phonetics, which returns null rather than guessing, so a word we do
 * not know stays empty instead of teaching a wrong pronunciation.
 *
 * Dry run:  DATABASE_URL=... npx tsx scripts/backfill-pronunciation.mts
 * Apply:    DATABASE_URL=... npx tsx scripts/backfill-pronunciation.mts --apply
 */
import pg from "pg";
import { thaiReading } from "../lib/thai-phonetics";

const apply = process.argv.includes("--apply");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const { rows } = await pool.query<{ word: string }>(`
  select distinct word
  from "VocabularyItem"
  where "pronunciationTh" is null
     or btrim("pronunciationTh") = ''
     or "pronunciationTh" !~ '[฀-๿]'
  order by word
`);

const updates: Array<[string, string]> = [];
const skipped: string[] = [];

for (const { word } of rows) {
  const reading = thaiReading(word);
  if (reading) updates.push([word, reading.text]);
  else skipped.push(word);
}

console.log(`rows needing a reading: ${rows.length}`);
console.log(`resolved: ${updates.length}`);
console.log(`no reading available: ${skipped.length}`);
if (skipped.length) console.log(skipped.map((w) => `  - ${w}`).join("\n"));

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write.");
  console.log(updates.slice(0, 10).map(([w, r]) => `  ${w} => ${r}`).join("\n"));
  await pool.end();
  process.exit(0);
}

let written = 0;
for (const [word, reading] of updates) {
  const res = await pool.query(
    `update "VocabularyItem"
        set "pronunciationTh" = $2
      where word = $1
        and ("pronunciationTh" is null
             or btrim("pronunciationTh") = ''
             or "pronunciationTh" !~ '[฀-๿]')`,
    [word, reading]
  );
  written += res.rowCount ?? 0;
}

console.log(`\nUpdated ${written} rows.`);
await pool.end();
