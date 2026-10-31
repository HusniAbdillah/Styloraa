export class StudioRequestError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function studioRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { code?: string; message?: string };
  } | null;
  if (!response.ok || !body || !("data" in body)) {
    throw new StudioRequestError(
      body?.error?.code ?? "REQUEST_FAILED",
      body?.error?.message ??
        "We could not complete that request. Please try again.",
    );
  }
  return body.data as T;
}

export function requestMessage(error: unknown) {
  if (error instanceof StudioRequestError) {
    const messages: Record<string, string> = {
      NOT_CONFIGURED:
        "The studio is currently unavailable. Please try again later.",
      DATABASE_UNAVAILABLE:
        "We could not reach your collection. Your choices are still here; please try again.",
      WRITE_DISABLED:
        "Changes are currently unavailable. You can still browse your saved collection.",
      AI_NOT_CONFIGURED:
        "Outfit suggestions are currently unavailable. You can still arrange your own pieces.",
      AI_INVALID_OUTPUT:
        "We could not verify the suggested combinations. Please try again.",
      AI_TIMEOUT:
        "The suggestion request took too long. Your capsule has not changed; please try again.",
    };
    if (messages[error.code]) return messages[error.code];
  }
  return error instanceof StudioRequestError
    ? error.message
    : "The connection was interrupted. Your choices are still here. Try again.";
}
