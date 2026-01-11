export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
        }
      }
      iphones: {
        Row: {
          id: string
          model: string
          storage: string
          color: string
          imei: string
          purchase_cost: number
          selling_price: number
          supplier_name: string | null
          purchase_date: string
          status: 'in_stock' | 'sold'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          model: string
          storage: string
          color: string
          imei: string
          purchase_cost: number
          selling_price: number
          supplier_name?: string | null
          purchase_date: string
          status?: 'in_stock' | 'sold'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          model?: string
          storage?: string
          color?: string
          imei?: string
          purchase_cost?: number
          selling_price?: number
          supplier_name?: string | null
          purchase_date?: string
          status?: 'in_stock' | 'sold'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone_number: string
          nic: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone_number: string
          nic?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone_number?: string
          nic?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          iphone_id: string
          customer_id: string
          actual_selling_price: number
          payment_method: 'cash' | 'card' | 'bank_transfer'
          discount: number
          profit: number
          sale_date: string
          created_at: string
        }
        Insert: {
          id?: string
          iphone_id: string
          customer_id: string
          actual_selling_price: number
          payment_method: 'cash' | 'card' | 'bank_transfer'
          discount?: number
          profit: number
          sale_date: string
          created_at?: string
        }
        Update: {
          id?: string
          iphone_id?: string
          customer_id?: string
          actual_selling_price?: number
          payment_method?: 'cash' | 'card' | 'bank_transfer'
          discount?: number
          profit?: number
          sale_date?: string
          created_at?: string
        }
      }
    }
  }
}

export type IPhone = Database['public']['Tables']['iphones']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Sale = Database['public']['Tables']['sales']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
