"use client";

import Link from "next/link";
import { useState } from "react";

type CreatedShare = { share_id: string; path: string; expires_at: string };
type ErrorBody = { error?: { message?: string } };

async function responseError(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ErrorBody;
  return body.error?.message || "The request could not be completed.";
}

export function ShareControls({ savedLookId }: { savedLookId: string }) {
  const [catchphrase, setCatchphrase] = useState("");
  const [created, setCreated] = useState<CreatedShare | null>(null);
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function create() {
    setPending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/saved-looks/${encodeURIComponent(savedLookId)}/shares`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            catchphrase: catchphrase.trim(),
            expires_in_hours: 168,
          }),
        },
      );
      if (!response.ok) throw new Error(await responseError(response));
      const value = (await response.json()) as CreatedShare;
      if (!/^\/shared\/[0-9a-f]{64}$/.test(value.path))
        throw new Error("The share link could not be read.");
      setCreated(value);
      setUrl(`${window.location.origin}${value.path}`);
      setNotice("Share link created. Copy it now; this address is shown once.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The share link could not be created.",
      );
    } finally {
      setPending(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Link copied.");
      setError("");
    } catch {
      setError("Copy failed. Select the link field and copy it manually.");
    }
  }

  async function revoke() {
    if (!created) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/shares/${encodeURIComponent(created.share_id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error(await responseError(response));
      setCreated(null);
      setUrl("");
      setNotice("Link revoked. The public page is no longer available.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The link could not be revoked.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="border-border bg-card space-y-5 rounded-xl border p-6">
      <h2 className="font-serif text-2xl">Link preview</h2>
      <label className="block text-sm font-medium" htmlFor="share-catchphrase">
        Catchphrase
      </label>
      <input
        id="share-catchphrase"
        className="border-border bg-card mt-2 min-h-11 w-full rounded-lg border px-3"
        maxLength={240}
        value={catchphrase}
        onChange={(event) => setCatchphrase(event.target.value)}
        placeholder="Your words for this look"
        disabled={pending || Boolean(created)}
      />
      <p className="text-secondary text-xs">
        Anyone with the link can view this limited outfit snapshot. The link
        expires after seven days.
      </p>
      {url && (
        <>
          <label className="block text-sm font-medium" htmlFor="share-link">
            Share link
          </label>
          <input
            id="share-link"
            className="border-border bg-background mt-2 w-full rounded-lg border px-3 py-3 text-xs"
            value={url}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
          <a
            className="text-primary block text-sm break-all underline"
            href={created?.path}
            target="_blank"
            rel="noreferrer"
          >
            Open public page
          </a>
        </>
      )}
      {!created ? (
        <button
          className="bg-primary text-primary-foreground min-h-11 w-full rounded-lg px-5 text-sm font-medium disabled:opacity-60"
          type="button"
          disabled={pending}
          onClick={() => void create()}
        >
          {pending ? "Creating link..." : "Create share link"}
        </button>
      ) : (
        <div className="grid gap-3">
          <button
            className="bg-primary text-primary-foreground min-h-11 rounded-lg px-5 text-sm font-medium"
            type="button"
            onClick={() => void copy()}
          >
            Copy link
          </button>
          <button
            className="border-border min-h-11 rounded-lg border px-5 text-sm font-medium disabled:opacity-60"
            type="button"
            disabled={pending}
            onClick={() => void revoke()}
          >
            {pending ? "Revoking..." : "Revoke link"}
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className="text-primary text-sm">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <Link
        className="text-primary inline-flex min-h-11 items-center text-sm underline"
        href={`/saved-looks/${savedLookId}`}
      >
        Back to saved look
      </Link>
    </aside>
  );
}
