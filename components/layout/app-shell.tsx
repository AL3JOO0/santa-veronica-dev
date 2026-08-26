'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

const AdminShell = dynamic(
  () => import('@/components/layout/admin-shell').then((module) => module.AdminShell),
)

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isClientPortal = pathname.startsWith('/cliente')
  const isLoginPage =
    pathname === '/login' ||
    pathname === '/admin/login' ||
    pathname === '/cliente/login'

  if (isClientPortal || isLoginPage) {
    return <>{children}</>
  }

  return <AdminShell>{children}</AdminShell>
}
