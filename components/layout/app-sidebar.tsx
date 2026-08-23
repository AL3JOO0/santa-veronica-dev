'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  Settings,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  getSession,
  logout,
  type AppSession,
} from '@/lib/services/auth.service'

const mainNav = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Universidades', href: '/universidades', icon: GraduationCap },
  { title: 'Eventos', href: '/eventos', icon: CalendarDays },
]

const secondaryNav = [
  { title: 'Configuración', href: '/configuracion', icon: Settings },
]

function getInitials(name?: string) {
  if (!name) return 'SV'

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SV'
}

function getRoleLabel(role?: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Administradora'
    case 'PRODUCTION':
      return 'Producción'
    case 'PHOTOGRAPHER':
      return 'Fotógrafo'
    default:
      return 'Usuario'
  }
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = React.useState<AppSession | null>(null)

  React.useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null))
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  async function handleLogout() {
    await logout()
    router.replace('/login')
    router.refresh()
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <Link
          href="/"
          className="flex w-full items-center justify-center overflow-hidden rounded-xl bg-white px-3 py-2 transition-all duration-300 hover:shadow-sm"
        >
          <Image
            src="/LOGOSV.jpg"
            alt="Santa Verónica Estudio"
            width={4030}
            height={1975}
            priority
            className="h-auto w-full max-w-[190px] object-contain"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar sesión"
          className="flex w-full items-center gap-3 text-left"
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-muted text-xs font-medium">
              {getInitials(session?.displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">
              {session?.displayName || 'Santa Verónica'}
            </span>

            <span className="truncate text-xs text-muted-foreground">
              {getRoleLabel(session?.role)}
            </span>
          </div>
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}