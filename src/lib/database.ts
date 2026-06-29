import { Pool } from "pg";
import { env } from "../config/env.js";

export const databasePool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});
