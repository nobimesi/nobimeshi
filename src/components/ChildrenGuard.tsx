'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

export default function ChildrenGuard() {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const checked = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated') return
    if (checked.current) return
    if (pathname === '/onboarding') return

    checked.current = true

    fetch('/api/children')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.children) && data.children.length === 0) {
          router.replace('/onboarding')
        }
      })
      .catch(() => {})
  }, [status, pathname, router])

  return null
}
