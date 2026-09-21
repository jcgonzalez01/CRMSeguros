// Hand-written stub matching supabase/migrations/*.sql, used until the
// project is linked to a real Supabase instance. Regenerate the accurate
// version with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types/database.types.ts

export type PolicyStatus = "activa" | "vencida" | "cancelada";
export type PaymentPlan =
  | "unico"
  | "mensual"
  | "trimestral"
  | "semestral"
  | "anual";
export type OpportunityStatus = "abierta" | "ganada" | "perdida";
export type TaskStatus = "pendiente" | "completada";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          full_name: string;
          email: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          nombre: string;
          telefono: string | null;
          correo: string | null;
          notas: string | null;
          propietario_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          telefono?: string | null;
          correo?: string | null;
          notas?: string | null;
          propietario_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "clientes_propietario_id_fkey";
            columns: ["propietario_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clientes_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      aseguradoras: {
        Row: {
          id: string;
          nombre: string;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          notas?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["aseguradoras"]["Insert"]
        >;
        Relationships: [];
      };
      polizas: {
        Row: {
          id: string;
          cliente_id: string;
          aseguradora_id: string;
          producto: string;
          numero_poliza: string;
          fecha_emision: string;
          fecha_vencimiento: string;
          monto: number;
          plan_pago: PaymentPlan;
          estado: PolicyStatus;
          propietario_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          aseguradora_id: string;
          producto: string;
          numero_poliza: string;
          fecha_emision: string;
          fecha_vencimiento: string;
          monto: number;
          plan_pago: PaymentPlan;
          estado?: PolicyStatus;
          propietario_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["polizas"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "polizas_cliente_id_fkey";
            columns: ["cliente_id"];
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "polizas_aseguradora_id_fkey";
            columns: ["aseguradora_id"];
            referencedRelation: "aseguradoras";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "polizas_propietario_id_fkey";
            columns: ["propietario_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      oportunidades: {
        Row: {
          id: string;
          cliente_id: string;
          titulo: string;
          monto_estimado: number | null;
          estado: OpportunityStatus;
          propietario_id: string | null;
          fecha_cierre: string | null;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          titulo: string;
          monto_estimado?: number | null;
          estado?: OpportunityStatus;
          propietario_id?: string | null;
          fecha_cierre?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["oportunidades"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "oportunidades_cliente_id_fkey";
            columns: ["cliente_id"];
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "oportunidades_propietario_id_fkey";
            columns: ["propietario_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tareas: {
        Row: {
          id: string;
          titulo: string;
          descripcion: string | null;
          cliente_id: string | null;
          asignado_a: string | null;
          fecha_limite: string;
          estado: TaskStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          titulo: string;
          descripcion?: string | null;
          cliente_id?: string | null;
          asignado_a?: string | null;
          fecha_limite: string;
          estado?: TaskStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tareas"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "tareas_cliente_id_fkey";
            columns: ["cliente_id"];
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tareas_asignado_a_fkey";
            columns: ["asignado_a"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_polizas_vencen_semana: {
        Row: Database["public"]["Tables"]["polizas"]["Row"];
        Relationships: Database["public"]["Tables"]["polizas"]["Relationships"];
      };
      v_polizas_vencidas: {
        Row: Database["public"]["Tables"]["polizas"]["Row"];
        Relationships: Database["public"]["Tables"]["polizas"]["Relationships"];
      };
      v_tareas_semana: {
        Row: Database["public"]["Tables"]["tareas"]["Row"];
        Relationships: Database["public"]["Tables"]["tareas"]["Relationships"];
      };
      v_tareas_atrasadas: {
        Row: Database["public"]["Tables"]["tareas"]["Row"];
        Relationships: Database["public"]["Tables"]["tareas"]["Relationships"];
      };
      v_oportunidades_semana: {
        Row: Database["public"]["Tables"]["oportunidades"]["Row"];
        Relationships: Database["public"]["Tables"]["oportunidades"]["Relationships"];
      };
      v_resumen_financiero: {
        Row: {
          prima_total_activa: number;
          monto_ganado: number;
        };
        Relationships: [];
      };
      v_conteo_polizas_por_aseguradora: {
        Row: {
          id: string;
          nombre: string;
          polizas_activas: number;
        };
        Relationships: [];
      };
      v_totales_oportunidades: {
        Row: {
          estado: OpportunityStatus;
          cantidad: number;
          monto_total: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
}
