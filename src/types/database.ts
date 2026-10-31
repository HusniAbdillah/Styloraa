/**
 * Bootstrap contract matching supabase/migrations/20261031055618_shared_workspace.sql.
 * Replace using `pnpm db:types` after starting local Supabase or selecting a project.
 * This initial contract is NOT claimed to be CLI-generated.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: [];
};
type WorkspaceRow = { id: string; name: string; created_at: string };
type WardrobeRow = { id: string; workspace_id: string; name: string; category: string; color: string; image_path: string | null; created_at: string };
type PreferencesRow = { workspace_id: string; style_notes: string; updated_at: string };
type LookRow = { id: string; workspace_id: string; title: string; notes: string; is_saved: boolean; created_at: string };
type LookItemRow = { look_id: string; wardrobe_item_id: string; workspace_id: string; position: number };
type CapsuleRow = { id: string; workspace_id: string; title: string; description: string; created_at: string };
type CapsuleItemRow = { capsule_id: string; wardrobe_item_id: string; workspace_id: string };
type AiJobRow = { id: string; workspace_id: string; kind: string; status: string; input: Json; output: Json | null; provider_job_id: string | null; error_code: string | null; created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      workspaces: Table<WorkspaceRow, "name">;
      wardrobe_items: Table<WardrobeRow, "workspace_id" | "name" | "category">;
      user_preferences: Table<PreferencesRow, "workspace_id">;
      looks: Table<LookRow, "workspace_id" | "title">;
      look_items: Table<LookItemRow, "workspace_id" | "look_id" | "wardrobe_item_id">;
      capsules: Table<CapsuleRow, "workspace_id" | "title">;
      capsule_items: Table<CapsuleItemRow, "workspace_id" | "capsule_id" | "wardrobe_item_id">;
      ai_jobs: Table<AiJobRow, "workspace_id" | "kind">;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
