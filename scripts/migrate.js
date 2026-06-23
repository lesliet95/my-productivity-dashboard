const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

async function migrate() {
  const sql = neon(process.env.DATABASE_URL);
  const schema = fs.readFileSync(
    path.join(__dirname, "../src/lib/schema.sql"),
    "utf-8"
  );
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const statement of statements) {
    await sql(statement);
  }
  console.log("Migration complete");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
