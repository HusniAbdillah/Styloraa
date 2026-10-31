"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, CircleHelp, LoaderCircle, Pencil, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { garmentCategories } from "../schema";

type JsonRecord = Record<string, unknown>;
type Piece = {
  id: string; name: string; category: string; attributes: JsonRecord; provenance: JsonRecord;
  corrections: JsonRecord; confidence: number | null; source_type: string; position: number;
};
type WardrobeItem = { id: string; name: string; category: string; color: string | null };
type Match = {
  id: string; piece_id: string; wardrobe_item_id: string | null; match_type: "owned_match" | "wardrobe_alternative" | "missing";
  rationale: string; confidence: number | null; wardrobe_item?: WardrobeItem | null;
};
type OutfitItem = {
  id: string; slot_id: string; piece_id: string | null; item_kind: "owned" | "missing" | "product";
  wardrobe_item_id: string | null; missing_brief: string | null; rationale: string; position: number;
  wardrobe_item?: WardrobeItem | null;
};
type OutfitOption = {
  id: string; option_type: "closest" | "from_wardrobe" | "fresh_alternative"; title: string;
  rationale: string; inputs_used: JsonRecord; uncertainty: string; source_type: string; items: OutfitItem[];
};
type Look = {
  id: string; title: string; notes: string | null; revision: number; source_type: string;
  pieces: Piece[]; matches: Match[]; options: OutfitOption[];
};
type ApiResult<T> = { data?: T; error?: { code?: string; message?: string } };

const optionOrder: OutfitOption["option_type"][] = ["closest", "from_wardrobe", "fresh_alternative"];
const optionLabels: Record<OutfitOption["option_type"], string> = {
  closest: "Closest to the inspiration", from_wardrobe: "From your wardrobe", fresh_alternative: "A fresh alternative",
};
const matchLabels: Record<Match["match_type"], string> = {
  owned_match: "In your wardrobe", wardrobe_alternative: "A wardrobe alternative", missing: "Missing from wardrobe",
};

function errorMessage(code?: string) {
  const messages: Record<string, string> = {
    LOOK_NOT_FOUND: "This look could not be found. It may have expired or been removed.",
    DATABASE_UNAVAILABLE: "Your look could not be loaded. Check the connection and try again.",
    MUSE_NOT_CONFIGURED: "Fashion analysis is not configured right now. No generated result has been added.",
    MUSE_AUTH_FAILED: "The fashion analysis provider rejected its credentials. Try again later.",
    MUSE_RATE_LIMITED: "The fashion analysis provider is busy. Wait a moment, then try again.",
    MUSE_TIMEOUT: "Analysis took too long. Your reviewed pieces are safe; retry when ready.",
    REVISION_CONFLICT: "This look changed in another tab. We reloaded the latest version; review it before continuing.",
    NO_ACTIVE_PIECES: "Add at least one garment description before matching.",
    MATCHES_REQUIRED: "Wardrobe context needs to be refreshed before outfit ideas can be generated.",
    MUSE_INVALID_OUTPUT: "The provider returned an incomplete response. No partial recommendations were saved.",
  };
  return messages[code ?? ""] ?? "We could not complete that step. Please try again.";
}

function textAttribute(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === "string").join(", ");
  return "";
}

function signals(option: OutfitOption) {
  const used = option.inputs_used.profileSignalsUsed;
  return Array.isArray(used) && used.length ? used.filter((signal): signal is string => typeof signal === "string") : [];
}

async function fetchLook(lookId: string) {
  const response = await fetch(`/api/looks/${lookId}`, { cache: "no-store" });
  const result = (await response.json()) as ApiResult<Look>;
  if (!response.ok || !result.data) throw new Error(result.error?.code ?? "DATABASE_UNAVAILABLE");
  return result.data;
}

export function LookStudio({ lookId, selectedOptionId }: { lookId: string; selectedOptionId: string | null }) {
  const router = useRouter();
  const [look, setLook] = useState<Look | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editorId, setEditorId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Piece | null>(null);
  const [selectedOption, setSelectedOption] = useState(selectedOptionId);
  const [stage, setStage] = useState("");
  const editorDialogRef = useRef<HTMLDialogElement>(null);

  const reload = useCallback(async () => {
    try {
      setLook(await fetchLook(lookId));
      setError("");
    } catch (caught) {
      setError(errorMessage(caught instanceof Error ? caught.message : undefined));
    } finally { setLoading(false); }
  }, [lookId]);

  useEffect(() => {
    let active = true;
    fetchLook(lookId).then((result) => {
      if (active) { setLook(result); setError(""); }
    }).catch((caught: unknown) => {
      if (active) setError(errorMessage(caught instanceof Error ? caught.message : undefined));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [lookId]);
  useEffect(() => {
    const dialog = editorDialogRef.current;
    if (!dialog || !editorId || dialog.open) return;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, [editorId]);

  const pieceById = useMemo(() => new Map((look?.pieces ?? []).map((piece) => [piece.id, piece])), [look?.pieces]);
  const options = useMemo(() => [...(look?.options ?? [])].sort((a, b) => optionOrder.indexOf(a.option_type) - optionOrder.indexOf(b.option_type)), [look?.options]);

  function openEditor(piece: Piece | null) {
    const id = piece?.id ?? "new-piece";
    setEditorId(id);
    setDraft(piece ? { ...piece, attributes: { ...piece.attributes } } : {
      id: "", name: "", category: "top", attributes: { colors: [], styleTags: [] }, provenance: {}, corrections: {}, confidence: null, source_type: "manual", position: look?.pieces.length ?? 0,
    });
  }

  async function savePieces(next: Piece[], message = "") {
    if (!look) return;
    setBusy(true); setStage("Saving your review…"); setError("");
    try {
      const response = await fetch(`/api/looks/${lookId}/pieces`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRevision: look.revision, pieces: next.map((piece) => ({
          ...(piece.id ? { id: piece.id } : {}), name: piece.name, category: piece.category,
          attributes: piece.attributes, provenance: piece.provenance,
          corrections: { ...piece.corrections, userEdited: true }, confidence: piece.confidence,
          sourceType: piece.source_type === "live" ? "live" : "manual",
        })) }),
      });
      const result = (await response.json()) as ApiResult<Look>;
      if (!response.ok || !result.data) throw new Error(result.error?.code ?? "PERSISTENCE_FAILED");
      setLook(result.data); setEditorId(null); setDraft(null); setError(message);
    } catch (caught) {
      if (caught instanceof Error && caught.message === "REVISION_CONFLICT") {
        await reload(); setError(errorMessage("REVISION_CONFLICT"));
      } else setError(errorMessage(caught instanceof Error ? caught.message : undefined));
    } finally { setBusy(false); setStage(""); }
  }

  function setDraftField(key: string, value: string) {
    setDraft((current) => {
      if (!current) return null;
      if (key === "name" || key === "category") return { ...current, [key]: value };
      if (key === "colors") return { ...current, attributes: { ...current.attributes, colors: value.split(",").map((part) => part.trim()).filter(Boolean) } };
      if (key === "styleTags") return { ...current, attributes: { ...current.attributes, styleTags: value.split(",").map((part) => part.trim()).filter(Boolean) } };
      return { ...current, attributes: { ...current.attributes, [key]: value || null } };
    });
  }

  function removePiece(pieceId: string) {
    if (!look) return;
    void savePieces(look.pieces.filter((piece) => piece.id !== pieceId));
  }

  async function generateOutfits() {
    if (!look || busy) return;
    setBusy(true); setError("");
    try {
      setStage("Comparing your pieces with the wardrobe…");
      const matchResponse = await fetch(`/api/looks/${lookId}/matches`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision: look.revision }) });
      const matched = (await matchResponse.json()) as ApiResult<Look>;
      if (!matchResponse.ok || !matched.data) throw new Error(matched.error?.code ?? "MATCH_FAILED");
      setLook(matched.data);
      setStage("Building three explained outfit directions…");
      const optionResponse = await fetch(`/api/looks/${lookId}/outfit-options`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expectedRevision: matched.data.revision }) });
      const generated = (await optionResponse.json()) as ApiResult<Look>;
      if (!optionResponse.ok || !generated.data) throw new Error(generated.error?.code ?? "ANALYSIS_FAILED");
      setLook(generated.data);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : undefined;
      setError(errorMessage(code));
      if (code === "REVISION_CONFLICT") await reload();
    } finally { setBusy(false); setStage(""); }
  }

  function chooseOption(optionId: string) {
    setSelectedOption(optionId);
    router.replace(`/looks/${lookId}?option_id=${optionId}`, { scroll: false });
  }

  if (loading) return <section className="studio-state" role="status"><LoaderCircle className="spin" size={22} /><span>Opening your look…</span></section>;
  if (!look) return <section className="studio-page"><div className="studio-breadcrumb"><Link href="/create">Studio</Link><span>/</span><strong>Look unavailable</strong></div><div className="state-panel"><CircleAlert size={24} /><h1>We could not open this look.</h1><p>{error}</p><button className="button button-outline" onClick={() => void reload()}>Try again</button></div></section>;

  const hasOptions = options.length === 3;
  const selected = options.find((option) => option.id === selectedOption) ?? null;

  return (
    <section className="studio-page look-page">
      <div className="studio-breadcrumb"><Link href="/create">Studio</Link><span>/</span><strong>{hasOptions ? "Three ways to make it yours" : "Review the pieces"}</strong></div>
      <div className="look-heading"><div><p className="eyebrow">{hasOptions ? "Same inspiration, different directions" : "Keep the details you trust"}</p><h1>{hasOptions ? "Three outfit ideas for you." : "Review the pieces."}<span className="heading-sparkle" aria-hidden="true">✦</span></h1><p className="studio-lede">{hasOptions ? "Each direction has a clear point of view and a reason behind the recommendation." : "Correct any description that does not match what you see. We will use these details to find your wardrobe context."}</p></div>
        <div className="step-ribbon" aria-label={hasOptions ? "Step 3 of 3" : "Step 2 of 3"}><span className="done"><Check size={13} /> Inspiration</span><span className="done"><Check size={13} /> Review</span><span className={hasOptions ? "done" : "active"}>{hasOptions ? <Check size={13} /> : "03"} Outfit ideas</span></div>
      </div>

      {!hasOptions ? (
        <>
          <div className="review-layout">
            <section className="pieces-panel">
              <div className="pieces-panel-head"><div><span className="panel-icon"><Sparkles size={18} /></span><h2>Detected descriptions</h2></div><span className="count-pill">{look.pieces.length} {look.pieces.length === 1 ? "piece" : "pieces"}</span></div>
              {look.pieces.length ? <div className="piece-list">{look.pieces.map((piece, index) => (
                <article className="piece-row" key={piece.id}>
                  <div className="piece-number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="piece-content"><div className="piece-title-line"><h3>{piece.name}</h3><span className="category-label">{piece.category}</span></div>
                    <p>{[textAttribute(piece.attributes.colors), textAttribute(piece.attributes.fit), textAttribute(piece.attributes.apparentMaterial) || textAttribute(piece.attributes.texture), textAttribute(piece.attributes.silhouette)].filter(Boolean).join(" · ")}</p>
                    <div className="piece-evidence"><span className="confidence-mark">{piece.confidence !== null && piece.confidence < 0.65 ? "Lower confidence" : "Visual estimate"}{piece.confidence !== null ? ` · ${Math.round(piece.confidence * 100)}%` : ""}</span><span>{textAttribute(piece.provenance.evidence) || "Detected from the visible outfit."}</span></div>
                    {textAttribute(piece.provenance.uncertainty) && <p className="piece-uncertainty"><CircleHelp size={12} /> {textAttribute(piece.provenance.uncertainty)}</p>}
                  </div>
                  <div className="piece-actions"><button className="button button-small button-outline" type="button" onClick={() => openEditor(piece)}><Pencil size={14} /> Edit</button><button className="text-action" type="button" onClick={() => removePiece(piece.id)} disabled={busy}><Trash2 size={14} /> Remove</button></div>
                </article>
              ))}</div> : <div className="empty-state"><CircleHelp size={23} /><h3>No active pieces</h3><p>Add a description to continue with wardrobe matching.</p></div>}
              <button className="button button-add-piece" type="button" onClick={() => openEditor(null)}><Plus size={17} /> Add a piece</button>
            </section>

            <aside className="review-aside"><div className="aside-title"><span className="sparkle-seal"><Sparkles size={16} /></span><h2>Review with confidence.</h2></div><p className="aside-body">Stylora describes the visible garments in text. You stay in control of the details before anything is matched.</p>
              <div className="review-principles"><div><span>01</span><p><strong>Visible evidence</strong><br />Descriptions focus on what the image shows.</p></div><div><span>02</span><p><strong>Honest uncertainty</strong><br />Material and fit remain estimates when unclear.</p></div><div><span>03</span><p><strong>Your correction</strong><br />Edits replace the detected details for this look.</p></div></div>
              <Link className="button button-outline preferences-link" href="/preferences">Review style preferences <ArrowRight size={16} /></Link>
            </aside>
          </div>

          {editorId && draft && <dialog ref={editorDialogRef} className="piece-editor" aria-labelledby="piece-editor-title" onClose={() => { setEditorId(null); setDraft(null); }}><div className="editor-head"><span className="sparkle-seal"><Pencil size={15} /></span><div><h2 id="piece-editor-title">{editorId === "new-piece" ? "Add a piece" : "Edit description"}</h2><p>Adjust the text details for this garment.</p></div><button className="icon-button" type="button" aria-label="Close editor" onClick={() => { setEditorId(null); setDraft(null); }}><span aria-hidden="true">×</span></button></div>
            <form className="editor-fields" onSubmit={(event: FormEvent) => { event.preventDefault(); if (!look || !draft) return; const next = editorId === "new-piece" ? [...look.pieces, draft] : look.pieces.map((piece) => piece.id === editorId ? draft : piece); void savePieces(next); }}>
              <label>Piece name<input value={draft.name} onChange={(event) => setDraftField("name", event.target.value)} placeholder="e.g. Relaxed ivory shirt" required maxLength={160} /></label>
              <label>Category<select value={draft.category} onChange={(event) => setDraftField("category", event.target.value)}>{garmentCategories.map((category) => <option value={category} key={category}>{category[0].toUpperCase() + category.slice(1)}</option>)}</select></label>
              <label>Color<input value={textAttribute(draft.attributes.colors)} onChange={(event) => setDraftField("colors", event.target.value)} placeholder="e.g. Ivory, charcoal" /></label>
              <label>Pattern<input value={textAttribute(draft.attributes.pattern)} onChange={(event) => setDraftField("pattern", event.target.value)} placeholder="e.g. Solid, fine stripe" /></label>
              <label>Apparent material or texture<input value={textAttribute(draft.attributes.apparentMaterial) || textAttribute(draft.attributes.texture)} onChange={(event) => setDraftField("apparentMaterial", event.target.value)} placeholder="e.g. Soft knit, likely linen" /></label>
              <label>Silhouette<input value={textAttribute(draft.attributes.silhouette)} onChange={(event) => setDraftField("silhouette", event.target.value)} placeholder="e.g. Straight, A-line" /></label>
              <label>Fit<input value={textAttribute(draft.attributes.fit)} onChange={(event) => setDraftField("fit", event.target.value)} placeholder="e.g. Relaxed, tailored" /></label>
              <label>Length<input value={textAttribute(draft.attributes.length)} onChange={(event) => setDraftField("length", event.target.value)} placeholder="Optional" /></label>
              <label>Cut<input value={textAttribute(draft.attributes.cut)} onChange={(event) => setDraftField("cut", event.target.value)} placeholder="Optional" /></label>
              <label>Occasion<input value={textAttribute(draft.attributes.occasion)} onChange={(event) => setDraftField("occasion", event.target.value)} placeholder="e.g. Everyday, work" /></label>
              <label>Style tags<input value={textAttribute(draft.attributes.styleTags)} onChange={(event) => setDraftField("styleTags", event.target.value)} placeholder="e.g. Minimal, polished" /></label>
              <div className="editor-actions"><button type="button" className="button button-outline" onClick={() => { setEditorId(null); setDraft(null); }}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />} Save changes</button></div>
            </form>
          </dialog>}

          <div className="flow-footer"><Link className="button button-outline" href="/create"><ArrowLeft size={16} /> Back to inspiration</Link><button className="button button-primary" type="button" onClick={generateOutfits} disabled={busy || look.pieces.length === 0}>{busy ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}{busy ? stage : "Match wardrobe & create outfits"}<ArrowRight size={16} /></button></div>
        </>
      ) : (
        <>
          {error && <div className="inline-error global-error" role="alert"><CircleAlert size={17} />{error}<button type="button" className="text-action" onClick={() => void generateOutfits()}>Try again</button></div>}
          {busy && <div className="upload-progress" role="status"><LoaderCircle className="spin" size={17} />{stage}</div>}
          <section className="wardrobe-context" aria-labelledby="wardrobe-context-title"><div className="wardrobe-context-head"><div><p className="eyebrow">The wardrobe behind the ideas</p><h2 id="wardrobe-context-title">A clear view of what you have.</h2></div><Link href="/wardrobe" className="text-link">Open wardrobe <ArrowRight size={15} /></Link></div>
            <div className="match-summary-grid">{(["owned_match", "wardrobe_alternative", "missing"] as const).map((type) => {
              const matches = look.matches.filter((match) => match.match_type === type);
              const label = type === "owned_match" ? "In your wardrobe" : type === "wardrobe_alternative" ? "Similar alternatives" : "Missing pieces";
              return <div className={`match-summary match-${type}`} key={type}><span className="match-summary-count">{String(matches.length).padStart(2, "0")}</span><div><h3>{label}</h3><p>{type === "owned_match" ? "Pieces that align closely with the reference." : type === "wardrobe_alternative" ? "A related option already in your wardrobe." : "Pieces not found in the current wardrobe."}</p></div></div>;
            })}</div>
            <div className="match-detail-list">{look.matches.map((match) => {
              const piece = pieceById.get(match.piece_id);
              const itemName = match.wardrobe_item?.name;
              return <article className={`match-detail match-${match.match_type}`} key={match.id}><div className="match-type-mark">{match.match_type === "owned_match" ? <Check size={17} /> : match.match_type === "missing" ? <Plus size={17} /> : <RefreshCw size={16} />}</div><div className="match-detail-copy"><div className="match-label-line"><span>{matchLabels[match.match_type]}</span><span>{piece?.category ?? "Piece"}</span></div><h3>{piece?.name ?? "Outfit piece"}{itemName ? <small>{match.match_type === "owned_match" ? ` · ${itemName}` : ` · closest: ${itemName}`}</small> : null}</h3><p>{match.rationale}</p></div></article>;
            })}</div>
            {look.matches.length === 0 && <p className="empty-state-inline">No wardrobe matches were returned. You can retry outfit ideas.</p>}
          </section>

          <div className="recommendations-intro"><div><p className="eyebrow">One reference, three points of view</p><h2>Choose the direction that feels like you.</h2></div></div>
          <div className="outfit-grid">{options.map((option, index) => {
            const isSelected = selectedOption === option.id;
            const usedSignals = signals(option);
            const sortedItems = [...option.items].sort((a,b) => a.position - b.position);
            const leadPiece = sortedItems.find((item) => item.piece_id)?.piece_id;
            return <article className={`outfit-card outfit-card-${index + 1} ${isSelected ? "outfit-selected" : ""}`} key={option.id}>
              <div className="outfit-art" aria-hidden="true"><div className="art-index">0{index + 1}</div><span className="art-orbit" /><div className="art-composition"><span className="art-line art-line-a"/><span className="art-line art-line-b"/><span className="art-piece-shape"/><span className="art-piece-leg"/><span className="art-piece-leg second"/><span className="art-bag-shape"/></div><span className="art-caption">Composition guide</span></div>
              <div className="outfit-card-content"><div className="outfit-type">{optionLabels[option.option_type]}</div><h3>{option.title}</h3><p className="outfit-summary">{option.rationale}</p>
                <div className="option-pieces"><span className="detail-overline">THE PIECES</span>{sortedItems.length ? sortedItems.map((item) => {
                  const referencePiece = item.piece_id ? pieceById.get(item.piece_id) : undefined;
                  const itemTitle = item.wardrobe_item?.name ?? referencePiece?.name ?? item.missing_brief ?? item.slot_id.replaceAll("_", " ");
                  return <div className="option-piece" key={item.id}><span className={`ownership-dot ${item.item_kind}`} /><span><strong>{itemTitle}</strong><small>{item.rationale}</small></span><em>{item.item_kind === "owned" ? "Owned" : item.item_kind === "missing" ? "Missing" : "Suggested"}</em></div>;
                }) : <p className="empty-owned-note">No wardrobe pieces were available for this option. Add items to your wardrobe for a more complete combination.</p>}</div>
                <div className="why-panel"><div className="why-title"><Sparkles size={15} /><strong>Personalization context</strong></div><div className="signals-used"><span>Profile signals used</span><strong>{usedSignals.length ? usedSignals.join(", ") : "None — personalization was not applied"}</strong></div>{option.uncertainty && <p className="uncertainty-note"><CircleHelp size={13} /> {option.uncertainty}</p>}</div>
                <button className={`button ${isSelected ? "button-selected" : "button-primary"} select-look-button`} type="button" aria-pressed={isSelected} onClick={() => chooseOption(option.id)}>{isSelected ? <Check size={16} /> : <ArrowRight size={16} />}{isSelected ? "Selected for your look" : "Choose this look"}</button>
              </div>
              {leadPiece && <span className="sr-only">Reference includes {pieceById.get(leadPiece)?.name}</span>}
            </article>;
          })}</div>
          {selected && <section className="selected-look-panel" aria-live="polite"><span className="selected-check"><Check size={16} /></span><div><span className="detail-overline">YOUR SELECTED DIRECTION</span><h3>{selected.title}</h3><p>{selected.rationale}</p></div><Link href={`/looks/${lookId}?option_id=${selected.id}`} className="button button-outline">Open this look <ArrowRight size={15} /></Link></section>}
          <div className="flow-footer"><Link className="button button-outline" href="/create"><ArrowLeft size={16} /> Start another look</Link><span className="footer-disclosure">Every outfit idea is based on the saved garment descriptions and available wardrobe data.</span></div>
        </>
      )}

      {error && !hasOptions && <div className="inline-error global-error" role="alert"><CircleAlert size={17} />{error}<button type="button" className="text-action" onClick={() => void reload()}>Reload</button></div>}
      {busy && <div className="visually-hidden" role="status" aria-live="polite">{stage}</div>}
    </section>
  );
}
