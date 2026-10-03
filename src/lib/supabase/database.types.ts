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
    };
    Views: { [_ in never]: never };
    Functions: {
      delete_my_account: { Args: never; Returns: undefined };
      set_default_address: { Args: { target: string }; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
