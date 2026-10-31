/** Shared server error shapes so routes map failures consistently. */
export class NotFoundError extends Error {}
export class InvalidInputError extends Error {}
export class ConflictError extends Error {}

/** Map known Postgres failures to domain errors. */
export function mapDbError(error: { code?: string; message?: string }) {
  if (error.code === "23503" || error.code === "23505") {
    return new ConflictError("Related records conflict with this change.");
  }
  if (error.code === "22023") {
    return new InvalidInputError(error.message || "Invalid input.");
  }
  return new Error("Database operation failed.");
}
