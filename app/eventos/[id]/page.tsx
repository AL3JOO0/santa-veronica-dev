import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EventDetail } from "@/components/events/event-detail"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function EventDetailPage({
  params,
}: Props) {

  const { id } = await params

  return (
    <div className="mx-auto max-w-7xl">

      <div className="mb-6">

        <Button
          variant="ghost"
          nativeButton={false}
          render={
            <Link href="/eventos" />
          }
        >
          <ArrowLeft className="mr-2 size-4" />
          Volver a eventos
        </Button>

      </div>

      <EventDetail id={id} />

    </div>
  )
}