import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Status } from '@/lib/types'

const config: Record<Status, { label: string; dot: string }> = {
  activo: { label: 'Activo', dot: 'bg-foreground' },
  borrador: {
    label: 'Borrador',
    dot: 'bg-transparent ring-1 ring-inset ring-muted-foreground',
  },
  archivado: { label: 'Archivado', dot: 'bg-muted-foreground/40' },
}

export function StatusBadge({ status }: { status: Status }) {
  const { label, dot } = config[status]
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />
      {label}
    </Badge>
  )
}
