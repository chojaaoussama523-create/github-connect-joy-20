export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      gm7_active_tournaments: {
        Row: {
          bracket_size: number
          created_at: string
          format: string
          game_id: string
          game_name: string
          id: string
          mode: number
          platform: string
          prize_mad: number
          starts_at: string | null
          status: string
          teams: Json
          third: string | null
          title: string
          updated_at: string
          winners: Json
        }
        Insert: {
          bracket_size?: number
          created_at?: string
          format?: string
          game_id: string
          game_name: string
          id?: string
          mode?: number
          platform: string
          prize_mad?: number
          starts_at?: string | null
          status?: string
          teams?: Json
          third?: string | null
          title: string
          updated_at?: string
          winners?: Json
        }
        Update: {
          bracket_size?: number
          created_at?: string
          format?: string
          game_id?: string
          game_name?: string
          id?: string
          mode?: number
          platform?: string
          prize_mad?: number
          starts_at?: string | null
          status?: string
          teams?: Json
          third?: string | null
          title?: string
          updated_at?: string
          winners?: Json
        }
        Relationships: []
      }
      market_orders: {
        Row: {
          address: string
          city: string
          confirmed_at: string | null
          created_at: string
          customer_name: string
          id: string
          items: Json
          notes: string
          order_number: string
          payment_method: string
          phone: string
          shipping_mad: number
          status: string
          subtotal_mad: number
          total_mad: number
        }
        Insert: {
          address: string
          city: string
          confirmed_at?: string | null
          created_at?: string
          customer_name: string
          id?: string
          items: Json
          notes?: string
          order_number: string
          payment_method?: string
          phone: string
          shipping_mad?: number
          status?: string
          subtotal_mad: number
          total_mad: number
        }
        Update: {
          address?: string
          city?: string
          confirmed_at?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          items?: Json
          notes?: string
          order_number?: string
          payment_method?: string
          phone?: string
          shipping_mad?: number
          status?: string
          subtotal_mad?: number
          total_mad?: number
        }
        Relationships: []
      }
      market_products: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          image_url: string | null
          price_mad: number
          stock: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          price_mad: number
          stock?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          price_mad?: number
          stock?: number
          title?: string
        }
        Relationships: []
      }
      snnsei_media: {
        Row: {
          created_at: string
          id: string
          is_live: boolean
          kind: string
          platform: string
          sort: number
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_live?: boolean
          kind?: string
          platform: string
          sort?: number
          title: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_live?: boolean
          kind?: string
          platform?: string
          sort?: number
          title?: string
          url?: string
        }
        Relationships: []
      }
      tournament_registrations: {
        Row: {
          captain: string
          city: string
          code: string
          created_at: string
          discord: string
          game_id: string
          id: string
          mode: number
          platform: string
          platform_id: string
          roster: string[]
          status: string
          sub: string
          team: string
          whatsapp: string
        }
        Insert: {
          captain: string
          city: string
          code: string
          created_at?: string
          discord?: string
          game_id: string
          id?: string
          mode: number
          platform: string
          platform_id: string
          roster?: string[]
          status?: string
          sub?: string
          team: string
          whatsapp: string
        }
        Update: {
          captain?: string
          city?: string
          code?: string
          created_at?: string
          discord?: string
          game_id?: string
          id?: string
          mode?: number
          platform?: string
          platform_id?: string
          roster?: string[]
          status?: string
          sub?: string
          team?: string
          whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
