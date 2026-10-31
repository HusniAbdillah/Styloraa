import type { Json } from "@/types/database";

type RecordValue = Record<string, unknown>;
type Piece = { id: string; name: string; category: string; attributes: Json; confidence: number | null };
type WardrobeItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  subcategory: string | null;
  attributes: Json;
  inferred_attributes: Json;
  attribute_provenance: Json;
};

export type RankedMatch = {
  pieceId: string;
  matchType: "owned_match" | "wardrobe_alternative" | "missing";
  wardrobeItemId: string | null;
  confidence: number;
  sharedAttributes: RecordValue;
  differences: RecordValue;
  sourceType: "live" | "sample";
};

export function asRecord(value: unknown): RecordValue {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as RecordValue
    : {};
}

function values(value: unknown) {
  return (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value])
    .map((entry) => String(entry).trim().toLowerCase()).filter(Boolean);
}

function attributes(item: WardrobeItem) {
  return { ...asRecord(item.inferred_attributes), ...asRecord(item.attributes) };
}

function pieceAttributes(piece: Piece) {
  return asRecord(piece.attributes);
}

function colorValues(item: WardrobeItem) {
  return values([item.color, ...values(attributes(item).colors), attributes(item).primaryColor]);
}

function compareField(reference: unknown, candidate: unknown) {
  const left = values(reference);
  const right = values(candidate);
  if (!left.length || !right.length) return null;
  const shared = left.filter((value) => right.some((other) => other === value || other.includes(value) || value.includes(other)));
  return { shared, differences: left.filter((value) => !shared.includes(value)) };
}

function profileForSample(item: WardrobeItem) {
  return asRecord(item.attribute_provenance).demo_sample === true;
}

export function rankWardrobeMatches(pieces: Piece[], inventory: WardrobeItem[]): RankedMatch[] {
  return pieces.map((piece) => {
    const reference = pieceAttributes(piece);
    const candidates = inventory.filter((item) => item.category === piece.category).map((item) => {
      const candidate = attributes(item);
      const comparisons = [
        { key: "color", ref: reference.colors ?? reference.primaryColor, candidate: colorValues(item), weight: 0.22 },
        { key: "pattern", ref: reference.pattern, candidate: candidate.pattern, weight: 0.12 },
        { key: "materialTexture", ref: [reference.apparentMaterial, reference.texture], candidate: [candidate.material, candidate.texture], weight: 0.14 },
        { key: "silhouette", ref: reference.silhouette, candidate: candidate.silhouette, weight: 0.16 },
        { key: "fit", ref: reference.fit, candidate: candidate.fit, weight: 0.14 },
        { key: "length", ref: reference.length, candidate: candidate.length, weight: 0.08 },
        { key: "styleTags", ref: reference.styleTags, candidate: candidate.styleTags, weight: 0.14 },
      ];
      const shared: RecordValue = {};
      const differences: RecordValue = {};
      let score = 0.35;
      let evidence = 0;
      for (const comparison of comparisons) {
        const result = compareField(comparison.ref, comparison.candidate);
        if (!result) continue;
        evidence += 1;
        if (result.shared.length) {
          score += comparison.weight;
          shared[comparison.key] = result.shared;
        } else {
          differences[comparison.key] = result.differences;
        }
      }
      if (!evidence) score = 0.35;
      return { item, score: Math.min(1, score), shared, differences };
    }).sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (!best || best.score < 0.3) {
      return {
        pieceId: piece.id,
        matchType: "missing",
        wardrobeItemId: null,
        confidence: best ? Math.max(0, 1 - best.score) : 1,
        sharedAttributes: {},
        differences: best?.differences ?? {},
        sourceType: inventory.some(profileForSample) ? "sample" : "live",
      };
    }
    return {
      pieceId: piece.id,
      matchType: best.score >= 0.78 ? "owned_match" : "wardrobe_alternative",
      wardrobeItemId: best.item.id,
      confidence: best.score,
      sharedAttributes: best.shared,
      differences: best.differences,
      sourceType: profileForSample(best.item) ? "sample" : "live",
    };
  });
}

export function profileContext(preferences: RecordValue | null) {
  if (!preferences) return {};
  const styleDna = asRecord(preferences.style_dna);
  const fitPreferences = asRecord(preferences.fit_preferences);
  const bodyProfile = asRecord(preferences.body_profile);
  return {
    styleNotes: preferences.style_notes || "",
    styleDna,
    fitPreferences,
    bodyProfile,
  };
}

export function availableProfileSignals(context: RecordValue) {
  const signals: string[] = [];
  const styleDna = asRecord(context.styleDna);
  const fitPreferences = asRecord(context.fitPreferences);
  const bodyProfile = asRecord(context.bodyProfile);
  if (Object.keys(styleDna).length || String(context.styleNotes ?? "").trim()) signals.push("styleDna");
  if (styleDna.undertone) signals.push("undertone");
  if (styleDna.skinDepth) signals.push("skinDepth");
  if (Object.keys(fitPreferences).length) signals.push("fitPreferences");
  if (Object.keys(bodyProfile).length) signals.push("bodyProfile");
  return [...new Set(signals)];
}
