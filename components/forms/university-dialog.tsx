"use client"

import * as React from "react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { University } from "@/lib/types"

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (word) =>
        word[0]?.toUpperCase() ?? "",
    )
    .join("")
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  university?: University

  onSubmit: (data: {
    name: string
    short_name: string
    location: string
    description: string
    notification_email: string | null
    active: boolean
  }) => Promise<void>
}

export function UniversityDialog({
  open,
  onOpenChange,
  university,
  onSubmit,
}: Props) {
  const editing = Boolean(university)

  const [name, setName] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [description, setDescription] =
    React.useState("")
  const [notificationEmail, setNotificationEmail] =
    React.useState("")
  const [active, setActive] =
    React.useState(true)

  /*
   * =========================================================
   * CARGAR DATOS
   * =========================================================
   */

  React.useEffect(() => {
    if (!open) {
      return
    }

    setName(university?.name ?? "")
    setLocation(university?.location ?? "")
    setDescription(
      university?.description ?? "",
    )
    setNotificationEmail(
      university?.notification_email ?? "",
    )
    setActive(
      university?.active ?? true,
    )
  }, [open, university])

  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) {
      toast.error(
        "El nombre es obligatorio",
      )
      return
    }

    const trimmedNotificationEmail = notificationEmail.trim()
    if (
      trimmedNotificationEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedNotificationEmail)
    ) {
      toast.error("Ingresa un correo de notificación válido")
      return
    }

    try {
      const payload = {
        name: trimmedName,
        short_name: initials(trimmedName),
        location: location.trim(),
        description: description.trim(),
        notification_email: trimmedNotificationEmail || null,
        active,
      }

      await onSubmit(payload)

      toast.success(
        editing
          ? "Universidad actualizada"
          : "Universidad creada",
      )

      onOpenChange(false)
    } catch (error) {
      console.error(
        "Error guardando universidad:",
        error,
      )

      toast.error(
        editing
          ? "No se pudo actualizar la universidad"
          : "No se pudo crear la universidad",
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">

        <form onSubmit={handleSubmit}>

          <DialogHeader>

            <DialogTitle>
              {editing
                ? "Editar universidad"
                : "Nueva universidad"}
            </DialogTitle>

            <DialogDescription>
              {editing
                ? "Actualiza la información de la universidad."
                : "Registra una nueva universidad en el sistema."}
            </DialogDescription>

          </DialogHeader>

          <FieldGroup className="py-4">

            {/* NOMBRE */}

            <Field>

              <FieldLabel htmlFor="uni-name">
                Nombre
              </FieldLabel>

              <Input
                id="uni-name"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="Universidad Nacional"
                autoFocus
              />

            </Field>

            {/* UBICACIÓN */}

            <Field>

              <FieldLabel htmlFor="uni-location">
                Ubicación
              </FieldLabel>

              <Input
                id="uni-location"
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value,
                  )
                }
                placeholder="Ciudad, País"
              />

            </Field>

            {/* DESCRIPCIÓN */}

            <Field>

              <FieldLabel htmlFor="uni-desc">
                Descripción
              </FieldLabel>

              <Textarea
                id="uni-desc"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                placeholder="Breve descripción de la institución"
                rows={3}
              />

            </Field>

            {/* CORREO DE NOTIFICACIONES */}

            <Field>

              <FieldLabel htmlFor="uni-notification-email">
                Correo para notificaciones
              </FieldLabel>

              <Input
                id="uni-notification-email"
                type="email"
                value={notificationEmail}
                onChange={(event) =>
                  setNotificationEmail(
                    event.target.value,
                  )
                }
                placeholder="fotografias@universidad.edu.co"
                autoComplete="email"
              />

              <p className="text-xs text-muted-foreground">
                Aquí llegará el detalle de las fotografías seleccionadas por los estudiantes.
              </p>

            </Field>

            {/* ESTADO */}

            <Field>

              <FieldLabel>
                Estado
              </FieldLabel>

              <Select
                value={
                  active
                    ? "activo"
                    : "inactivo"
                }
                onValueChange={(value) =>
                  setActive(
                    value === "activo",
                  )
                }
              >

                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="activo">
                    Activo
                  </SelectItem>

                  <SelectItem value="inactivo">
                    Inactivo
                  </SelectItem>

                </SelectContent>

              </Select>

            </Field>

          </FieldGroup>

          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
            >
              Cancelar
            </Button>

            <Button type="submit">
              {editing
                ? "Guardar cambios"
                : "Crear universidad"}
            </Button>

          </DialogFooter>

        </form>

      </DialogContent>
    </Dialog>
  )
}