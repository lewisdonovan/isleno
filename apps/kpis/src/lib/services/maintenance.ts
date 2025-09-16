/**
 * Maintenance Mode Service
 * 
 * This service provides functions for managing the maintenance mode system.
 * It handles CET timezone conversion and provides both server-side and client-side
 * maintenance management capabilities.
 */

import { supabaseServer } from '@/lib/supabaseServer'
import { supabaseClient } from '@/lib/supabaseClient'
import type { Database } from '@isleno/types/db/public'

// Use generated types from the database
export type MaintenanceInfo = Database['public']['Tables']['maintenance_status']['Row']

export interface CreateMaintenanceRequest {
  startTime: string // ISO string in CET timezone
  endTime: string   // ISO string in CET timezone
  reason?: string
}

/**
 * Server-side maintenance service (for API routes and server components)
 */
export class ServerMaintenanceService {
  private async getSupabase() {
    return await supabaseServer()
  }

  /**
   * Check if maintenance is currently active
   */
  async isMaintenanceActive(): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await (supabase as any).rpc('is_maintenance_active')

      if (error) {
        console.error('Error checking maintenance status:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('Error checking maintenance status:', error)
      return false
    }
  }

  /**
   * Get current maintenance information
   */
  async getCurrentMaintenance(): Promise<MaintenanceInfo | null> {
    try {
      const supabase = await this.getSupabase()
      const { data, error } = await (supabase as any).rpc('get_current_maintenance')

      if (error) {
        console.error('Error getting maintenance info:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error getting maintenance info:', error)
      return null
    }
  }

  /**
   * Create a new maintenance window
   */
  async createMaintenanceWindow(request: CreateMaintenanceRequest): Promise<MaintenanceInfo | null> {
    try {
      const supabase = await this.getSupabase()
      
      // Check if there's already an active maintenance window
      const { data: existingActive } = await supabase
        .from('maintenance_status')
        .select('id')
        .eq('is_active', true)
        .single()

      if (existingActive) {
        throw new Error('There is already an active maintenance window')
      }

      // Create new maintenance window
      const { data: newMaintenance, error } = await supabase
        .from('maintenance_status')
        .insert({
          is_active: true,
          start_time: request.startTime,
          end_time: request.endTime,
          reason: request.reason || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating maintenance window:', error)
        return null
      }

      return newMaintenance as MaintenanceInfo
    } catch (error) {
      console.error('Error creating maintenance window:', error)
      return null
    }
  }

  /**
   * End current maintenance window
   */
  async endMaintenanceWindow(): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      const { error } = await supabase
        .from('maintenance_status')
        .update({ is_active: false })
        .eq('is_active', true)

      if (error) {
        console.error('Error ending maintenance window:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error ending maintenance window:', error)
      return false
    }
  }

  /**
   * Cleanup expired maintenance windows
   */
  async cleanupExpiredMaintenance(): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      await (supabase as any).rpc('cleanup_expired_maintenance')
    } catch (error) {
      console.error('Error cleaning up expired maintenance:', error)
    }
  }
}

/**
 * Client-side maintenance service (for client components)
 */
export class ClientMaintenanceService {
  private supabase = supabaseClient

  /**
   * Check if maintenance is currently active
   */
  async isMaintenanceActive(): Promise<boolean> {
    try {
      const { data, error } = await (this.supabase as any).rpc('is_maintenance_active')

      if (error) {
        console.error('Error checking maintenance status:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('Error checking maintenance status:', error)
      return false
    }
  }

  /**
   * Get current maintenance information
   */
  async getCurrentMaintenance(): Promise<MaintenanceInfo | null> {
    try {
      const { data, error } = await (this.supabase as any).rpc('get_current_maintenance')

      if (error) {
        console.error('Error getting maintenance info:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error getting maintenance info:', error)
      return null
    }
  }
}

/**
 * Maintenance utility functions
 */
export class MaintenanceUtils {
  /**
   * Convert local time to CET timezone
   */
  static toCET(date: Date): Date {
    // Convert to CET (Europe/Madrid timezone)
    const cetDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
    return cetDate
  }

  /**
   * Format datetime for display in CET timezone
   */
  static formatDateTime(dateTimeString: string, locale: string = 'en-GB'): { time: string; date: string } {
    try {
      const date = new Date(dateTimeString)
      
      // Format time in HH:mm format
      const time = date.toLocaleTimeString(locale, {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
      // Format date in DD/MM/YYYY format
      const formattedDate = date.toLocaleDateString(locale, {
        timeZone: 'Europe/Madrid',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      
      return { time, date: formattedDate }
    } catch (error) {
      console.error('Error formatting datetime:', error)
      return { time: '--:--', date: '--/--/----' }
    }
  }

  /**
   * Get current CET time
   */
  static getCurrentCETTime(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
  }

  /**
   * Create a maintenance window for a specific duration
   */
  static createMaintenanceWindow(
    startTime: Date, 
    durationMinutes: number, 
    reason?: string
  ): CreateMaintenanceRequest {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)
    
    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      reason
    }
  }

  /**
   * Validate maintenance window times
   */
  static validateMaintenanceWindow(request: CreateMaintenanceRequest): { valid: boolean; error?: string } {
    const start = new Date(request.startTime)
    const end = new Date(request.endTime)
    const now = new Date()

    if (end <= start) {
      return { valid: false, error: 'End time must be after start time' }
    }

    if (start <= now) {
      return { valid: false, error: 'Start time must be in the future' }
    }

    return { valid: true }
  }
}

// Export singleton instances
export const serverMaintenanceService = new ServerMaintenanceService()
export const clientMaintenanceService = new ClientMaintenanceService()
