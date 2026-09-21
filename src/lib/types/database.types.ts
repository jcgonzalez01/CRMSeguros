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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      aseguradoras: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          nombre: string
          notas: string | null
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          nombre: string
          notas?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          nombre?: string
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aseguradoras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          correo: string | null
          created_at: string
          created_by: string | null
          empresa_id: string
          id: string
          nombre: string
          notas: string | null
          propietario_id: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          correo?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id: string
          id?: string
          nombre: string
          notas?: string | null
          propietario_id?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          correo?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string
          id?: string
          nombre?: string
          notas?: string | null
          propietario_id?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          activa: boolean
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      oportunidades: {
        Row: {
          cliente_id: string
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["opportunity_status"]
          fecha_cierre: string | null
          id: string
          monto_estimado: number | null
          notas: string | null
          propietario_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          empresa_id: string
          estado?: Database["public"]["Enums"]["opportunity_status"]
          fecha_cierre?: string | null
          id?: string
          monto_estimado?: number | null
          notas?: string | null
          propietario_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          empresa_id?: string
          estado?: Database["public"]["Enums"]["opportunity_status"]
          fecha_cierre?: string | null
          id?: string
          monto_estimado?: number | null
          notas?: string | null
          propietario_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polizas: {
        Row: {
          aseguradora_id: string
          cliente_id: string
          created_at: string
          empresa_id: string
          estado: Database["public"]["Enums"]["policy_status"]
          fecha_emision: string
          fecha_vencimiento: string
          id: string
          monto: number
          numero_poliza: string
          plan_pago: Database["public"]["Enums"]["payment_plan"]
          producto: string
          propietario_id: string | null
          updated_at: string
        }
        Insert: {
          aseguradora_id: string
          cliente_id: string
          created_at?: string
          empresa_id: string
          estado?: Database["public"]["Enums"]["policy_status"]
          fecha_emision: string
          fecha_vencimiento: string
          id?: string
          monto: number
          numero_poliza: string
          plan_pago: Database["public"]["Enums"]["payment_plan"]
          producto: string
          propietario_id?: string | null
          updated_at?: string
        }
        Update: {
          aseguradora_id?: string
          cliente_id?: string
          created_at?: string
          empresa_id?: string
          estado?: Database["public"]["Enums"]["policy_status"]
          fecha_emision?: string
          fecha_vencimiento?: string
          id?: string
          monto?: number
          numero_poliza?: string
          plan_pago?: Database["public"]["Enums"]["payment_plan"]
          producto?: string
          propietario_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "polizas_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "aseguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polizas_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "v_conteo_polizas_por_aseguradora"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polizas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polizas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polizas_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          empresa_id: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email: string
          empresa_id?: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          empresa_id?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas: {
        Row: {
          asignado_a: string | null
          cliente_id: string | null
          created_at: string
          descripcion: string | null
          empresa_id: string
          estado: Database["public"]["Enums"]["task_status"]
          fecha_limite: string
          id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          asignado_a?: string | null
          cliente_id?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id: string
          estado?: Database["public"]["Enums"]["task_status"]
          fecha_limite: string
          id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          asignado_a?: string | null
          cliente_id?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id?: string
          estado?: Database["public"]["Enums"]["task_status"]
          fecha_limite?: string
          id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_conteo_polizas_por_aseguradora: {
        Row: {
          id: string | null
          nombre: string | null
          polizas_activas: number | null
        }
        Relationships: []
      }
      v_oportunidades_semana: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          estado: Database["public"]["Enums"]["opportunity_status"] | null
          fecha_cierre: string | null
          id: string | null
          monto_estimado: number | null
          notas: string | null
          propietario_id: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["opportunity_status"] | null
          fecha_cierre?: string | null
          id?: string | null
          monto_estimado?: number | null
          notas?: string | null
          propietario_id?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["opportunity_status"] | null
          fecha_cierre?: string | null
          id?: string | null
          monto_estimado?: number | null
          notas?: string | null
          propietario_id?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_polizas_vencen_semana: {
        Row: {
          aseguradora_id: string | null
          cliente_id: string | null
          created_at: string | null
          estado: Database["public"]["Enums"]["policy_status"] | null
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string | null
          monto: number | null
          numero_poliza: string | null
          plan_pago: Database["public"]["Enums"]["payment_plan"] | null
          producto: string | null
          propietario_id: string | null
          updated_at: string | null
        }
        Insert: {
          aseguradora_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["policy_status"] | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string | null
          monto?: number | null
          numero_poliza?: string | null
          plan_pago?: Database["public"]["Enums"]["payment_plan"] | null
          producto?: string | null
          propietario_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aseguradora_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["policy_status"] | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string | null
          monto?: number | null
          numero_poliza?: string | null
          plan_pago?: Database["public"]["Enums"]["payment_plan"] | null
          producto?: string | null
          propietario_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polizas_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "aseguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polizas_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "v_conteo_polizas_por_aseguradora"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polizas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polizas_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_polizas_vencidas: {
        Row: {
          aseguradora_id: string | null
          cliente_id: string | null
          created_at: string | null
          estado: Database["public"]["Enums"]["policy_status"] | null
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string | null
          monto: number | null
          numero_poliza: string | null
          plan_pago: Database["public"]["Enums"]["payment_plan"] | null
          producto: string | null
          propietario_id: string | null
          updated_at: string | null
        }
        Insert: {
          aseguradora_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["policy_status"] | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string | null
          monto?: number | null
          numero_poliza?: string | null
          plan_pago?: Database["public"]["Enums"]["payment_plan"] | null
          producto?: string | null
          propietario_id?: string | null
          updated_at?: string | null
        }
        Update: {
          aseguradora_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["policy_status"] | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string | null
          monto?: number | null
          numero_poliza?: string | null
          plan_pago?: Database["public"]["Enums"]["payment_plan"] | null
          producto?: string | null
          propietario_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polizas_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "aseguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polizas_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "v_conteo_polizas_por_aseguradora"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polizas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polizas_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_resumen_financiero: {
        Row: {
          monto_ganado: number | null
          prima_total_activa: number | null
        }
        Relationships: []
      }
      v_tareas_atrasadas: {
        Row: {
          asignado_a: string | null
          cliente_id: string | null
          created_at: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["task_status"] | null
          fecha_limite: string | null
          id: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          asignado_a?: string | null
          cliente_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["task_status"] | null
          fecha_limite?: string | null
          id?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          asignado_a?: string | null
          cliente_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["task_status"] | null
          fecha_limite?: string | null
          id?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      v_tareas_semana: {
        Row: {
          asignado_a: string | null
          cliente_id: string | null
          created_at: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["task_status"] | null
          fecha_limite: string | null
          id: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          asignado_a?: string | null
          cliente_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["task_status"] | null
          fecha_limite?: string | null
          id?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          asignado_a?: string | null
          cliente_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["task_status"] | null
          fecha_limite?: string | null
          id?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_asignado_a_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      v_totales_oportunidades: {
        Row: {
          cantidad: number | null
          estado: Database["public"]["Enums"]["opportunity_status"] | null
          monto_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_empresa_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      provisionar_empresa: { Args: { p_nombre: string }; Returns: string }
      sembrar_aseguradoras_default: {
        Args: { p_empresa: string }
        Returns: undefined
      }
    }
    Enums: {
      opportunity_status: "abierta" | "ganada" | "perdida"
      payment_plan: "unico" | "mensual" | "trimestral" | "semestral" | "anual"
      policy_status: "activa" | "vencida" | "cancelada"
      task_status: "pendiente" | "completada"
      user_role: "Admin" | "Manager"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      opportunity_status: ["abierta", "ganada", "perdida"],
      payment_plan: ["unico", "mensual", "trimestral", "semestral", "anual"],
      policy_status: ["activa", "vencida", "cancelada"],
      task_status: ["pendiente", "completada"],
      user_role: ["Admin", "Manager"],
    },
  },
} as const

// Convenience aliases used across queries/actions/components.
export type PolicyStatus = Database["public"]["Enums"]["policy_status"]
export type PaymentPlan = Database["public"]["Enums"]["payment_plan"]
export type OpportunityStatus = Database["public"]["Enums"]["opportunity_status"]
export type TaskStatus = Database["public"]["Enums"]["task_status"]
export type UserRole = Database["public"]["Enums"]["user_role"]
