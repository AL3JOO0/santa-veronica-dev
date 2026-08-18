import { GraduationCap, CalendarDays, Users, ImageIcon } from 'lucide-react'
import { formatRelative } from '@/lib/format'
import type { Activity, ActivityType } from '@/lib/types'

const iconMap: Record<ActivityType, typeof Users> = {
  university: GraduationCap,
  event: CalendarDays,
  student: Users,
  photo: ImageIcon,
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <ol className="flex flex-col">
      {activities.map((a, i) => {
        const Icon = iconMap[a.type]
        const isLast = i === activities.length - 1
        return (
          <li key={a.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
                <Icon className="size-4" />
              </span>
              {!isLast && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className="flex flex-col gap-0.5 pb-5">
              <p className="text-sm leading-snug">
                <span className="font-medium">Ana Morales</span>{' '}
                <span className="text-muted-foreground">{a.action}</span>{' '}
                <span>{a.label}</span>
              </p>
              <span className="text-xs text-muted-foreground">
                {formatRelative(a.at)}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
