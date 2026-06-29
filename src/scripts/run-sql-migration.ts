import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";
import { env } from "../config/env.js";

const MIGRATIONS_DIRECTORY = path.resolve(process.cwd(), "sql");

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      id bigserial primary key,
      file_name text not null unique,
      applied_at timestamptz not null default now()
    );
  `);
}

async function getMigrationFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIRECTORY, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function getAppliedMigrationFiles(client: Client) {
  const result = await client.query<{ file_name: string }>(
    "select file_name from public.schema_migrations order by file_name asc",
  );

  return new Set(result.rows.map((row) => row.file_name));
}

async function applyMigration(client: Client, fileName: string) {
  const migrationFilePath = path.join(MIGRATIONS_DIRECTORY, fileName);
  const sql = await fs.readFile(migrationFilePath, "utf8");

  await client.query("begin");

  try {
    await client.query(sql);
    await client.query(
      "insert into public.schema_migrations (file_name) values ($1)",
      [fileName],
    );
    await client.query("commit");
    console.log(`Applied migration: ${fileName}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function run() {
  const client = new Client({
    connectionString: env.databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await client.connect();

  try {
    await ensureMigrationsTable(client);

    const migrationFiles = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrationFiles(client);
    const pendingMigrations = migrationFiles.filter(
      (fileName) => !appliedMigrations.has(fileName),
    );

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations found.");
      return;
    }

    for (const fileName of pendingMigrations) {
      await applyMigration(client, fileName);
    }

    console.log("All pending migrations applied successfully.");
  } finally {
    await client.end();
  }
}

void run().catch((error: unknown) => {
  console.error("Migration failed.", error);
  process.exit(1);
});
