import dotenv from "dotenv";

dotenv.config();


function getRequiredEnvVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getPort() {
  const rawPort = getRequiredEnvVariable("PORT");
  const parsedPort = Number(rawPort);

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error("Environment variable PORT must be a valid positive integer.");
  }

  return parsedPort;
}

export const env = {
  appName: "Creators Commerce Backend",
  port: getPort(),
  databaseUrl: getRequiredEnvVariable("DATABASE_URL"),
  jwtSecret: getRequiredEnvVariable("JWT_SECRET"),
  frontendUrl: getRequiredEnvVariable("FRONTEND_URL"),
} as const;
