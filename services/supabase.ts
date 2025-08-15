import { createClient } from '@supabase/supabase-js';
import type {
    User,
    Signal,
    LiveSignalHistoryItem,
    AILearningProgress,
    AIBotLifetimeStats,
    AIBotHistoryItem,
    BankrollManagement,
    LuxSignalsBotState,
    LearnedPatterns,
    AdminSignal,
    SocialPost,
    Suggestion,
    AuditLogEntry,
    Notification
} from '../types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Generic for key-value tables with user_id as PK
interface UserScopedTable<T> {
    Row: {
        user_id: string;
        data: T;
    };
    Insert: {
        user_id: string;
        data: T;
    };
    Update: Partial<{
        user_id: string;
        data: T;
    }>;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      plays_history: {
        Row: {
            user_id: string;
            multiplier: number;
            play_date: string;
            play_time: string;
        };
        Insert: {
            user_id: string;
            multiplier: number;
            play_date: string;
            play_time: string;
        };
        Update: Partial<{
            multiplier: number;
            play_date: string;
            play_time: string;
        }>;
      };
      notifications: {
        Row: Notification & { user_id: string };
        Insert: Notification & { user_id: string };
        Update: Partial<Notification>;
      };
      signal_history: UserScopedTable<Signal[]>;
      live_signal_history: UserScopedTable<LiveSignalHistoryItem[]>;
      ai_learning_progress: UserScopedTable<AILearningProgress>;
      ai_bot_lifetime_stats: UserScopedTable<AIBotLifetimeStats>;
      ai_bot_history: UserScopedTable<AIBotHistoryItem[]>;
      bankroll_management: UserScopedTable<BankrollManagement>;
      lux_signals_bot: UserScopedTable<LuxSignalsBotState>;
      learned_patterns: UserScopedTable<LearnedPatterns | null>;
      backups: UserScopedTable<any>;
      admin_signals: {
        Row: AdminSignal;
        Insert: AdminSignal;
        Update: Partial<AdminSignal>;
      };
      social_posts: {
        Row: SocialPost;
        Insert: Omit<SocialPost, 'id'>;
        Update: Partial<Omit<SocialPost, 'id'>>;
      };
      suggestions: {
        Row: Suggestion;
        Insert: Omit<Suggestion, 'id'>;
        Update: Partial<Omit<Suggestion, 'id'>>;
      };
      user_follows: {
        Row: {
            follower_id: string;
            following_id: string;
        };
        Insert: {
            follower_id: string;
            following_id: string;
        };
        Update: {};
      };
      audit_log: {
        Row: AuditLogEntry;
        Insert: Omit<AuditLogEntry, 'id'>;
        Update: Partial<Omit<AuditLogEntry, 'id'>>;
      };
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


const supabaseUrl = 'https://hpnbhubliuyxbjrclmie.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwbmJodWJsaXV5eGJqcmNsbWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNjc1MDcsImV4cCI6MjA3MDg0MzUwN30.69JTHUmvr2zMtTxqlwLWSGamgdmqryb2pYmLdY7wrAw';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);