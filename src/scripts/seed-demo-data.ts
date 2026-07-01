import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

dotenv.config();

function getRequiredEnvVariable(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const databaseUrl = getRequiredEnvVariable("DATABASE_URL");

async function run() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const seedFilePath = path.resolve(
    currentDirectory,
    "../../sql/seeds/demo_seed_data.sql",
  );

  // The seed logic now lives in one raw PostgreSQL file so manual SQL seeding
  // and `npm run db:seed` stay aligned. This avoids the typed-parameter issues
  // that came from maintaining a second copy of the demo inserts in TypeScript.
  const seedSql = await readFile(seedFilePath, "utf8");

  await client.connect();

  try {
    await client.query(seedSql);

    console.log("Demo seed completed successfully.");
    console.log("");
    console.log("Demo Super Admin:");
    console.log("admin@creatorcommerce.test / Password123!");
    console.log("");
    console.log("Demo Brand Manager:");
    console.log("brand@creatorcommerce.test / Password123!");
    console.log("");
    console.log("Demo Creator:");
    console.log("creator@creatorcommerce.test / Password123!");
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error("Demo seed failed.", error);
  process.exitCode = 1;
});
