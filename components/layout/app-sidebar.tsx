'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  Users,
  Images,
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

const mainNav = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Universidades', href: '/universidades', icon: GraduationCap },
  { title: 'Eventos', href: '/eventos', icon: CalendarDays },
  { title: 'Estudiantes', href: '/estudiantes', icon: Users },
  { title: 'Fotografías', href: '/fotografias', icon: Images },
]

const secondaryNav = [
  { title: 'Configuración', href: '/configuracion', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

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
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-muted text-xs font-medium">
              AM
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">
              Ana Morales
            </span>

            <span className="truncate text-xs text-muted-foreground">
              Administradora
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}