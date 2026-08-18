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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store'
import type { University } from '@/lib/types'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  university?: University
}

export function UniversityDialog({ open, onOpenChange, university }: Props) {
  const store = useStore()
  const editing = Boolean(university)

  const [name, setName] = React.useState('')
  const [location, setLocation] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [active, setActive] = React.useState(true)

  React.useEffect(() => {
  if (open) {
    setName(university?.name ?? '')
    setLocation(university?.location ?? '')
    setDescription(university?.description ?? '')
    setActive(university?.active ?? true)
  }
}, [open, university])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    try {
      const payload = {
        name: name.trim(),
        short_name: initials(name),
        location: location.trim(),
        description: description.trim(),
        active,
      }

      if (editing && university) {
        await store.updateUniversity(
          university.id,
          payload
        )

        toast.success('Universidad actualizada')
      } else {
        await store.addUniversity(payload)

        toast.success('Universidad creada')
      }

      onOpenChange(false)

    } catch (error) {
      console.error(error)

      toast.error(
        editing
          ? 'No se pudo actualizar la universidad'
          : 'No se pudo crear la universidad'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar universidad' : 'Nueva universidad'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Actualiza la información de la universidad.'
                : 'Registra una nueva universidad en el sistema.'}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="uni-name">Nombre</FieldLabel>
              <Input
                id="uni-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Universidad Nacional"
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="uni-location">Ubicación</FieldLabel>
              <Input
                id="uni-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ciudad, País"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="uni-desc">Descripción</FieldLabel>
              <Textarea
                id="uni-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción de la institución"
                rows={3}
              />
            </Field>
            <Field>
  <FieldLabel>Estado</FieldLabel>

  <Select
    value={active ? 'activo' : 'inactivo'}
    onValueChange={(value) => setActive(value === 'activo')}
  >
    <SelectTrigger className="w-full">
      <SelectValue />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="activo">Activo</SelectItem>
      <SelectItem value="inactivo">Inactivo</SelectItem>
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
              {editing ? 'Guardar cambios' : 'Crear universidad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
