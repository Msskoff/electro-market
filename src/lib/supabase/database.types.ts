/**
 * Types de la base Supabase « electromarket » (générés depuis le schéma : outil
 * generate_typescript_types, sans les utilitaires génériques). À régénérer après chaque migration.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      addresses: {
        Row: { city: string; created_at: string; district: string; id: string; is_default: boolean; label: string; landmark: string; phone: string; user_id: string };
        Insert: { city: string; created_at?: string; district: string; id?: string; is_default?: boolean; label: string; landmark?: string; phone: string; user_id?: string };
        Update: { city?: string; created_at?: string; district?: string; id?: string; is_default?: boolean; label?: string; landmark?: string; phone?: string; user_id?: string };
        Relationships: [];
      };
      admins: {
        Row: { created_at: string; user_id: string };
        Insert: { created_at?: string; user_id: string };
        Update: { created_at?: string; user_id?: string };
        Relationships: [];
      };
      analytics_events: {
        Row: { at: string; device: string; id: number; path: string; product_id: string | null; query: string | null; results: number | null; source: string; type: string; value: number | null; visitor: string };
        Insert: { at?: string; device?: string; id?: never; path?: string; product_id?: string | null; query?: string | null; results?: number | null; source?: string; type: string; value?: number | null; visitor: string };
        Update: { at?: string; device?: string; id?: never; path?: string; product_id?: string | null; query?: string | null; results?: number | null; source?: string; type?: string; value?: number | null; visitor?: string };
        Relationships: [];
      };
      brands: {
        Row: { created_at: string; name: string; slug: string };
        Insert: { created_at?: string; name: string; slug: string };
        Update: { created_at?: string; name?: string; slug?: string };
        Relationships: [];
      };
      carts: {
        Row: { lines: Json; updated_at: string; user_id: string };
        Insert: { lines?: Json; updated_at?: string; user_id?: string };
        Update: { lines?: Json; updated_at?: string; user_id?: string };
        Relationships: [];
      };
      categories: {
        Row: { data: Json; position: number; published_at: string; slug: string; updated_at: string };
        Insert: { data: Json; position?: number; published_at?: string; slug: string; updated_at?: string };
        Update: { data?: Json; position?: number; published_at?: string; slug?: string; updated_at?: string };
        Relationships: [];
      };
      drafts: {
        Row: { data: Json; entity: string; key: string; updated_at: string; updated_by: string | null };
        Insert: { data: Json; entity: string; key: string; updated_at?: string; updated_by?: string | null };
        Update: { data?: Json; entity?: string; key?: string; updated_at?: string; updated_by?: string | null };
        Relationships: [];
      };
      order_events: {
        Row: { by_admin: boolean; created_at: string; id: number; note: string; order_id: string; status: string };
        Insert: { by_admin?: boolean; created_at?: string; id?: never; note?: string; order_id: string; status: string };
        Update: { by_admin?: boolean; created_at?: string; id?: never; note?: string; order_id?: string; status?: string };
        Relationships: [{ foreignKeyName: "order_events_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] }];
      };
      order_items: {
        Row: { name: string; order_id: string; position: number; product_id: string; qty: number; sku: string; unit_price: number; variant_label: string };
        Insert: { name: string; order_id: string; position: number; product_id: string; qty: number; sku: string; unit_price: number; variant_label: string };
        Update: { name?: string; order_id?: string; position?: number; product_id?: string; qty?: number; sku?: string; unit_price?: number; variant_label?: string };
        Relationships: [{ foreignKeyName: "order_items_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] }];
      };
      orders: {
        Row: {
          address: Json;
          created_at: string;
          customer: Json;
          customer_message: string;
          id: string;
          note: string;
          number: string;
          payment_method: string;
          payment_snapshot: Json;
          shipping: number;
          status: string;
          subtotal: number;
          total: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          address: Json;
          created_at?: string;
          customer: Json;
          customer_message?: string;
          id?: string;
          note?: string;
          number?: string;
          payment_method: string;
          payment_snapshot?: Json;
          shipping: number;
          status: string;
          subtotal: number;
          total: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          address?: Json;
          created_at?: string;
          customer?: Json;
          customer_message?: string;
          id?: string;
          note?: string;
          number?: string;
          payment_method?: string;
          payment_snapshot?: Json;
          shipping?: number;
          status?: string;
          subtotal?: number;
          total?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      payment_proofs: {
        Row: { amount: number; created_at: string; file_path: string; id: string; order_id: string; paid_at: string; reference: string; reviewed_at: string | null; status: string };
        Insert: { amount: number; created_at?: string; file_path: string; id?: string; order_id: string; paid_at: string; reference: string; reviewed_at?: string | null; status?: string };
        Update: { amount?: number; created_at?: string; file_path?: string; id?: string; order_id?: string; paid_at?: string; reference?: string; reviewed_at?: string | null; status?: string };
        Relationships: [{ foreignKeyName: "payment_proofs_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] }];
      };
      product_redirects: {
        Row: { created_at: string; from_path: string; to_path: string };
        Insert: { created_at?: string; from_path: string; to_path: string };
        Update: { created_at?: string; from_path?: string; to_path?: string };
        Relationships: [];
      };
      products: {
        Row: { brand: string; category: string; data: Json; id: string; in_stock: boolean; position: number; published_at: string; slug: string; updated_at: string };
        Insert: { brand: string; category: string; data: Json; id: string; in_stock?: boolean; position?: number; published_at?: string; slug: string; updated_at?: string };
        Update: { brand?: string; category?: string; data?: Json; id?: string; in_stock?: boolean; position?: number; published_at?: string; slug?: string; updated_at?: string };
        Relationships: [
          { foreignKeyName: "products_brand_fkey"; columns: ["brand"]; isOneToOne: false; referencedRelation: "brands"; referencedColumns: ["slug"] },
          { foreignKeyName: "products_category_fkey"; columns: ["category"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["slug"] },
        ];
      };
      profiles: {
        Row: { created_at: string; first_name: string; id: string; last_name: string; phone: string | null; updated_at: string };
        Insert: { created_at?: string; first_name?: string; id: string; last_name?: string; phone?: string | null; updated_at?: string };
        Update: { created_at?: string; first_name?: string; id?: string; last_name?: string; phone?: string | null; updated_at?: string };
        Relationships: [];
      };
      site_settings: {
        Row: { data: Json; id: string; published_at: string };
        Insert: { data: Json; id?: string; published_at?: string };
        Update: { data?: Json; id?: string; published_at?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      admin_analytics: { Args: { p_from: string; p_to: string }; Returns: Json };
      admin_list_customers: {
        Args: never;
        Returns: { created_at: string; email: string; first_name: string; id: string; last_name: string; last_sign_in_at: string; phone: string }[];
      };
      admin_update_order: { Args: { p_message: string; p_order: string; p_status: string }; Returns: undefined };
      cancel_my_order: { Args: { p_order: string }; Returns: undefined };
      delete_my_account: { Args: never; Returns: undefined };
      is_admin: { Args: never; Returns: boolean };
      payment_method_config: { Args: { p_method: string }; Returns: Json };
      place_order: {
        Args: { p_address_id: string; p_expected_total: number; p_items: Json; p_method: string; p_note: string };
        Returns: { id: string; number: string; total: number }[];
      };
      publish_category: { Args: { p_slug: string }; Returns: undefined };
      publish_product: { Args: { p_id: string }; Returns: string };
      publish_settings: { Args: never; Returns: undefined };
      restock_order: { Args: { p_order: string }; Returns: undefined };
      set_default_address: { Args: { target: string }; Returns: undefined };
      submit_payment_proof: {
        Args: { p_amount: number; p_order: string; p_paid_at: string; p_path: string; p_reference: string };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
