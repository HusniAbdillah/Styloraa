export type MissingAddition = {
  name: string;
  category: string;
  rationale: string;
  related_item_ids: string[];
  uncertainty: string;
};
export type StudioItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  available: boolean;
  imageUrl?: string | null;
};

export type CapsuleBrief = {
  purpose: string;
  notes: string;
  style_preferences?: string;
  fit_preferences?: string;
  color_preferences?: string;
  avoid?: string;
};

export type CapsuleDetail = {
  missing_additions: MissingAddition[];
  id: string;
  title: string;
  description: string;
  brief: CapsuleBrief;
  timeframe: string | null;
  season: string | null;
  occasion: string | null;
  revision: number;
  items: StudioItem[];
};

export type CapsuleSummary = {
  id: string;
  title: string;
  description: string;
  occasion: string | null;
  season: string | null;
  timeframe: string | null;
  item_count: number;
  outfit_count: number;
  item_ids: string[];
};

export type StudioOutfit = {
  id: string;
  title: string;
  rationale: string;
  uncertainty: string;
  source_type: string;
  source_revision: number;
  items: StudioItem[];
};

export type Combination = {
  title: string;
  rationale: string;
  uncertainty: string;
  item_ids: string[];
};

export type StudioCapabilities = { writes: boolean; textAi: boolean };
