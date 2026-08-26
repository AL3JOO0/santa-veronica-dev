'use client'

import { AdminAuthGate } from '@/components/auth/admin-auth-gate'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export function AdminShell({ children }: { children: React.ReactNode }) {
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
