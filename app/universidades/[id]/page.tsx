import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Building2, MapPin, CalendarDays } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function UniversityDetailPage({ params }: Props) {
  const { id } = await params

  const { data: university, error } = await supabase
    .from("institutions")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !university) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Button
  variant="ghost"
  nativeButton={false}
  render={<Link href="/universidades" />}
>
  <ArrowLeft className="mr-2 size-4" />
  Volver a universidades
</Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <Building2 className="size-6 text-muted-foreground" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              {university.name}
            </h1>

            <p className="text-muted-foreground">
              Información de la institución
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información general</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Nombre
              </p>

              <p className="font-medium">
                {university.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Estado
              </p>

              <p className="font-medium">
                {university.active ? "Activa" : "Inactiva"}
              </p>
            </div>

            {university.location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-muted-foreground" />

                <div>
                  <p className="text-sm text-muted-foreground">
                    Ubicación
                  </p>

                  <p className="font-medium">
                    {university.location}
                  </p>
                </div>
              </div>
            )}

            {university.description && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Descripción
                </p>

                <p className="mt-1">
                  {university.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del registro</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />

              <div>
                <p className="text-sm text-muted-foreground">
                  Creada
                </p>

                <p className="font-medium">
                  {new Date(university.created_at).toLocaleString(
                    "es-CO"
                  )}
                </p>
              </div>
            </div>

            {university.updated_at && (
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />

                <div>
                  <p className="text-sm text-muted-foreground">
                    Última actualización
                  </p>

                  <p className="font-medium">
                    {new Date(university.updated_at).toLocaleString(
                      "es-CO"
                    )}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}