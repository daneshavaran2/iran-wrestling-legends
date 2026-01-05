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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      about_media: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          title: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          title?: string | null
          type?: string
          url: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          title?: string | null
          type?: string
          url?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          created_at: string
          description: string | null
          event: string
          id: string
          medal_type: Database["public"]["Enums"]["medal_type"]
          title: string
          wrestler_id: string
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          event: string
          id?: string
          medal_type: Database["public"]["Enums"]["medal_type"]
          title: string
          wrestler_id: string
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          event?: string
          id?: string
          medal_type?: Database["public"]["Enums"]["medal_type"]
          title?: string
          wrestler_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "achievements_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      album_photos: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          url: string
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          url: string
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          about_content: string | null
          about_image_url: string | null
          about_title: string | null
          id: string
          theme: string
          updated_at: string
        }
        Insert: {
          about_content?: string | null
          about_image_url?: string | null
          about_title?: string | null
          id?: string
          theme?: string
          updated_at?: string
        }
        Update: {
          about_content?: string | null
          about_image_url?: string | null
          about_title?: string | null
          id?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string
          cover_image_url: string | null
          created_at: string | null
          display_order: number | null
          id: string
          related_wrestler_id: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author: string
          cover_image_url?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          related_wrestler_id?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          cover_image_url?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          related_wrestler_id?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_related_wrestler_id_fkey"
            columns: ["related_wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      building_images: {
        Row: {
          building_id: string
          created_at: string | null
          display_order: number | null
          id: string
          title: string | null
          type: string
          url: string
        }
        Insert: {
          building_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          title?: string | null
          type?: string
          url: string
        }
        Update: {
          building_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          title?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_images_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          hero_image_url: string | null
          id: string
          map_link: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          hero_image_url?: string | null
          id?: string
          map_link?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          hero_image_url?: string | null
          id?: string
          map_link?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      history_media: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          section_id: string
          title: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          section_id: string
          title?: string | null
          type?: string
          url: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          section_id?: string
          title?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "history_media_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "history_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      history_sections: {
        Row: {
          content: string | null
          created_at: string | null
          display_order: number | null
          highlighted_quote: string | null
          id: string
          parent_id: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          display_order?: number | null
          highlighted_quote?: string | null
          id?: string
          parent_id?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          display_order?: number | null
          highlighted_quote?: string | null
          id?: string
          parent_id?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "history_sections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "history_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wrestler_media: {
        Row: {
          created_at: string
          display_order: number
          id: string
          thumbnail: string | null
          title: string | null
          type: Database["public"]["Enums"]["media_type"]
          url: string
          wrestler_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          thumbnail?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          url: string
          wrestler_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          thumbnail?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          url?: string
          wrestler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wrestler_media_wrestler_id_fkey"
            columns: ["wrestler_id"]
            isOneToOne: false
            referencedRelation: "wrestlers"
            referencedColumns: ["id"]
          },
        ]
      }
      wrestlers: {
        Row: {
          bio: string | null
          created_at: string
          full_story: string | null
          id: string
          image_url: string | null
          intro_video_url: string | null
          is_visible: boolean
          name: string
          province: string | null
          social_activities: string | null
          style: Database["public"]["Enums"]["wrestling_style"]
          success_path: string | null
          updated_at: string
          weight_class: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_story?: string | null
          id?: string
          image_url?: string | null
          intro_video_url?: string | null
          is_visible?: boolean
          name: string
          province?: string | null
          social_activities?: string | null
          style?: Database["public"]["Enums"]["wrestling_style"]
          success_path?: string | null
          updated_at?: string
          weight_class?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_story?: string | null
          id?: string
          image_url?: string | null
          intro_video_url?: string | null
          is_visible?: boolean
          name?: string
          province?: string | null
          social_activities?: string | null
          style?: Database["public"]["Enums"]["wrestling_style"]
          success_path?: string | null
          updated_at?: string
          weight_class?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      medal_type: "gold" | "silver" | "bronze"
      media_type: "image" | "video"
      wrestling_style: "freestyle" | "greco-roman"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      medal_type: ["gold", "silver", "bronze"],
      media_type: ["image", "video"],
      wrestling_style: ["freestyle", "greco-roman"],
    },
  },
} as const
