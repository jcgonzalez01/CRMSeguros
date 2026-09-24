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
          cedula: string | null
          correo: string | null
          created_at: string
          created_by: string | null
          direccion: string | null
          empresa_id: string
          estado_civil: string | null
          fecha_nacimiento: string | null
          id: string
          nombre: string
          notas: string | null
          ocupacion: string | null
          propietario_id: string | null
          sexo: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          cedula?: string | null
          correo?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          empresa_id: string
          estado_civil?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre: string
          notas?: string | null
          ocupacion?: string | null
          propietario_id?: string | null
          sexo?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          cedula?: string | null
          correo?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          empresa_id?: string
          estado_civil?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          ocupacion?: string | null
          propietario_id?: string | null
          sexo?: string | null
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
      dependientes: {
        Row: {
          cedula: string | null
          cliente_id: string
          created_at: string
          empresa_id: string
          fecha_nacimiento: string | null
          id: string
          nombre: string
          parentesco: string | null
        }
        Insert: {
          cedula?: string | null
          cliente_id: string
          created_at?: string
          empresa_id: string
          fecha_nacimiento?: string | null
          id?: string
          nombre: string
          parentesco?: string | null
        }
        Update: {
          cedula?: string | null
          cliente_id?: string
          created_at?: string
          empresa_id?: string
          fecha_nacimiento?: string | null
          id?: string
          nombre?: string
          parentesco?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dependientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dependientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_perfil: {
        Row: {
          correo: string | null
          direccion: string | null
          empresa_id: string
          logo_path: string | null
          nombre_comercial: string | null
          rnc: string | null
          sitio_web: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          correo?: string | null
          direccion?: string | null
          empresa_id: string
          logo_path?: string | null
          nombre_comercial?: string | null
          rnc?: string | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          correo?: string | null
          direccion?: string | null
          empresa_id?: string
          logo_path?: string | null
          nombre_comercial?: string | null
          rnc?: string | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_perfil_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
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
          motivo_perdida: string | null
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
          motivo_perdida?: string | null
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
          motivo_perdida?: string | null
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
      permisos_modulo: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          modulo: string
          nivel: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          modulo: string
          nivel: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          modulo?: string
          nivel?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permisos_modulo_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      poliza_documentos: {
        Row: {
          content_type: string | null
          created_at: string
          empresa_id: string
          id: string
          nombre_archivo: string
          poliza_id: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          nombre_archivo: string
          poliza_id: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          nombre_archivo?: string
          poliza_id?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poliza_documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poliza_documentos_poliza_id_fkey"
            columns: ["poliza_id"]
            isOneToOne: false
            referencedRelation: "polizas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poliza_documentos_poliza_id_fkey"
            columns: ["poliza_id"]
            isOneToOne: false
            referencedRelation: "v_polizas_vencen_semana"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poliza_documentos_poliza_id_fkey"
            columns: ["poliza_id"]
            isOneToOne: false
            referencedRelation: "v_polizas_vencidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poliza_documentos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polizas: {
        Row: {
          aseguradora_id: string
          beneficiarios: string | null
          cliente_id: string
          comision_monto: number | null
          comision_tipo: Database["public"]["Enums"]["comision_tipo"] | null
          comision_valor: number | null
          created_at: string
          deducible: number | null
          empresa_id: string
          estado: Database["public"]["Enums"]["policy_status"]
          fecha_emision: string
          fecha_vencimiento: string
          id: string
          moneda: Database["public"]["Enums"]["moneda_poliza"]
          monto: number
          notas: string | null
          numero_poliza: string
          oportunidad_id: string | null
          plan_pago: Database["public"]["Enums"]["payment_plan"]
          producto: string
          propietario_id: string | null
          suma_asegurada: number | null
          updated_at: string
        }
        Insert: {
          aseguradora_id: string
          beneficiarios?: string | null
          cliente_id: string
          comision_monto?: number | null
          comision_tipo?: Database["public"]["Enums"]["comision_tipo"] | null
          comision_valor?: number | null
          created_at?: string
          deducible?: number | null
          empresa_id: string
          estado?: Database["public"]["Enums"]["policy_status"]
          fecha_emision: string
          fecha_vencimiento: string
          id?: string
          moneda?: Database["public"]["Enums"]["moneda_poliza"]
          monto: number
          notas?: string | null
          numero_poliza: string
          oportunidad_id?: string | null
          plan_pago: Database["public"]["Enums"]["payment_plan"]
          producto: string
          propietario_id?: string | null
          suma_asegurada?: number | null
          updated_at?: string
        }
        Update: {
          aseguradora_id?: string
          beneficiarios?: string | null
          cliente_id?: string
          comision_monto?: number | null
          comision_tipo?: Database["public"]["Enums"]["comision_tipo"] | null
          comision_valor?: number | null
          created_at?: string
          deducible?: number | null
          empresa_id?: string
          estado?: Database["public"]["Enums"]["policy_status"]
          fecha_emision?: string
          fecha_vencimiento?: string
          id?: string
          moneda?: Database["public"]["Enums"]["moneda_poliza"]
          monto?: number
          notas?: string | null
          numero_poliza?: string
          oportunidad_id?: string | null
          plan_pago?: Database["public"]["Enums"]["payment_plan"]
          producto?: string
          propietario_id?: string | null
          suma_asegurada?: number | null
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
            foreignKeyName: "polizas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polizas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "v_oportunidades_semana"
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
      rate_limits: {
        Row: {
          clave: string
          intentos: number
          ventana_inicio: string
        }
        Insert: {
          clave: string
          intentos?: number
          ventana_inicio?: string
        }
        Update: {
          clave?: string
          intentos?: number
          ventana_inicio?: string
        }
        Relationships: []
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
          oportunidad_id: string | null
          poliza_id: string | null
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
          oportunidad_id?: string | null
          poliza_id?: string | null
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
          oportunidad_id?: string | null
          poliza_id?: string | null
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
          {
            foreignKeyName: "tareas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "v_oportunidades_semana"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_poliza_id_fkey"
            columns: ["poliza_id"]
            isOneToOne: false
            referencedRelation: "polizas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_poliza_id_fkey"
            columns: ["poliza_id"]
            isOneToOne: false
            referencedRelation: "v_polizas_vencen_semana"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_poliza_id_fkey"
            columns: ["poliza_id"]
            isOneToOne: false
            referencedRelation: "v_polizas_vencidas"
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
      v_monto_ganado: {
        Row: {
          monto_ganado: number | null
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
      v_prima_activa_por_moneda: {
        Row: {
          moneda: Database["public"]["Enums"]["moneda_poliza"] | null
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
      crear_tareas_renovacion: { Args: never; Returns: undefined }
      current_user_empresa_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      provisionar_empresa: { Args: { p_nombre: string }; Returns: string }
      reporte_mensual: {
        Args: { meses?: number }
        Returns: {
          clientes_nuevos: number
          mes: string
          monto_ganado: number
          oportunidades_ganadas: number
          oportunidades_perdidas: number
          polizas_vendidas: number
          primas_dop: number
          primas_usd: number
          tareas_completadas: number
          tareas_totales: number
        }[]
      }
      sembrar_aseguradoras_default: {
        Args: { p_empresa: string }
        Returns: undefined
      }
      sembrar_perfil_empresa_default: {
        Args: { p_empresa: string }
        Returns: undefined
      }
      sembrar_permisos_default: {
        Args: { p_empresa: string }
        Returns: undefined
      }
      verificar_rate_limit: {
        Args: {
          p_clave: string
          p_max_intentos: number
          p_ventana_segundos: number
        }
        Returns: boolean
      }
    }
    Enums: {
      comision_tipo: "monto" | "porcentaje"
      moneda_poliza: "DOP" | "USD"
      opportunity_status: "abierta" | "ganada" | "perdida"
      payment_plan: "unico" | "mensual" | "trimestral" | "semestral" | "anual"
      policy_status: "activa" | "vencida" | "cancelada"
      task_status: "pendiente" | "completada"
      user_role: "Admin" | "Manager" | "Gerente" | "Corredor"
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
      comision_tipo: ["monto", "porcentaje"],
      moneda_poliza: ["DOP", "USD"],
      opportunity_status: ["abierta", "ganada", "perdida"],
      payment_plan: ["unico", "mensual", "trimestral", "semestral", "anual"],
      policy_status: ["activa", "vencida", "cancelada"],
      task_status: ["pendiente", "completada"],
      user_role: ["Admin", "Manager", "Gerente", "Corredor"],
    },
  },
} as const

// Convenience aliases used across queries/actions/components.
export type PolicyStatus = Database["public"]["Enums"]["policy_status"]
export type PaymentPlan = Database["public"]["Enums"]["payment_plan"]
export type OpportunityStatus = Database["public"]["Enums"]["opportunity_status"]
export type TaskStatus = Database["public"]["Enums"]["task_status"]
export type UserRole = Database["public"]["Enums"]["user_role"]
export type MonedaPoliza = Database["public"]["Enums"]["moneda_poliza"]
export type ComisionTipo = Database["public"]["Enums"]["comision_tipo"]
