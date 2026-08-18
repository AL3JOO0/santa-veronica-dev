'use client'

import * as React from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { EventItem, Status } from '@/lib/types'

const COVERS = [
  { url: '/covers/graduacion.png', label: 'Graduación' },
  { url: '/covers/ceremonia.png', label: 'Ceremonia' },
  { url: '/covers/campus.png', label: 'Campus' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: EventItem
  defaultUniversityId?: string
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  defaultUniversityId,
}: Props) {
  const store = useStore()
  const editing = Boolean(event)

  const [name, setName] = React.useState('')
  const [universityId, setUniversityId] = React.useState('')
  const [date, setDate] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [cover, setCover] = React.useState(COVERS[0].url)
  const [status, setStatus] = React.useState<Status>('activo')

  React.useEffect(() => {
    if (open) {
      setName(event?.name ?? '')
      setUniversityId(event?.universityId ?? defaultUniversityId ?? '')
      setDate(event?.date ?? '')
      setDescription(event?.description ?? '')
      setCover(event?.cover ?? COVERS[0].url)
      setStatus(event?.status ?? 'activo')
    }
  }, [open, event, defaultUniversityId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('El nombre es obligatorio')
    if (!universityId) return toast.error('Selecciona una universidad')
    if (!date) return toast.error('La fecha es obligatoria')

    const payload = {
      name: name.trim(),
      universityId,
      date,
      description: description.trim(),
      cover,
      status,
    }
    if (editing && event) {
      store.updateEvent(event.id, payload)
      toast.success('Evento actualizado')
    } else {
      store.addEvent(payload)
      toast.success('Evento creado')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar evento' : 'Nuevo evento'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Actualiza la información del evento.'
                : 'Crea un nuevo evento dentro de una universidad.'}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="ev-name">Nombre del evento</FieldLabel>
              <Input
                id="ev-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Graduación 2026"
                autoFocus
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Universidad</FieldLabel>
                <Select value={universityId} onValueChange={setUniversityId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {store.universities.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="ev-date">Fecha</FieldLabel>
                <Input
                  id="ev-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="ev-desc">Descripción</FieldLabel>
              <Textarea
                id="ev-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles del evento"
                rows={2}
              />
            </Field>
            <Field>
              <FieldLabel>Imagen de portada</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {COVERS.map((c) => (
                  <button
                    key={c.url}
                    type="button"
                    onClick={() => setCover(c.url)}
                    className={cn(
                      'group relative aspect-video overflow-hidden rounded-lg ring-2 ring-transparent transition-all',
                      cover === c.url && 'ring-primary',
                    )}
                    aria-label={`Portada ${c.label}`}
                  >
                    <Image
                      src={c.url || '/placeholder.svg'}
                      alt={c.label}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                    {cover === c.url && (
                      <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Field>
            <Field>
              <FieldLabel>Estado</FieldLabel>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Status)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="archivado">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editing ? 'Guardar cambios' : 'Crear evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
