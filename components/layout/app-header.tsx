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

import { useStore } from "@/lib/store"
import { useUniversities } from "@/hooks/use-universities"

interface Crumb {
  label: string
  href?: string
}

export function AppHeader() {
  const pathname = usePathname()

  /*
   * =========================================================
   * UNIVERSIDADES
   * =========================================================
   *
   * Las universidades ya no vienen del store.
   */
  const {
    universities,
  } = useUniversities()

  /*
   * =========================================================
   * EVENTOS / ESTUDIANTES
   * =========================================================
   *
   * Estos todavía permanecen temporalmente en el store.
   */
  const store = useStore()

  /*
   * =========================================================
   * BREADCRUMBS
   * =========================================================
   */

  const crumbs = React.useMemo<Crumb[]>(() => {
    const parts = pathname
      .split("/")
      .filter(Boolean)

    /*
     * Dashboard
     */
    if (parts.length === 0) {
      return [
        {
          label: "Dashboard",
        },
      ]
    }

    const [root, id] = parts

    /*
     * =======================================================
     * UNIVERSIDAD
     * =======================================================
     */

    const getUniversityCrumb = (
      universityId: string,
    ): Crumb[] => {
      const university = universities.find(
        (item) => item.id === universityId,
      )

      return [
        {
          label: "Universidades",
          href: "/universidades",
        },
        {
          label:
            university?.name ??
            "Universidad",
          href: `/universidades/${universityId}`,
        },
      ]
    }

    /*
     * =======================================================
     * UNIVERSIDADES
     * =======================================================
     */

    if (root === "universidades") {
      /*
       * /universidades
       */
      if (!id) {
        return [
          {
            label: "Universidades",
          },
        ]
      }

      /*
       * /universidades/:id
       */
      const university = universities.find(
        (item) => item.id === id,
      )

      return [
        {
          label: "Universidades",
          href: "/universidades",
        },
        {
          label:
            university?.name ??
            "Universidad",
        },
      ]
    }

    /*
     * =======================================================
     * EVENTOS
     * =======================================================
     */

    if (root === "eventos") {
      /*
       * /eventos
       */
      if (!id) {
        return [
          {
            label: "Eventos",
          },
        ]
      }

      /*
       * /eventos/:id
       */
      const event = store.getEvent(id)

      if (event) {
        return [
          ...getUniversityCrumb(
            event.universityId,
          ),
          {
            label: event.name,
          },
        ]
      }

      return [
        {
          label: "Eventos",
        },
      ]
    }

    /*
     * =======================================================
     * ESTUDIANTES
     * =======================================================
     */

    if (root === "estudiantes") {
      /*
       * /estudiantes
       */
      if (!id) {
        return [
          {
            label: "Estudiantes",
          },
        ]
      }

      /*
       * /estudiantes/:id
       */
      const student = store.getStudent(id)

      if (student) {
        const event = store.getEvent(
          student.eventId,
        )

        if (event) {
          return [
            ...getUniversityCrumb(
              event.universityId,
            ),
            {
              label: event.name,
              href: `/eventos/${event.id}`,
            },
            {
              label: `${student.firstName} ${student.lastName}`,
            },
          ]
        }

        return [
          {
            label: "Estudiantes",
            href: "/estudiantes",
          },
          {
            label: `${student.firstName} ${student.lastName}`,
          },
        ]
      }

      return [
        {
          label: "Estudiantes",
        },
      ]
    }

    /*
     * =======================================================
     * FOTOGRAFÍAS
     * =======================================================
     */

    if (root === "fotografias") {
      return [
        {
          label: "Fotografías",
        },
      ]
    }

    /*
     * =======================================================
     * CONFIGURACIÓN
     * =======================================================
     */

    if (root === "configuracion") {
      return [
        {
          label: "Configuración",
        },
      ]
    }

    /*
     * =======================================================
     * FALLBACK
     * =======================================================
     */

    return [
      {
        label: "Dashboard",
      },
    ]
  }, [
    pathname,
    universities,
    store,
  ])

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">

      <SidebarTrigger className="-ml-1" />

      <Separator
        orientation="vertical"
        className="mr-1 h-5"
      />

      <Breadcrumb>

        <BreadcrumbList>

          {crumbs.map((crumb, index) => {
            const isLast =
              index === crumbs.length - 1

            return (
              <React.Fragment
                key={`${crumb.label}-${index}`}
              >

                <BreadcrumbItem>

                  {isLast || !crumb.href ? (

                    <BreadcrumbPage className="max-w-[40vw] truncate">
                      {crumb.label}
                    </BreadcrumbPage>

                  ) : (

                    <BreadcrumbLink
                      render={
                        <Link
                          href={crumb.href}
                        />
                      }
                      className="max-w-[24vw] truncate"
                    >
                      {crumb.label}
                    </BreadcrumbLink>

                  )}

                </BreadcrumbItem>

                {!isLast && (
                  <BreadcrumbSeparator />
                )}

              </React.Fragment>
            )
          })}

        </BreadcrumbList>

      </Breadcrumb>

    </header>
  )
}