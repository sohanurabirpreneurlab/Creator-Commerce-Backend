import crypto from "node:crypto";

export function generateShortCode(prefix = "trk") {
  const randomPart = crypto.randomBytes(4).toString("hex");
  return `${prefix}_${randomPart}`;
}
