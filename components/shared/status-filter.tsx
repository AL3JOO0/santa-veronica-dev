'use client'

import { ListFilter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full sm:w-40">
        <ListFilter className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos">Todos los estados</SelectItem>
        <SelectItem value="activo">Activo</SelectItem>
        <SelectItem value="borrador">Borrador</SelectItem>
        <SelectItem value="archivado">Archivado</SelectItem>
      </SelectContent>
    </Select>
  )
}
