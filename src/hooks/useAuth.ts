import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })
      .catch(() => { /* env vars not set — guest mode only */ })
      .finally(() => setLoading(false))

    let unsubscribe = () => {}
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null)
      })
      unsubscribe = () => subscription.unsubscribe()
    } catch { /* no-op */ }

    return unsubscribe
  }, [])

  const signOut = () => supabase.auth.signOut()

  return { user, loading, signOut }
}
