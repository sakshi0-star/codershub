// Deletes the persisted demo data. The next request re-seeds from src/lib/seed.ts.
import fs from "node:fs";
import path from "node:path";
const file = process.env.DATA_FILE || path.join(process.cwd(), ".data", "db.json");
fs.rmSync(file, { force: true });
console.log(`Removed ${file}. Demo data will be re-seeded on the next request.`);
