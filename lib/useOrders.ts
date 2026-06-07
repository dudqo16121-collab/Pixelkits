import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/UserContext'

export interface OrderWithTemplate {
  id:                 string
  order_number:       string
  amount:             number
  original_amount:    number
  discount_amount:    number
  payment_method:     string
  status:             string
  download_token:     string
  token_expires_at:   string
  created_at:         string
  download_count:     number
  max_download_count: number
  templates: {
    name:  string
    slug:  string
    stack: string[]
  } | null
}

export function useOrders() {
  const { userId } = useUser()
  const router     = useRouter()

  const [orders,     setOrders]     = useState<OrderWithTemplate[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState<string | null>(null)

  useEffect(() => {
    if (userId === null) return
    if (!userId) { router.push('/login'); return }
    fetchOrders()
  }, [userId])

  async function fetchOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select(`
        id, order_number, amount, original_amount, discount_amount,
        payment_method, status, download_token, token_expires_at, created_at,
        download_count, max_download_count,
        templates ( name, slug, stack )
      `)
      .eq('user_id', userId!)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    setOrders((data ?? []) as unknown as OrderWithTemplate[])
    setLoading(false)
  }

  async function refreshToken(orderId: string): Promise<boolean> {
    setRefreshing(orderId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/download/refresh', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error); return false }

      setOrders((prev) => prev.map((o) =>
        o.id === orderId
          ? { ...o, token_expires_at: data.tokenExpiresAt, download_count: 0 }
          : o
      ))
      return true
    } finally {
      setRefreshing(null)
    }
  }

  function incrementDownloadCount(orderId: string) {
    setOrders((prev) => prev.map((o) =>
      o.id === orderId
        ? { ...o, download_count: (o.download_count ?? 0) + 1 }
        : o
    ))
  }

  return { orders, loading, refreshing, refreshToken, incrementDownloadCount }
}