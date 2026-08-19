import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UniversityDetail } from "@/components/universities/university-detail"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function UniversityDetailPage({
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
            <Link href="/universidades" />
          }
        >
          <ArrowLeft className="mr-2 size-4" />
          Volver a universidades
        </Button>

      </div>

      <UniversityDetail id={id} />

    </div>
  )
}