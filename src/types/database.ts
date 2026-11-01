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
      auditoria: {
        Row: {
          accion: string
          created_at: string
          detalle: Json
          entidad: string
          entidad_id: string | null
          id: number
          taller_id: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string
          detalle?: Json
          entidad: string
          entidad_id?: string | null
          id?: never
          taller_id: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          detalle?: Json
          entidad?: string
          entidad_id?: string | null
          id?: never
          taller_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      bodegas: {
        Row: {
          activo: boolean
          created_at: string
          es_principal: boolean
          id: string
          nombre: string
          taller_id: string
          ubicacion: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          es_principal?: boolean
          id?: string
          nombre: string
          taller_id: string
          ubicacion?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          es_principal?: boolean
          id?: string
          nombre?: string
          taller_id?: string
          ubicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bodegas_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_productos: {
        Row: {
          activo: boolean
          color: string
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          taller_id: string
          tipo: string
        }
        Insert: {
          activo?: boolean
          color?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          taller_id: string
          tipo?: string
        }
        Update: {
          activo?: boolean
          color?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          taller_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_productos_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          activo: boolean
          ciudad: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          rut: string | null
          taller_id: string
          telefono: string | null
          telefono_secundario: string | null
          tipo_persona: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          rut?: string | null
          taller_id: string
          telefono?: string | null
          telefono_secundario?: string | null
          tipo_persona?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          rut?: string | null
          taller_id?: string
          telefono?: string | null
          telefono_secundario?: string | null
          tipo_persona?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_taller: {
        Row: {
          created_at: string
          impuesto_porcentaje: number
          prefijo_ot: string
          proximo_folio_ot: number
          stock_negativo_permitido: boolean
          taller_id: string
          tema_preferido: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          impuesto_porcentaje?: number
          prefijo_ot?: string
          proximo_folio_ot?: number
          stock_negativo_permitido?: boolean
          taller_id: string
          tema_preferido?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          impuesto_porcentaje?: number
          prefijo_ot?: string
          proximo_folio_ot?: number
          stock_negativo_permitido?: boolean
          taller_id?: string
          tema_preferido?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_taller_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: true
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_stock: {
        Row: {
          bodega_id: string
          cantidad_delta: number
          costo_unitario: number
          created_at: string
          id: string
          motivo: string
          producto_id: string
          referencia: string | null
          taller_id: string
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          bodega_id: string
          cantidad_delta: number
          costo_unitario?: number
          created_at?: string
          id?: string
          motivo: string
          producto_id: string
          referencia?: string | null
          taller_id: string
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          bodega_id?: string
          cantidad_delta?: number
          costo_unitario?: number
          created_at?: string
          id?: string
          motivo?: string
          producto_id?: string
          referencia?: string | null
          taller_id?: string
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_stock_bodega_id_fkey"
            columns: ["bodega_id"]
            isOneToOne: false
            referencedRelation: "bodegas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_stock_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nombre_completo: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nombre_completo?: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nombre_completo?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean
          categoria_id: string | null
          codigo_barras: string | null
          controla_stock: boolean
          costo_unitario: number
          created_at: string
          descripcion: string | null
          id: string
          marca: string | null
          modelo_compatible: string | null
          nombre: string
          precio_venta: number
          proveedor_principal_id: string | null
          sku: string | null
          stock_maximo: number | null
          stock_minimo: number
          taller_id: string
          tipo: string
          unidad: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria_id?: string | null
          codigo_barras?: string | null
          controla_stock?: boolean
          costo_unitario?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          marca?: string | null
          modelo_compatible?: string | null
          nombre: string
          precio_venta?: number
          proveedor_principal_id?: string | null
          sku?: string | null
          stock_maximo?: number | null
          stock_minimo?: number
          taller_id: string
          tipo?: string
          unidad?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria_id?: string | null
          codigo_barras?: string | null
          controla_stock?: boolean
          costo_unitario?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          marca?: string | null
          modelo_compatible?: string | null
          nombre?: string
          precio_venta?: number
          proveedor_principal_id?: string | null
          sku?: string | null
          stock_maximo?: number | null
          stock_minimo?: number
          taller_id?: string
          tipo?: string
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_proveedor_principal_id_fkey"
            columns: ["proveedor_principal_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean
          contacto: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          notas: string | null
          razon_social: string
          rut: string | null
          taller_id: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          notas?: string | null
          razon_social: string
          rut?: string | null
          taller_id: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          notas?: string | null
          razon_social?: string
          rut?: string | null
          taller_id?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          bodega_id: string
          cantidad: number
          id: string
          producto_id: string
          reservado: number
          taller_id: string
          updated_at: string
        }
        Insert: {
          bodega_id: string
          cantidad?: number
          id?: string
          producto_id: string
          reservado?: number
          taller_id: string
          updated_at?: string
        }
        Update: {
          bodega_id?: string
          cantidad?: number
          id?: string
          producto_id?: string
          reservado?: number
          taller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_bodega_id_fkey"
            columns: ["bodega_id"]
            isOneToOne: false
            referencedRelation: "bodegas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      talleres: {
        Row: {
          activo: boolean
          ciudad: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          moneda: string
          nombre: string
          rut: string | null
          telefono: string | null
          updated_at: string
          zona_horaria: string
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          moneda?: string
          nombre: string
          rut?: string | null
          telefono?: string | null
          updated_at?: string
          zona_horaria?: string
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          moneda?: string
          nombre?: string
          rut?: string | null
          telefono?: string | null
          updated_at?: string
          zona_horaria?: string
        }
        Relationships: []
      }
      usuarios_taller: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          rol: string
          taller_id: string
          usuario_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          rol: string
          taller_id: string
          usuario_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          rol?: string
          taller_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_taller_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculos: {
        Row: {
          activo: boolean
          anio: number | null
          cliente_id: string
          color: string | null
          combustible: string | null
          created_at: string
          id: string
          kilometraje: number
          marca: string
          modelo: string
          motor: string | null
          notas: string | null
          patente: string
          taller_id: string
          transmision: string | null
          updated_at: string
          vin: string | null
        }
        Insert: {
          activo?: boolean
          anio?: number | null
          cliente_id: string
          color?: string | null
          combustible?: string | null
          created_at?: string
          id?: string
          kilometraje?: number
          marca: string
          modelo: string
          motor?: string | null
          notas?: string | null
          patente: string
          taller_id: string
          transmision?: string | null
          updated_at?: string
          vin?: string | null
        }
        Update: {
          activo?: boolean
          anio?: number | null
          cliente_id?: string
          color?: string | null
          combustible?: string | null
          created_at?: string
          id?: string
          kilometraje?: number
          marca?: string
          modelo?: string
          motor?: string | null
          notas?: string | null
          patente?: string
          taller_id?: string
          transmision?: string | null
          updated_at?: string
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculos_taller_id_fkey"
            columns: ["taller_id"]
            isOneToOne: false
            referencedRelation: "talleres"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crear_taller_inicial: {
        Args: {
          p_cargar_demo?: boolean
          p_email?: string
          p_nombre: string
          p_telefono?: string
        }
        Returns: string
      }
      registrar_movimiento_stock: {
        Args: {
          p_bodega_id: string
          p_cantidad: number
          p_costo_unitario?: number
          p_motivo?: string
          p_producto_id: string
          p_referencia?: string
          p_taller_id: string
          p_tipo: string
        }
        Returns: string
      }
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
