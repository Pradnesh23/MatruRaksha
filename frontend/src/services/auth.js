// MatruRaksha AI - Authentication Service
// Frontend authentication using Supabase

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in environment variables')
}

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

/**
 * Authentication Service
 */
class AuthService {
  _composeUser(base, profile) {
    const metaRole = base?.user_metadata?.role || base?.app_metadata?.role
    const resolvedRole = (profile?.role || metaRole || null)
    const normalizedRole = resolvedRole
      ? String(resolvedRole).toUpperCase()
      : null

    const composed = {
      id: base?.id,
      email: base?.email,
      role: normalizedRole,
      full_name: profile?.full_name || base?.user_metadata?.full_name || null,
      phone: profile?.phone || null,
      assigned_area: profile?.assigned_area || null,
      avatar_url: profile?.avatar_url || null,
      is_active: profile?.is_active ?? true
    }
    return composed
  }

  async _ensureProfileRole(userId, metadataRole) {
    if (!metadataRole) return null
    try {
      const roleValue = String(metadataRole).toUpperCase()
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role: roleValue })
        .eq('id', userId)
        .select()
        .single()
      if (error) return null
      return data
    } catch {
      return null
    }
  }
  /**
   * Sign up new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Result with user and session
   */
  async signUp({ email, password, fullName, role, phone, assignedArea }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role || 'ASHA_WORKER',
            phone,
            assigned_area: assignedArea
          }
        }
      })

      if (error) throw error

      return {
        success: true,
        user: data.user,
        session: data.session,
        message: 'Registration successful! Please check your email to verify your account.'
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw new Error(error.message || 'Sign up failed')
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Result with user and session
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      let profile = await this.getUserProfile(data.user.id)
      let merged = this._composeUser(data.user, profile)
      if (!merged.role && data.user?.user_metadata?.role) {
        const updated = await this._ensureProfileRole(data.user.id, data.user.user_metadata.role)
        if (updated) {
          profile = updated
          merged = this._composeUser(data.user, profile)
        }
      }
      return { success: true, user: merged, session: data.session }
    } catch (error) {
      console.error('Sign in error:', error)
      throw new Error(error.message || 'Sign in failed')
    }
  }

  /**
   * Sign in with Google OAuth
   * @returns {Promise<Object>} Result with redirect URL
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      return {
        success: true,
        url: data.url
      }
    } catch (error) {
      console.error('Google OAuth error:', error)
      throw new Error(error.message || 'Google sign in failed')
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<Object>} Result
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      return {
        success: true,
        message: 'Signed out successfully'
      }
    } catch (error) {
      console.error('Sign out error:', error)
      throw new Error(error.message || 'Sign out failed')
    }
  }

  /**
   * Get current user
   * @returns {Promise<Object|null>} Current user or null
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) throw error
      if (!user) return null

      let profile = await this.getUserProfile(user.id)
      let merged = this._composeUser(user, profile)
      if (!merged.role && user?.user_metadata?.role) {
        const updated = await this._ensureProfileRole(user.id, user.user_metadata.role)
        if (updated) {
          profile = updated
          merged = this._composeUser(user, profile)
        }
      }
      return merged
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  /**
   * Get user profile from database
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      return data || {}
    } catch (error) {
      console.error('Get user profile error:', error)
      return {}
    }
  }

  /**
   * Get current session
   * @returns {Promise<Object|null>} Current session or null
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) throw error

      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  /**
   * Refresh session
   * @returns {Promise<Object>} New session
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) throw error

      return {
        success: true,
        session: data.session
      }
    } catch (error) {
      console.error('Refresh session error:', error)
      throw new Error(error.message || 'Session refresh failed')
    }
  }

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(updates) {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: updates.fullName,
          phone: updates.phone,
          assigned_area: updates.assignedArea,
          avatar_url: updates.avatarUrl
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        profile: data
      }
    } catch (error) {
      console.error('Update profile error:', error)
      throw new Error(error.message || 'Profile update failed')
    }
  }

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise<Object>} Result
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      return {
        success: true,
        message: 'Password reset email sent! Please check your inbox.'
      }
    } catch (error) {
      console.error('Reset password error:', error)
      throw new Error(error.message || 'Password reset failed')
    }
  }

  /**
   * Update password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return {
        success: true,
        message: 'Password updated successfully'
      }
    } catch (error) {
      console.error('Update password error:', error)
      throw new Error(error.message || 'Password update failed')
    }
  }

  /**
   * Listen to auth state changes
   * @param {Function} callback - Callback function
   * @returns {Object} Unsubscribe function
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        let user = null
        
        if (session?.user) {
          let profile = await this.getUserProfile(session.user.id)
          let merged = this._composeUser(session.user, profile)
          if (!merged.role && session.user?.user_metadata?.role) {
            const updated = await this._ensureProfileRole(session.user.id, session.user.user_metadata.role)
            if (updated) {
              profile = updated
              merged = this._composeUser(session.user, profile)
            }
          }
          user = merged
        }

        callback(event, session, user)
      }
    )

    return subscription
  }

  /**
   * Check if user has required role
   * @param {Object} user - User object
   * @param {Array<string>} allowedRoles - Allowed roles
   * @returns {boolean} True if user has allowed role
   */
  hasRole(user, allowedRoles) {
    if (!user || !user.role) return false
    return allowedRoles.includes(user.role)
  }

  /**
   * Get users by role (Admin only)
   * @param {string} role - User role
   * @param {string} assignedArea - Optional area filter
   * @returns {Promise<Array>} List of users
   */
  async getUsersByRole(role, assignedArea = null) {
    try {
      let query = supabase
        .from('user_profiles')
        .select('*')
        .eq('role', role)

      if (assignedArea) {
        query = query.eq('assigned_area', assignedArea)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Get users by role error:', error)
      return []
    }
  }
}

// Create singleton instance
const authService = new AuthService()

export default authService
