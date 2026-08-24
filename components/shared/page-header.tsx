import { cn } from '@/lib/utils'
import * as React from 'react' // Asegúrate de importar React para React.ReactNode

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  action?: React.ReactNode // <-- AGREGAMOS ACTION AQUÍ
  className?: string
}

export function PageHeader({
  title,
  description,
  children,
  action, // <-- LO RECIBIMOS AQUÍ
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="font-serif text-2xl font-medium tracking-tight text-balance md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
            {description}
          </p>
        )}
      </div>
      
      {/* RENDERIZAMOS ACTION Y/O CHILDREN AQUÍ */}
      {(children || action) && (
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {children}
        </div>
      )}
    </div>
  )
}