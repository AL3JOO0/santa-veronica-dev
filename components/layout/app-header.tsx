"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { useUniversities } from "@/hooks/use-universities"
import { useEvents } from "@/hooks/use-events"

interface Crumb {
  label: string
  href?: string
}

export function AppHeader() {
  const pathname = usePathname()

  /*
   * =========================================================
   * UNIVERSIDADES & EVENTOS
   * =========================================================
   */
  const { universities } = useUniversities()
  const { events } = useEvents()

  /*
   * =========================================================
   * BREADCRUMBS
   * =========================================================
   */
  const crumbs = React.useMemo<Crumb[]>(() => {
    const parts = pathname.split("/").filter(Boolean)

    // Dashboard (raíz)
    if (parts.length === 0) {
      return [{ label: "Dashboard" }]
    }

    const [root, id] = parts

    /*
     * =======================================================
     * FUNCIÓN AUXILIAR: UNIVERSIDAD
     * =======================================================
     */
    const getUniversityCrumb = (universityId: string): Crumb[] => {
      const university = universities.find((item) => item.id === universityId)

      return [
        {
          label: "Universidades",
          href: "/universidades",
        },
        {
          label: university?.name ?? "Universidad",
          href: `/universidades/${universityId}`,
        },
      ]
    }

    /*
     * =======================================================
     * RUTAS DE UNIVERSIDADES
     * =======================================================
     */
    if (root === "universidades") {
      if (!id) {
        return [{ label: "Universidades" }]
      }

      const university = universities.find((item) => item.id === id)

      return [
        { label: "Universidades", href: "/universidades" },
        { label: university?.name ?? "Universidad" },
      ]
    }

    /*
     * =======================================================
     * RUTAS DE EVENTOS
     * =======================================================
     */
    if (root === "eventos") {
      if (!id) {
        return [{ label: "Eventos" }]
      }

      const event = events.find((item) => item.id === id)

      if (event) {
        return [
          ...getUniversityCrumb(event.universityId),
          { label: event.name },
        ]
      }

      return [{ label: "Eventos" }]
    }

    /*
     * =======================================================
     * CONFIGURACIÓN
     * =======================================================
     */
    if (root === "configuracion") {
      return [{ label: "Configuración" }]
    }

    /*
     * =======================================================
     * FALLBACK
     * =======================================================
     */
    return [{ label: "Dashboard" }]
  }, [pathname, universities, events])

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1" />

      <Separator orientation="vertical" className="mr-1 h-5" />

      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1

            return (
              <React.Fragment key={`${crumb.label}-${index}`}>
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