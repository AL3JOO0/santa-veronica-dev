'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useStore } from '@/lib/store'

interface Crumb {
  label: string
  href?: string
}

export function AppHeader() {
  const pathname = usePathname()
  const store = useStore()

  const crumbs = React.useMemo<Crumb[]>(() => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 0) return [{ label: 'Dashboard' }]

    const [root, id] = parts

    const uniCrumb = (uniId: string): Crumb[] => {
      const uni = store.getUniversity(uniId)
      return [
        { label: 'Universidades', href: '/universidades' },
        {
          label: uni?.name ?? 'Universidad',
          href: `/universidades/${uniId}`,
        },
      ]
    }

    if (root === 'universidades') {
      const base: Crumb[] = [{ label: 'Universidades', href: '/universidades' }]
      if (id) {
        const uni = store.getUniversity(id)
        base[0].href = '/universidades'
        return [
          { label: 'Universidades', href: '/universidades' },
          { label: uni?.name ?? 'Universidad' },
        ]
      }
      return [{ label: 'Universidades' }]
    }

    if (root === 'eventos') {
      if (id) {
        const ev = store.getEvent(id)
        if (ev) {
          return [
            ...uniCrumb(ev.universityId),
            { label: ev.name },
          ]
        }
      }
      return [{ label: 'Eventos' }]
    }

    if (root === 'estudiantes') {
      if (id) {
        const st = store.getStudent(id)
        if (st) {
          const ev = store.getEvent(st.eventId)
          return [
            ...(ev ? uniCrumb(ev.universityId) : []),
            ...(ev
              ? [{ label: ev.name, href: `/eventos/${ev.id}` }]
              : []),
            { label: `${st.firstName} ${st.lastName}` },
          ]
        }
      }
      return [{ label: 'Estudiantes' }]
    }

    if (root === 'fotografias') return [{ label: 'Fotografías' }]
    if (root === 'configuracion') return [{ label: 'Configuración' }]

    return [{ label: 'Dashboard' }]
  }, [pathname, store])

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-5" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <React.Fragment key={`${crumb.label}-${i}`}>
                <BreadcrumbItem>
                  {isLast || !crumb.href ? (
                    <BreadcrumbPage className="max-w-[40vw] truncate">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={<Link href={crumb.href} />}
                      className="max-w-[24vw] truncate"
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
