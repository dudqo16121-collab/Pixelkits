'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'

interface UserContextType {
  userName: string
  userEmail: string
  userId: string | null
  isAdmin:   boolean  
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  userName: '', userEmail: '', userId: null,
  isAdmin: false,
  refreshUser: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName,  setUserName]  = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId,    setUserId]    = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)  // ← 추가
  
  async function refreshUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUserName(''); setUserEmail(''); setUserId(null); return }
    setIsAdmin(false)

    setUserEmail(user.email ?? '')
    setUserId(user.id)
  
    const { data: { session } } = await supabase.auth.getSession()
  const role = session?.user?.app_metadata?.role
  setIsAdmin(role === 'admin')

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, is_admin')
      .eq('id', user.id)
      .single()

    setUserName(
      profile?.name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      ''
    )
    setIsAdmin(profile?.is_admin || false)
  }

  useEffect(() => {
    refreshUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshUser()
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ userName, userEmail, userId, isAdmin, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}