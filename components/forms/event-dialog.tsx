'use client'

import * as React from 'react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { createEventAction } from '@/app/actions/events'

import { useUniversities } from '@/hooks/use-universities'
import { useEvents } from '@/hooks/use-events'


import type {
  EventItem,
  Status,
} from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void

  event?: EventItem | null

  defaultUniversityId?: string

  /*
   * Se ejecuta después de crear o editar
   * correctamente el evento.
   */
  onSaved?: () => void | Promise<void>
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  defaultUniversityId,
  onSaved,
}: Props) {

  /*
   * =========================================================
   * UNIVERSIDADES
   * =========================================================
   */

  const {
  universities,
  loading: universitiesLoading,
  reload: reloadUniversities,
} = useUniversities()
React.useEffect(() => {
  if (!open) {
    return
  }

  reloadUniversities()
}, [open, reloadUniversities])

  /*
   * =========================================================
   * EVENTOS
   * =========================================================
   *
   * Utilizamos editEvent() para actualizar eventos.
   */

  const {
    editEvent,
  } = useEvents()

  /*
   * =========================================================
   * ESTADO
   * =========================================================
   */

  const editing = Boolean(event)

  const [name, setName] =
    React.useState('')

  const [universityId, setUniversityId] =
    React.useState('')

  const [date, setDate] =
    React.useState('')

  const [description, setDescription] =
    React.useState('')

  const [password, setPassword] =
    React.useState('')

  const [status, setStatus] =
    React.useState<Status>('activo')

  const [saving, setSaving] =
    React.useState(false)

  /*
   * =========================================================
   * CARGAR DATOS DEL EVENTO
   * =========================================================
   */

  React.useEffect(() => {

    if (!open) {
      return
    }

    /*
     * Si estamos editando,
     * cargamos los datos existentes.
     */

    if (event) {

      setName(
        event.name ?? '',
      )

      setUniversityId(
        event.universityId ?? '',
      )

      setDate(
        event.date ?? '',
      )

      setDescription(
        event.description ?? '',
      )

      setStatus(
        event.status ?? 'activo',
      )

    }

    /*
     * Si estamos creando,
     * utilizamos la universidad por defecto.
     */

    else {

      setName('')

      setUniversityId(
        defaultUniversityId ?? '',
      )

      setDate('')

      setDescription('')

      setStatus('activo')

    }

    /*
     * La contraseña nunca se carga.
     */

    setPassword('')

  }, [
    open,
    event,
    defaultUniversityId,
  ])

  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {

    e.preventDefault()

    /*
     * =======================================================
     * VALIDACIONES
     * =======================================================
     */

    if (!name.trim()) {

      toast.error(
        'El nombre del evento es obligatorio.',
      )

      return
    }

    if (!universityId) {

      toast.error(
        'Selecciona una universidad.',
      )

      return
    }

    if (!date) {

      toast.error(
        'La fecha del evento es obligatoria.',
      )

      return
    }

    /*
     * La contraseña solamente es obligatoria
     * cuando estamos creando.
     */

    if (
      !editing &&
      !password.trim()
    ) {

      toast.error(
        'La contraseña de cohorte es obligatoria.',
      )

      return
    }

    try {

      setSaving(true)

      /*
       * =====================================================
       * EDITAR EVENTO
       * =====================================================
       */

      if (editing && event) {

        await editEvent(
          event.id,
          {
            universityId,
            name: name.trim(),
            description:
              description.trim(),
            date,
            status,

            /*
             * Si está vacío, el servicio no
             * cambia la contraseña.
             */

            password:
              password.trim() ||
              undefined,
          },
        )

        toast.success(
          'Evento actualizado correctamente.',
        )
      }

      /*
       * =====================================================
       * CREAR EVENTO
       * =====================================================
       */

      else {

        await createEventAction({
          name: name.trim(),

          universityId,

          date,

          description:
            description.trim(),

          password:
            password.trim(),

          status,
        })

        toast.success(
          'Evento creado correctamente.',
        )
      }

      /*
       * Limpiamos la contraseña.
       */

      setPassword('')

      /*
       * Cerramos el diálogo.
       */

      onOpenChange(false)

      /*
       * Avisamos al padre para que
       * actualice la información.
       */

      await onSaved?.()

    } catch (error) {

      console.error(
        'Error guardando evento:',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el evento.',
      )

    } finally {

      setSaving(false)

    }
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >

      <DialogContent className="sm:max-w-lg">

        <form
          onSubmit={handleSubmit}
        >

          {/* =================================================
              HEADER
              ================================================= */}

          <DialogHeader>

            <DialogTitle>
              {editing
                ? 'Editar evento'
                : 'Nuevo evento'}
            </DialogTitle>

            <DialogDescription>
              {editing
                ? 'Actualiza la información del evento.'
                : 'Crea un nuevo evento dentro de una universidad.'}
            </DialogDescription>

          </DialogHeader>

          <FieldGroup className="py-4">

            {/* =================================================
                NOMBRE
                ================================================= */}

            <Field>

              <FieldLabel htmlFor="ev-name">
                Nombre del evento
              </FieldLabel>

              <Input
                id="ev-name"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value,
                  )
                }
                placeholder="Graduación 2026"
                autoFocus
                disabled={saving}
              />

            </Field>

            {/* =================================================
                UNIVERSIDAD + FECHA
                ================================================= */}

            <div className="grid gap-4 sm:grid-cols-2">

              <Field>

                <FieldLabel>
                  Universidad
                </FieldLabel>

                <Select
                  value={universityId}
                  onValueChange={
                    setUniversityId
                  }
                  disabled={
                    universitiesLoading ||
                    saving
                  }
                >

                  <SelectTrigger className="w-full">

                    <SelectValue
                      placeholder={
                        universitiesLoading
                          ? 'Cargando...'
                          : 'Seleccionar'
                      }
                    />

                  </SelectTrigger>

                  <SelectContent>

                    {universities.map(
                      (university) => (

                        <SelectItem
                          key={
                            university.id
                          }
                          value={
                            university.id
                          }
                        >
                          {
                            university.name
                          }
                        </SelectItem>

                      ),
                    )}

                  </SelectContent>

                </Select>

              </Field>

              <Field>

                <FieldLabel htmlFor="ev-date">
                  Fecha
                </FieldLabel>

                <Input
                  id="ev-date"
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(
                      e.target.value,
                    )
                  }
                  disabled={saving}
                />

              </Field>

            </div>

            {/* =================================================
                DESCRIPCIÓN
                ================================================= */}

            <Field>

              <FieldLabel htmlFor="ev-desc">
                Descripción
              </FieldLabel>

              <Textarea
                id="ev-desc"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value,
                  )
                }
                placeholder="Detalles del evento"
                rows={3}
                disabled={saving}
              />

            </Field>

            {/* =================================================
                CONTRASEÑA
                ================================================= */}

            <Field>

              <FieldLabel htmlFor="ev-password">
                Contraseña de cohorte
              </FieldLabel>

              <Input
                id="ev-password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value,
                  )
                }
                placeholder={
                  editing
                    ? 'Dejar vacío para conservar la actual'
                    : 'Contraseña para acceder a la cohorte'
                }
                disabled={saving}
              />

              <p className="text-xs text-muted-foreground">

                {editing
                  ? 'Déjala vacía para conservar la contraseña actual.'
                  : 'La contraseña se almacenará de forma segura mediante un hash.'}

              </p>

            </Field>

            {/* =================================================
                ESTADO
                ================================================= */}

            <Field>

              <FieldLabel>
                Estado
              </FieldLabel>

              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(
                    value as Status,
                  )
                }
                disabled={saving}
              >

                <SelectTrigger className="w-full">

                  <SelectValue />

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="activo">
                    Activo
                  </SelectItem>

                  <SelectItem value="borrador">
                    Borrador
                  </SelectItem>

                  <SelectItem value="cerrado">
                    Cerrado
                  </SelectItem>

                  <SelectItem value="archivado">
                    Archivado
                  </SelectItem>

                </SelectContent>

              </Select>

            </Field>

          </FieldGroup>

          {/* =================================================
              FOOTER
              ================================================= */}

          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >

              {saving
                ? 'Guardando...'
                : editing
                  ? 'Guardar cambios'
                  : 'Crear evento'}

            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>
  )
}