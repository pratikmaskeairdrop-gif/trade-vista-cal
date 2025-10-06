import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name?: string
  account_balance: number
  default_risk_percent: number
  created_at: string
  updated_at: string
}

export interface TradeRecord {
  id: string
  user_id: string
  pair: string
  entry_price?: number
  exit_price?: number
  stop_loss?: number
  take_profit?: number
  position_size: number
  profit_usd: number
  profit_rr: number
  is_win: boolean
  entry_method: 'simple' | 'detailed'
  account_balance_at_trade: number
  risk_percent?: number
  trade_date: string
  created_at: string
  updated_at: string
}

// Database service functions
export class DatabaseService {
  // User Profile functions
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  static async createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profile])
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return null
    }

    return data
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }

    return data
  }

  // Trade functions
  static async getUserTrades(userId: string): Promise<TradeRecord[]> {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('trade_date', { ascending: false })

    if (error) {
      console.error('Error fetching trades:', error)
      return []
    }

    return data || []
  }

  static async createTrade(trade: Omit<TradeRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TradeRecord | null> {
    const { data, error } = await supabase
      .from('trades')
      .insert([trade])
      .select()
      .single()

    if (error) {
      console.error('Error creating trade:', error)
      return null
    }

    return data
  }

  static async updateTrade(tradeId: string, updates: Partial<TradeRecord>): Promise<TradeRecord | null> {
    const { data, error } = await supabase
      .from('trades')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', tradeId)
      .select()
      .single()

    if (error) {
      console.error('Error updating trade:', error)
      return null
    }

    return data
  }

  static async deleteTrade(tradeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', tradeId)

    if (error) {
      console.error('Error deleting trade:', error)
      return false
    }

    return true
  }
}

// Authentication functions
export class AuthService {
  static async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    return { data, error }
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data, error }
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}