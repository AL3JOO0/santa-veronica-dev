'use client'

import { usePathname } from 'next/navigation'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { AdminAuthGate } from '@/components/auth/admin-auth-gate'

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

  return (
    <AdminAuthGate>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AdminAuthGate>
  )
}
