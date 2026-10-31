export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      ai_jobs: {
        Row: {
          capsule_outfit_id: string | null;
          completed_at: string | null;
          consent_acknowledged_at: string | null;
          created_at: string;
          error_code: string | null;
          id: string;
          input: NonNullable<Json>;
          input_asset_id: string | null;
          kind: string;
          limitations_acknowledged_at: string | null;
          look_id: string | null;
          model: string | null;
          model_source: string | null;
          option_id: string | null;
          output: Json | null;
          output_asset_id: string | null;
          preview_mode: string | null;
          product_id: string | null;
          provider: string | null;
          provider_job_id: string | null;
          source_revision: number | null;
          source_type: string;
          status: string;
          updated_at: string;
          wardrobe_item_id: string | null;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          capsule_outfit_id?: string | null;
          completed_at?: string | null;
          consent_acknowledged_at?: string | null;
          created_at?: string;
          error_code?: string | null;
          id?: string;
          input?: NonNullable<Json>;
          input_asset_id?: string | null;
          kind: string;
          limitations_acknowledged_at?: string | null;
          look_id?: string | null;
          model?: string | null;
          model_source?: string | null;
          option_id?: string | null;
          output?: Json | null;
          output_asset_id?: string | null;
          preview_mode?: string | null;
          product_id?: string | null;
          provider?: string | null;
          provider_job_id?: string | null;
          source_revision?: number | null;
          source_type?: string;
          status?: string;
          updated_at?: string;
          wardrobe_item_id?: string | null;
          workspace_id: string;
        };
        Update: {
          capsule_outfit_id?: string | null;
          completed_at?: string | null;
          consent_acknowledged_at?: string | null;
          created_at?: string;
          error_code?: string | null;
          id?: string;
          input?: NonNullable<Json>;
          input_asset_id?: string | null;
          kind?: string;
          limitations_acknowledged_at?: string | null;
          look_id?: string | null;
          model?: string | null;
          model_source?: string | null;
          option_id?: string | null;
          output?: Json | null;
          output_asset_id?: string | null;
          preview_mode?: string | null;
          product_id?: string | null;
          provider?: string | null;
          provider_job_id?: string | null;
          source_revision?: number | null;
          source_type?: string;
          status?: string;
          updated_at?: string;
          wardrobe_item_id?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_jobs_workspace_id_capsule_outfit_id_fkey";
            columns: ["workspace_id", "capsule_outfit_id"];
            isOneToOne: false;
            referencedRelation: "capsule_outfits";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_input_asset_id_fkey";
            columns: ["workspace_id", "input_asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_look_id_fkey";
            columns: ["workspace_id", "look_id"];
            isOneToOne: false;
            referencedRelation: "looks";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_look_id_option_id_fkey";
            columns: ["workspace_id", "look_id", "option_id"];
            isOneToOne: false;
            referencedRelation: "outfit_options";
            referencedColumns: ["workspace_id", "look_id", "id"];
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_option_id_fkey";
            columns: ["workspace_id", "option_id"];
            isOneToOne: false;
            referencedRelation: "outfit_options";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_output_asset_id_fkey";
            columns: ["workspace_id", "output_asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_product_id_fkey";
            columns: ["workspace_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_wardrobe_item_id_fkey";
            columns: ["workspace_id", "wardrobe_item_id"];
            isOneToOne: false;
            referencedRelation: "wardrobe_items";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      assets: {
        Row: {
          bucket: string;
          byte_size: number;
          created_at: string;
          deleted_at: string | null;
          id: string;
          mime_type: string;
          source_type: string;
          storage_path: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          bucket: string;
          byte_size: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          mime_type: string;
          source_type: string;
          storage_path: string;
          workspace_id: string;
        };
        Update: {
          bucket?: string;
          byte_size?: number;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          mime_type?: string;
          source_type?: string;
          storage_path?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assets_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      capsule_items: {
        Row: {
          capsule_id: string;
          wardrobe_item_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          capsule_id: string;
          wardrobe_item_id: string;
          workspace_id: string;
        };
        Update: {
          capsule_id?: string;
          wardrobe_item_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "capsule_items_workspace_id_capsule_id_fkey";
            columns: ["workspace_id", "capsule_id"];
            isOneToOne: false;
            referencedRelation: "capsules";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "capsule_items_workspace_id_wardrobe_item_id_fkey";
            columns: ["workspace_id", "wardrobe_item_id"];
            isOneToOne: false;
            referencedRelation: "wardrobe_items";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      capsule_outfit_items: {
        Row: {
          capsule_id: string;
          outfit_id: string;
          position: number;
          wardrobe_item_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          capsule_id: string;
          outfit_id: string;
          position?: number;
          wardrobe_item_id: string;
          workspace_id: string;
        };
        Update: {
          capsule_id?: string;
          outfit_id?: string;
          position?: number;
          wardrobe_item_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "capsule_outfit_items_workspace_id_capsule_id_outfit_id_fkey";
            columns: ["workspace_id", "capsule_id", "outfit_id"];
            isOneToOne: false;
            referencedRelation: "capsule_outfits";
            referencedColumns: ["workspace_id", "capsule_id", "id"];
          },
          {
            foreignKeyName: "capsule_outfit_items_workspace_id_capsule_id_wardrobe_item_fkey";
            columns: ["workspace_id", "capsule_id", "wardrobe_item_id"];
            isOneToOne: false;
            referencedRelation: "capsule_items";
            referencedColumns: [
              "workspace_id",
              "capsule_id",
              "wardrobe_item_id",
            ];
          },
        ];
      };
      capsule_outfits: {
        Row: {
          capsule_id: string;
          created_at: string;
          id: string;
          inputs_used: NonNullable<Json>;
          rationale: string;
          source_revision: number;
          source_type: string;
          title: string;
          uncertainty: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          capsule_id: string;
          created_at?: string;
          id?: string;
          inputs_used?: NonNullable<Json>;
          rationale: string;
          source_revision: number;
          source_type: string;
          title: string;
          uncertainty?: string;
          workspace_id: string;
        };
        Update: {
          capsule_id?: string;
          created_at?: string;
          id?: string;
          inputs_used?: NonNullable<Json>;
          rationale?: string;
          source_revision?: number;
          source_type?: string;
          title?: string;
          uncertainty?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "capsule_outfits_workspace_id_capsule_id_fkey";
            columns: ["workspace_id", "capsule_id"];
            isOneToOne: false;
            referencedRelation: "capsules";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      capsules: {
        Row: {
          brief: NonNullable<Json>;
          created_at: string;
          description: string;
          id: string;
          missing_additions: NonNullable<Json>;
          occasion: string | null;
          revision: number;
          season: string | null;
          timeframe: string | null;
          title: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          brief?: NonNullable<Json>;
          created_at?: string;
          description?: string;
          id?: string;
          missing_additions?: NonNullable<Json>;
          occasion?: string | null;
          revision?: number;
          season?: string | null;
          timeframe?: string | null;
          title: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          brief?: NonNullable<Json>;
          created_at?: string;
          description?: string;
          id?: string;
          missing_additions?: NonNullable<Json>;
          occasion?: string | null;
          revision?: number;
          season?: string | null;
          timeframe?: string | null;
          title?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "capsules_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      inspiration_pieces: {
        Row: {
          attributes: NonNullable<Json>;
          category: string;
          confidence: number | null;
          corrections: NonNullable<Json>;
          created_at: string;
          id: string;
          look_id: string;
          name: string;
          position: number;
          provenance: NonNullable<Json>;
          removed_at: string | null;
          source_type: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          attributes?: NonNullable<Json>;
          category: string;
          confidence?: number | null;
          corrections?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          look_id: string;
          name: string;
          position?: number;
          provenance?: NonNullable<Json>;
          removed_at?: string | null;
          source_type: string;
          workspace_id: string;
        };
        Update: {
          attributes?: NonNullable<Json>;
          category?: string;
          confidence?: number | null;
          corrections?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          look_id?: string;
          name?: string;
          position?: number;
          provenance?: NonNullable<Json>;
          removed_at?: string | null;
          source_type?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inspiration_pieces_workspace_id_look_id_fkey";
            columns: ["workspace_id", "look_id"];
            isOneToOne: false;
            referencedRelation: "looks";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      look_items: {
        Row: {
          look_id: string;
          position: number;
          wardrobe_item_id: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          look_id: string;
          position?: number;
          wardrobe_item_id: string;
          workspace_id: string;
        };
        Update: {
          look_id?: string;
          position?: number;
          wardrobe_item_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "look_items_workspace_id_look_id_fkey";
            columns: ["workspace_id", "look_id"];
            isOneToOne: false;
            referencedRelation: "looks";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "look_items_workspace_id_wardrobe_item_id_fkey";
            columns: ["workspace_id", "wardrobe_item_id"];
            isOneToOne: false;
            referencedRelation: "wardrobe_items";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      looks: {
        Row: {
          created_at: string;
          id: string;
          inspiration_asset_id: string | null;
          is_saved: boolean;
          notes: string;
          provider_metadata: NonNullable<Json>;
          revision: number;
          selected_option_id: string | null;
          source_type: string;
          status: string;
          title: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          inspiration_asset_id?: string | null;
          is_saved?: boolean;
          notes?: string;
          provider_metadata?: NonNullable<Json>;
          revision?: number;
          selected_option_id?: string | null;
          source_type?: string;
          status?: string;
          title: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          inspiration_asset_id?: string | null;
          is_saved?: boolean;
          notes?: string;
          provider_metadata?: NonNullable<Json>;
          revision?: number;
          selected_option_id?: string | null;
          source_type?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "looks_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "looks_workspace_id_id_selected_option_id_fkey";
            columns: ["workspace_id", "id", "selected_option_id"];
            isOneToOne: false;
            referencedRelation: "outfit_options";
            referencedColumns: ["workspace_id", "look_id", "id"];
          },
          {
            foreignKeyName: "looks_workspace_id_inspiration_asset_id_fkey";
            columns: ["workspace_id", "inspiration_asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      outfit_option_items: {
        Row: {
          id: string;
          item_kind: string;
          look_id: string;
          missing_brief: string | null;
          option_id: string;
          piece_id: string | null;
          position: number;
          product_id: string | null;
          rationale: string;
          slot_id: string;
          wardrobe_item_id: string | null;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          item_kind: string;
          look_id: string;
          missing_brief?: string | null;
          option_id: string;
          piece_id?: string | null;
          position?: number;
          product_id?: string | null;
          rationale?: string;
          slot_id: string;
          wardrobe_item_id?: string | null;
          workspace_id: string;
        };
        Update: {
          id?: string;
          item_kind?: string;
          look_id?: string;
          missing_brief?: string | null;
          option_id?: string;
          piece_id?: string | null;
          position?: number;
          product_id?: string | null;
          rationale?: string;
          slot_id?: string;
          wardrobe_item_id?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outfit_option_items_workspace_id_look_id_option_id_fkey";
            columns: ["workspace_id", "look_id", "option_id"];
            isOneToOne: false;
            referencedRelation: "outfit_options";
            referencedColumns: ["workspace_id", "look_id", "id"];
          },
          {
            foreignKeyName: "outfit_option_items_workspace_id_look_id_piece_id_fkey";
            columns: ["workspace_id", "look_id", "piece_id"];
            isOneToOne: false;
            referencedRelation: "inspiration_pieces";
            referencedColumns: ["workspace_id", "look_id", "id"];
          },
          {
            foreignKeyName: "outfit_option_items_workspace_id_product_id_fkey";
            columns: ["workspace_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "outfit_option_items_workspace_id_wardrobe_item_id_fkey";
            columns: ["workspace_id", "wardrobe_item_id"];
            isOneToOne: false;
            referencedRelation: "wardrobe_items";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      outfit_options: {
        Row: {
          created_at: string;
          id: string;
          inputs_used: NonNullable<Json>;
          look_id: string;
          option_type: string;
          provider_metadata: NonNullable<Json>;
          rationale: string;
          source_revision: number;
          source_type: string;
          title: string;
          uncertainty: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          inputs_used?: NonNullable<Json>;
          look_id: string;
          option_type: string;
          provider_metadata?: NonNullable<Json>;
          rationale: string;
          source_revision: number;
          source_type: string;
          title: string;
          uncertainty?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          inputs_used?: NonNullable<Json>;
          look_id?: string;
          option_type?: string;
          provider_metadata?: NonNullable<Json>;
          rationale?: string;
          source_revision?: number;
          source_type?: string;
          title?: string;
          uncertainty?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outfit_options_workspace_id_look_id_fkey";
            columns: ["workspace_id", "look_id"];
            isOneToOne: false;
            referencedRelation: "looks";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      products: {
        Row: {
          category: string;
          commercial_disclosure: string | null;
          currency: string | null;
          id: string;
          image_url: string | null;
          price_minor: number | null;
          product_url: string;
          provider: string;
          provider_product_id: string;
          rating: number | null;
          retrieved_at: string;
          review_count: number | null;
          shipping_minor: number | null;
          source_label: string;
          source_type: string;
          title: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          category: string;
          commercial_disclosure?: string | null;
          currency?: string | null;
          id?: string;
          image_url?: string | null;
          price_minor?: number | null;
          product_url: string;
          provider: string;
          provider_product_id: string;
          rating?: number | null;
          retrieved_at: string;
          review_count?: number | null;
          shipping_minor?: number | null;
          source_label: string;
          source_type: string;
          title: string;
          workspace_id: string;
        };
        Update: {
          category?: string;
          commercial_disclosure?: string | null;
          currency?: string | null;
          id?: string;
          image_url?: string | null;
          price_minor?: number | null;
          product_url?: string;
          provider?: string;
          provider_product_id?: string;
          rating?: number | null;
          retrieved_at?: string;
          review_count?: number | null;
          shipping_minor?: number | null;
          source_label?: string;
          source_type?: string;
          title?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_look_snapshots: {
        Row: {
          created_at: string;
          id: string;
          inputs_used: NonNullable<Json>;
          items: NonNullable<Json>;
          look_id: string;
          option_id: string | null;
          provider_metadata: NonNullable<Json>;
          rationale: string;
          source_revision: number;
          source_type: string;
          title: string;
          uncertainty: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          inputs_used?: NonNullable<Json>;
          items: NonNullable<Json>;
          look_id: string;
          option_id?: string | null;
          provider_metadata?: NonNullable<Json>;
          rationale?: string;
          source_revision: number;
          source_type: string;
          title: string;
          uncertainty?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          inputs_used?: NonNullable<Json>;
          items?: NonNullable<Json>;
          look_id?: string;
          option_id?: string | null;
          provider_metadata?: NonNullable<Json>;
          rationale?: string;
          source_revision?: number;
          source_type?: string;
          title?: string;
          uncertainty?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_look_snapshots_workspace_id_look_id_fkey";
            columns: ["workspace_id", "look_id"];
            isOneToOne: false;
            referencedRelation: "looks";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "saved_look_snapshots_workspace_id_look_id_option_id_fkey";
            columns: ["workspace_id", "look_id", "option_id"];
            isOneToOne: false;
            referencedRelation: "outfit_options";
            referencedColumns: ["workspace_id", "look_id", "id"];
          },
        ];
      };
      share_links: {
        Row: {
          catchphrase: string;
          created_at: string;
          expires_at: string;
          id: string;
          public_snapshot: NonNullable<Json>;
          revoked_at: string | null;
          saved_look_id: string;
          token_hash: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          catchphrase?: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          public_snapshot: NonNullable<Json>;
          revoked_at?: string | null;
          saved_look_id: string;
          token_hash: string;
          workspace_id: string;
        };
        Update: {
          catchphrase?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          public_snapshot?: NonNullable<Json>;
          revoked_at?: string | null;
          saved_look_id?: string;
          token_hash?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "share_links_workspace_id_saved_look_id_fkey";
            columns: ["workspace_id", "saved_look_id"];
            isOneToOne: false;
            referencedRelation: "saved_look_snapshots";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      shopping_results: {
        Row: {
          explanation: string;
          factors: NonNullable<Json>;
          position: number;
          product_id: string;
          search_id: string;
          value_score: number | null;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          explanation?: string;
          factors?: NonNullable<Json>;
          position: number;
          product_id: string;
          search_id: string;
          value_score?: number | null;
          workspace_id: string;
        };
        Update: {
          explanation?: string;
          factors?: NonNullable<Json>;
          position?: number;
          product_id?: string;
          search_id?: string;
          value_score?: number | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_results_workspace_id_product_id_fkey";
            columns: ["workspace_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "shopping_results_workspace_id_search_id_fkey";
            columns: ["workspace_id", "search_id"];
            isOneToOne: false;
            referencedRelation: "shopping_searches";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      shopping_searches: {
        Row: {
          country: string;
          created_at: string;
          error_code: string | null;
          id: string;
          option_item_id: string;
          provider: string;
          query: string;
          score_version: string;
          score_weights: NonNullable<Json>;
          status: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          country?: string;
          created_at?: string;
          error_code?: string | null;
          id?: string;
          option_item_id: string;
          provider: string;
          query: string;
          score_version?: string;
          score_weights?: NonNullable<Json>;
          status: string;
          workspace_id: string;
        };
        Update: {
          country?: string;
          created_at?: string;
          error_code?: string | null;
          id?: string;
          option_item_id?: string;
          provider?: string;
          query?: string;
          score_version?: string;
          score_weights?: NonNullable<Json>;
          status?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_searches_workspace_id_option_item_id_fkey";
            columns: ["workspace_id", "option_item_id"];
            isOneToOne: false;
            referencedRelation: "outfit_option_items";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          body_profile: NonNullable<Json>;
          fit_preferences: NonNullable<Json>;
          style_dna: NonNullable<Json>;
          style_notes: string;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          body_profile?: NonNullable<Json>;
          fit_preferences?: NonNullable<Json>;
          style_dna?: NonNullable<Json>;
          style_notes?: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          body_profile?: NonNullable<Json>;
          fit_preferences?: NonNullable<Json>;
          style_dna?: NonNullable<Json>;
          style_notes?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      wardrobe_items: {
        Row: {
          archived_at: string | null;
          asset_id: string | null;
          attribute_provenance: NonNullable<Json>;
          attributes: NonNullable<Json>;
          category: string;
          color: string;
          created_at: string;
          id: string;
          image_path: string | null;
          inferred_attributes: NonNullable<Json>;
          name: string;
          notes: string;
          subcategory: string | null;
          updated_at: string;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          asset_id?: string | null;
          attribute_provenance?: NonNullable<Json>;
          attributes?: NonNullable<Json>;
          category: string;
          color?: string;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          inferred_attributes?: NonNullable<Json>;
          name: string;
          notes?: string;
          subcategory?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          archived_at?: string | null;
          asset_id?: string | null;
          attribute_provenance?: NonNullable<Json>;
          attributes?: NonNullable<Json>;
          category?: string;
          color?: string;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          inferred_attributes?: NonNullable<Json>;
          name?: string;
          notes?: string;
          subcategory?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wardrobe_items_workspace_id_asset_id_fkey";
            columns: ["workspace_id", "asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "wardrobe_items_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      wardrobe_matches: {
        Row: {
          confidence: number | null;
          differences: NonNullable<Json>;
          id: string;
          is_manual_override: boolean;
          match_type: string;
          piece_id: string;
          rationale: string;
          shared_attributes: NonNullable<Json>;
          source_revision: number;
          source_type: string;
          wardrobe_item_id: string | null;
          workspace_id: string;
        };
        ComputedFields: never;
        Insert: {
          confidence?: number | null;
          differences?: NonNullable<Json>;
          id?: string;
          is_manual_override?: boolean;
          match_type: string;
          piece_id: string;
          rationale: string;
          shared_attributes?: NonNullable<Json>;
          source_revision: number;
          source_type: string;
          wardrobe_item_id?: string | null;
          workspace_id: string;
        };
        Update: {
          confidence?: number | null;
          differences?: NonNullable<Json>;
          id?: string;
          is_manual_override?: boolean;
          match_type?: string;
          piece_id?: string;
          rationale?: string;
          shared_attributes?: NonNullable<Json>;
          source_revision?: number;
          source_type?: string;
          wardrobe_item_id?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wardrobe_matches_workspace_id_piece_id_fkey";
            columns: ["workspace_id", "piece_id"];
            isOneToOne: false;
            referencedRelation: "inspiration_pieces";
            referencedColumns: ["workspace_id", "id"];
          },
          {
            foreignKeyName: "wardrobe_matches_workspace_id_wardrobe_item_id_fkey";
            columns: ["workspace_id", "wardrobe_item_id"];
            isOneToOne: false;
            referencedRelation: "wardrobe_items";
            referencedColumns: ["workspace_id", "id"];
          },
        ];
      };
      workspaces: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_capsule: {
        Args: {
          p_brief: Json;
          p_description: string;
          p_item_ids: string[];
          p_title: string;
          p_workspace_id: string;
        };
        Returns: string;
      };
      create_capsule_from_saved_look: {
        Args: {
          p_brief: Json;
          p_description: string;
          p_saved_look_id: string;
          p_title: string;
          p_workspace_id: string;
        };
        Returns: string;
      };
      create_capsule_outfit: {
        Args: {
          p_capsule_id: string;
          p_inputs_used?: Json;
          p_item_ids: string[];
          p_rationale: string;
          p_source_type?: string;
          p_title: string;
          p_workspace_id: string;
        };
        Returns: string;
      };
      create_share_link: {
        Args: {
          p_catchphrase: string;
          p_expires_at: string;
          p_saved_look_id: string;
          p_workspace_id: string;
        };
        Returns: {
          share_id: string;
          share_token: string;
        }[];
      };
      persist_inspiration_revision: {
        Args: {
          p_asset_id: string;
          p_expected_revision: number;
          p_look_id: string;
          p_notes: string;
          p_pieces: Json;
          p_provider_metadata: Json;
          p_source_type: string;
          p_title: string;
          p_workspace_id: string;
        };
        Returns: {
          look_id: string;
          revision: number;
        }[];
      };
      persist_look_results: {
        Args: {
          p_expected_revision: number;
          p_look_id: string;
          p_matches: Json;
          p_options: Json;
          p_replace_matches: boolean;
          p_workspace_id: string;
        };
        Returns: Json;
      };
      save_capsule_studio: {
        Args: {
          p_brief: Json;
          p_capsule_id?: string;
          p_description: string;
          p_expected_revision?: number;
          p_item_ids: string[];
          p_occasion?: string;
          p_season?: string;
          p_timeframe?: string;
          p_title: string;
          p_workspace_id: string;
        };
        Returns: string;
      };
      save_look: {
        Args: {
          p_item_ids: string[];
          p_notes: string;
          p_title: string;
          p_workspace_id: string;
        };
        Returns: string;
      };
      save_outfit_option: {
        Args: {
          p_expected_revision: number;
          p_option_id: string;
          p_workspace_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
