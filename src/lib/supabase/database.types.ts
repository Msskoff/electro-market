/**
 * Types de la base Supabase « electromarket » (générés depuis le schéma, puis réduits
 * au strict nécessaire). À régénérer après chaque migration.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      carts: {
        Row: { lines: Json; updated_at: string; user_id: string };
        Insert: { lines?: Json; updated_at?: string; user_id?: string };
        Update: { lines?: Json; updated_at?: string; user_id?: string };
        Relationships: [];
      };
      addresses: {
        Row: {
          city: string;
          created_at: string;
          district: string;
          id: string;
          is_default: boolean;
          label: string;
          landmark: string;
          phone: string;
          user_id: string;
        };
        Insert: {
          city: string;
          created_at?: string;
          district: string;
          id?: string;
          is_default?: boolean;
          label: string;
          landmark?: string;
          phone: string;
          user_id?: string;
        };
        Update: {
          city?: string;
          created_at?: string;
          district?: string;
          id?: string;
          is_default?: boolean;
          label?: string;
          landmark?: string;
          phone?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          first_name: string;
          id: string;
          last_name: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          first_name?: string;
          id: string;
          last_name?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      admins: {
        Row: { created_at: string; user_id: string };
        Insert: { created_at?: string; user_id: string };
        Update: { created_at?: string; user_id?: string };
        Relationships: [];
      };
      brands: {
        Row: { created_at: string; name: string; slug: string };
        Insert: { created_at?: string; name: string; slug: string };
        Update: { created_at?: string; name?: string; slug?: string };
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
      product_redirects: {
        Row: { created_at: string; from_path: string; to_path: string };
        Insert: { created_at?: string; from_path: string; to_path: string };
        Update: { created_at?: string; from_path?: string; to_path?: string };
        Relationships: [];
      };
      products: {
        Row: {
          brand: string;
          category: string;
          data: Json;
          id: string;
          in_stock: boolean;
          position: number;
          published_at: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          brand: string;
          category: string;
          data: Json;
          id: string;
          in_stock?: boolean;
          position?: number;
          published_at?: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          brand?: string;
          category?: string;
          data?: Json;
          id?: string;
          in_stock?: boolean;
          position?: number;
          published_at?: string;
          slug?: string;
          updated_at?: string;
        };
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
      admin_list_customers: {
        Args: never;
        Returns: {
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          last_sign_in_at: string;
          phone: string;
        }[];
      };
      delete_my_account: { Args: never; Returns: undefined };
      is_admin: { Args: never; Returns: boolean };
      publish_category: { Args: { p_slug: string }; Returns: undefined };
      publish_product: { Args: { p_id: string }; Returns: string };
      publish_settings: { Args: never; Returns: undefined };
      set_default_address: { Args: { target: string }; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
