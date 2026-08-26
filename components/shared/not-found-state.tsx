"use client"

import Link from "next/link"
import { SearchX } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { buttonVariants } from "@/components/ui/button"

export function NotFoundState({ label, backHref }: { label: string; backHref: string }) {
  return (
    <EmptyState
      icon={SearchX}
      title={`No encontramos esta ${label}`}
      description="Es posible que haya sido eliminada o que el enlace no sea válido."
    >
      {
        <Link
          href={backHref}
          className={buttonVariants({ variant: "outline" })}
        >
          Volver
        </Link>
      }
    </EmptyState>
  )
}
