"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, CalendarDays, Check, CloudUpload, ImagePlus, Info, LoaderCircle, Sparkles, X } from "lucide-react";
import { MAX_INSPIRATION_BYTES, supportedImageTypes } from "../schema";

type UploadResponse = {
  data?: { assetId: string; uploadUrl: string; uploadToken: string };
  error?: string | { code?: string };
};
type AnalyzeResponse = { data?: { lookId: string }; error?: string | { code?: string } };

function responseCode(error: UploadResponse["error"]) {
  return typeof error === "string" ? error : error?.code;
}

const errorCopy: Record<string, string> = {
  INVALID_UPLOAD: "Choose a JPG, PNG, or WebP image under 10 MB.",
  UPLOAD_PREPARATION_FAILED: "We could not prepare a secure upload. Please try again.",
  MUSE_NOT_CONFIGURED: "Image analysis is unavailable right now. Your image has not been analyzed.",
  MUSE_AUTH_FAILED: "The image analysis provider rejected its credentials. Please try again later.",
  MUSE_RATE_LIMITED: "The image analysis provider is busy. Wait a moment, then retry.",
  MUSE_TIMEOUT: "Image analysis took too long. Your upload is safe; please retry.",
  DEMO_WRITES_DISABLED: "Analysis is temporarily unavailable for this workspace.",
  ASSET_NOT_UPLOADED: "The image did not finish uploading. Please try again.",
  DATABASE_UNAVAILABLE: "We could not save this look. Please try again in a moment.",
};

export function CreateLookFlow() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [occasion, setOccasion] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "analyzing">("idle");
  const [error, setError] = useState("");

  function selectFile(next: File | undefined) {
    setError("");
    if (!next) return;
    if (!(supportedImageTypes as readonly string[]).includes(next.type)) {
      setError("That file type is not supported. Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (next.size > MAX_INSPIRATION_BYTES) {
      setError("This image is larger than 10 MB. Choose a smaller image to continue.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    selectFile(event.dataTransfer.files?.[0]);
  }

  async function beginAnalysis() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    try {
      setStage("uploading");
      const preparedResponse = await fetch("/api/inspiration/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, byteSize: file.size }),
      });
      const prepared = (await preparedResponse.json()) as UploadResponse;
      if (!preparedResponse.ok || !prepared.data) throw new Error(responseCode(prepared.error) ?? "UPLOAD_PREPARATION_FAILED");

      const storageResponse = await fetch(prepared.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type, "x-upsert": "false" },
        body: file,
      });
      if (!storageResponse.ok) throw new Error("ASSET_NOT_UPLOADED");

      setStage("analyzing");
      const analysisResponse = await fetch("/api/inspiration/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: prepared.data.assetId, occasion: occasion.trim() }),
      });
      const analysis = (await analysisResponse.json()) as AnalyzeResponse;
      if (!analysisResponse.ok || !analysis.data?.lookId) throw new Error(responseCode(analysis.error) ?? "ANALYSIS_FAILED");
      router.push(`/looks/${analysis.data.lookId}`);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : "UPLOAD_PREPARATION_FAILED";
      setError(errorCopy[code] ?? (code === "ANALYSIS_FAILED" ? "The image could not be analyzed. Your upload is safe; please retry." : "Something interrupted the upload. Check your connection and try again."));
      setBusy(false);
      setStage("idle");
    }
  }

  return (
    <section className="studio-page create-page">
      <div className="studio-breadcrumb"><span>Studio</span><span aria-hidden="true">/</span><strong>Begin with an inspiration</strong></div>
      <div className="create-heading-row">
        <div><p className="eyebrow">Your next look starts somewhere</p><h1>Begin with an <em>inspiration.</em></h1><p className="studio-lede">Upload an outfit image or start with the details you remember.</p></div>
        <div className="upload-editorial" aria-hidden="true"><span className="editorial-sun" /><span className="editorial-cloth cloth-one" /><span className="editorial-cloth cloth-two" /><span className="editorial-thread" /><Sparkles size={20} /></div>
      </div>

      <div className="upload-layout">
        <section className="upload-panel">
          <div className="panel-kicker"><Sparkles size={16} aria-hidden="true" /> Bring a look you want to recreate</div>
          <h2>{file ? "Your inspiration is ready." : "Drop your image here"}</h2>
          <div className={`drop-zone ${preview ? "drop-zone-has-file" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
            {preview ? (
              <>
                {/* This is the original reference image, not a segmented garment image. */}
                <Image className="upload-preview" src={preview} width={1000} height={800} unoptimized alt="Selected outfit inspiration" />
                <div className="preview-caption"><span>{file?.name}</span><button className="icon-button" type="button" aria-label="Remove selected image" onClick={() => { setFile(null); URL.revokeObjectURL(preview); setPreview(""); }}><X size={16} /></button></div>
              </>
            ) : (
              <div className="drop-empty"><CloudUpload size={42} strokeWidth={1.3} aria-hidden="true" /><strong>Drag and drop your image here</strong><span>or choose a file from your device</span></div>
            )}
          </div>
          <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} aria-label="Choose outfit inspiration image" />
          <div className="upload-actions">
            <button className="button button-primary upload-choose" type="button" onClick={() => inputRef.current?.click()} disabled={busy}><ImagePlus size={17} aria-hidden="true" /> {file ? "Replace image" : "Choose image"}</button>
            <p className="format-hint">JPG, PNG, or WebP <span aria-hidden="true">·</span> Up to 10 MB</p>
          </div>
          {error && <p className="inline-error" role="alert">{error}</p>}
          {busy && <div className="upload-progress" role="status" aria-live="polite"><LoaderCircle className="spin" size={17} aria-hidden="true" /><span>{stage === "uploading" ? "Uploading your image securely…" : "Reading the visible outfit details…"}</span></div>}
        </section>

        <aside className="context-panel">
          <div className="context-panel-title"><span className="sparkle-seal"><Sparkles size={17} aria-hidden="true" /></span><h2>A little context helps.</h2></div>
          <label htmlFor="occasion">Occasion <span>(optional)</span></label>
          <div className="select-wrap"><CalendarDays size={17} aria-hidden="true" /><select id="occasion" value={occasion} onChange={(event) => setOccasion(event.target.value)} disabled={busy}>
            <option value="">Choose an occasion</option><option>Everyday</option><option>Work</option><option>Evening</option><option>Weekend</option><option>Special occasion</option>
          </select></div>
          <div className="context-divider" />
          <div className="context-note"><Info size={17} aria-hidden="true" /><p>Review the detected garment descriptions before we compare them with your wardrobe. Style preferences are optional.</p></div>
          <div className="privacy-note"><span className="privacy-icon">i</span><p>This shared demo analyzes the image you choose with the configured provider. Avoid uploading sensitive personal photos.</p></div>
          <a className="button button-outline preferences-link" href="/preferences">Set style preferences <ArrowRight size={16} aria-hidden="true" /></a>
        </aside>
      </div>

      <div className="create-bottom-row"><div className="journey-progress" aria-label="Step 1 of 3"><span className="journey-step current"><i>01</i> Inspiration</span><span className="journey-line" /><span className="journey-step"><i>02</i> Review</span><span className="journey-line" /><span className="journey-step"><i>03</i> Outfit ideas</span></div>
        <button className="button button-primary button-continue" type="button" onClick={beginAnalysis} disabled={!file || busy}>{busy ? "Working…" : "Analyze inspiration"}{busy ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}</button>
      </div>
      <p className="upload-reassurance"><Check size={14} aria-hidden="true" /> Your original image is analyzed as a whole. Garment details are returned as editable text descriptions.</p>
    </section>
  );
}
