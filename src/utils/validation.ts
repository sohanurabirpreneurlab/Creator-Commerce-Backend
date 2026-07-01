import { BadRequestError } from "../errors/bad-request-error.js";
import { ValidationError } from "../errors/validation-error.js";

export function requireTrimmedString(
  value: unknown,
  field: string,
  message = `${field} is required.`,
) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(message, "VALIDATION_REQUIRED_FIELD", { field });
  }

  return value.trim();
}

export function normalizeOptionalString(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ValidationError("Expected a string value.", "VALIDATION_INVALID_TYPE");
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function validateEnumValue<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  field: string,
) {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw new ValidationError(`Invalid ${field}.`, "VALIDATION_INVALID_ENUM", {
      field,
      allowedValues,
    });
  }

  return value as T;
}

export function validateOptionalEmail(value: string | null | undefined, field: string) {
  if (!value) {
    return value ?? null;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    throw new ValidationError(`Invalid ${field}.`, "VALIDATION_INVALID_EMAIL", {
      field,
    });
  }

  return value;
}

export function validateOptionalUrl(value: string | null | undefined, field: string) {
  if (!value) {
    return value ?? null;
  }

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Unsupported protocol");
    }
  } catch {
    throw new ValidationError(`Invalid ${field}.`, "VALIDATION_INVALID_URL", {
      field,
    });
  }

  return value;
}

export function validateNonNegativeInteger(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new ValidationError(
      `${field} must be a non-negative integer.`,
      "VALIDATION_INVALID_NUMBER",
      { field },
    );
  }

  return value;
}

export function validatePercentage(value: unknown, field: string) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0 || value > 100) {
    throw new ValidationError(
      `${field} must be between 0 and 100.`,
      "VALIDATION_INVALID_PERCENTAGE",
      { field },
    );
  }

  return value;
}

export function ensureAtLeastOneField(
  values: Array<unknown>,
  message = "At least one field must be provided for update.",
) {
  const hasValue = values.some((value) => value !== undefined);
  if (!hasValue) {
    throw new BadRequestError(message, "VALIDATION_EMPTY_UPDATE_PAYLOAD");
  }
}
