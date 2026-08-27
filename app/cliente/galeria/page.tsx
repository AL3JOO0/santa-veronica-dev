'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Images,
  LogOut,
  Maximize2,
  Send,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  getSession,
  logout,
  type AppSession,
} from '@/lib/services/auth.service'
import {
  getClientGallery,
  submitClientSelection,
  type ClientGalleryPhoto,
} from '@/lib/services/client-gallery.service'

const PAGE_SIZE = 16

export default function ClientGalleryPage() {
  const router = useRouter()
  const [session, setSession] = React.useState<AppSession | null>(null)
  const [photos, setPhotos] = React.useState<ClientGalleryPhoto[]>([])
  const [totalPhotos, setTotalPhotos] = React.useState(0)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageLoading, setPageLoading] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [previewId, setPreviewId] = React.useState<string | null>(null)
  const [selectionStatus, setSelectionStatus] = React.useState<string | null>(null)
  const [ready, setReady] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [loadError, setLoadError] = React.useState('')

  const selectionSubmitted = selectionStatus === 'SUBMITTED'

  React.useEffect(() => {
    let active = true

    async function load() {
      try {
        const currentSession = await getSession()

        if (!active) return

        if (!currentSession) {
          router.replace('/login')
          return
        }

        if (currentSession.userType !== 'ESTUDIANTE') {
          router.replace('/')
          return
        }

        setSession(currentSession)

        const gallery = await getClientGallery(1, PAGE_SIZE)
        if (!active) return

        setPhotos(gallery.photos)
        setTotalPhotos(gallery.pagination.total)
        setSelectedIds(gallery.selectedIds)
        setSelectionStatus(gallery.selectionStatus)
      } catch (error) {
        if (!active) return
        setLoadError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar la galería.',
        )
      } finally {
        if (active) setReady(true)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [router])

  const totalPages = Math.max(1, Math.ceil(totalPhotos / PAGE_SIZE))
  const pagePhotos = photos

  const previewPhoto = photos.find((photo) => photo.id === previewId)

  function togglePhoto(id: string) {
    if (selectionSubmitted) return

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    )
  }

  async function changePage(page: number) {
    const nextPage = Math.min(totalPages, Math.max(1, page))
    if (nextPage === currentPage || pageLoading) return

    try {
      setPageLoading(true)
      setLoadError('')
      const gallery = await getClientGallery(nextPage, PAGE_SIZE)
      setPhotos(gallery.photos)
      setTotalPhotos(gallery.pagination.total)
      setCurrentPage(nextPage)
      setPreviewId(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'No fue posible cambiar de página.',
      )
    } finally {
      setPageLoading(false)
    }
  }

  async function handleLogout() {
    await logout()
    router.replace('/login')
    router.refresh()
  }

  async function submitSelection() {
    if (selectionSubmitted) {
      toast.info('Tu selección ya fue enviada.')
      return
    }

    if (selectedIds.length === 0) {
      toast.error('Selecciona al menos una fotografía antes de enviar.')
      return
    }

    setSubmitting(true)

    try {
      await submitClientSelection(selectedIds)
      setSelectionStatus('SUBMITTED')
      toast.success(
        `Selección enviada: ${selectedIds.length} fotografía${selectedIds.length === 1 ? '' : 's'}.`,
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible enviar la selección.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready || !session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f5]">
        <div className="flex items-center gap-3 text-sm text-[#757981]">
          <span className="size-5 animate-spin rounded-full border-2 border-[#ed7d13] border-t-transparent" />
          Cargando tu galería...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#172333]">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ed7d13] text-white">
              <Images className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {session.displayName}
              </p>
              <p className="truncate text-xs text-[#777b82]">
                {session.eventName || 'Galería personal'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex h-9 items-center gap-2 rounded-lg border border-[#e7e2dc] bg-white px-3 text-xs font-medium text-[#5f646b] transition hover:bg-[#faf7f3] hover:text-[#d76907]"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#d76907]">
              Galería personal
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Mis Fotografías
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#70747b]">
              Selecciona tus fotografías favoritas. Las imágenes de vista previa
              llevan marca de agua y tu selección se conserva aunque cambies de
              página.
            </p>
          </div>

          <button
            onClick={submitSelection}
            disabled={submitting || selectionSubmitted}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ed7d13] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(237,125,19,0.22)] transition hover:bg-[#db6d08] disabled:cursor-not-allowed disabled:opacity-65"
          >
            {selectionSubmitted ? (
              <Check className="size-4" />
            ) : (
              <Send className="size-4" />
            )}
            {selectionSubmitted
              ? 'Selección enviada'
              : submitting
                ? 'Enviando...'
                : 'Enviar selección'}
            {selectedIds.length > 0 ? (
              <span className="grid min-w-5 place-items-center rounded-full bg-white/20 px-1.5 text-[11px]">
                {selectedIds.length}
              </span>
            ) : null}
          </button>
        </div>

        {loadError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        {selectionSubmitted ? (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Tu selección ya fue enviada al estudio. Las fotografías seleccionadas
            quedan marcadas en esta galería.
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#767a81]">
          <span>
            Página <strong className="text-[#444951]">{currentPage}</strong> de{' '}
            <strong className="text-[#444951]">{totalPages}</strong>
          </span>
          <span>
            {totalPhotos} fotografías · {selectedIds.length} seleccionadas
          </span>
        </div>

        {photos.length === 0 ? (
          <div className="grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-[#ddd7d0] bg-white px-6 text-center">
            <div>
              <Images className="mx-auto mb-3 size-9 text-[#d76907]" />
              <p className="font-medium text-[#444951]">
                Todavía no tienes fotografías cargadas.
              </p>
              <p className="mt-1 text-sm text-[#7a7e84]">
                Cuando el administrador las asigne a tu usuario aparecerán aquí.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:gap-5">
            {pagePhotos.map((photo) => {
              const selected = selectedIds.includes(photo.id)
              return (
                <article
                  key={photo.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-white shadow-[0_8px_24px_rgba(30,26,22,0.06)] transition-all duration-200 ${
                    selected
                      ? 'border-[#ed7d13] ring-2 ring-[#ed7d13]/25'
                      : 'border-[#e9e5e0] hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(30,26,22,0.10)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => togglePhoto(photo.id)}
                    disabled={selectionSubmitted}
                    aria-label={
                      selected ? 'Quitar selección' : 'Seleccionar fotografía'
                    }
                    className="relative block aspect-[4/5] w-full overflow-hidden bg-[#efefef] disabled:cursor-default"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.fileName}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 280px"
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                    />

                    {!photo.hasEmbeddedWatermark ? (
                      <div className="pointer-events-none absolute inset-0 flex rotate-[-18deg] items-center justify-center">
                        <span className="select-none whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.28em] text-white/55 drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)] sm:text-xs">
                          Santa Verónica
                        </span>
                      </div>
                    ) : null}

                    <span
                      className={`absolute left-2.5 top-2.5 grid size-7 place-items-center rounded-full border text-white shadow-sm transition ${
                        selected
                          ? 'border-[#ed7d13] bg-[#ed7d13]'
                          : 'border-white/80 bg-black/25 backdrop-blur-sm'
                      }`}
                    >
                      {selected ? (
                        <Check className="size-4" strokeWidth={3} />
                      ) : null}
                    </span>
                  </button>

                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <span className="truncate text-[11px] font-medium text-[#6b6f75]">
                      {photo.fileName}
                    </span>
                    <button
                      onClick={() => setPreviewId(photo.id)}
                      aria-label="Ver fotografía"
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-[#7d8187] transition hover:bg-[#fff3e7] hover:text-[#d76907]"
                    >
                      <Maximize2 className="size-3.5" />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {totalPhotos > PAGE_SIZE ? (
          <nav
            className="mt-9 flex items-center justify-center gap-1.5"
            aria-label="Paginación"
          >
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1 || pageLoading}
              className="grid size-9 place-items-center rounded-lg border border-[#e5dfd9] bg-white text-[#666b72] transition hover:border-[#ed7d13]/50 hover:text-[#d76907] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="size-4" />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => changePage(page)}
                  disabled={pageLoading}
                  className={`grid size-9 place-items-center rounded-lg text-xs font-semibold transition ${
                    currentPage === page
                      ? 'bg-[#ed7d13] text-white shadow-sm'
                      : 'text-[#646971] hover:bg-white hover:text-[#d76907]'
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages || pageLoading}
              className="grid size-9 place-items-center rounded-lg border border-[#e5dfd9] bg-white text-[#666b72] transition hover:border-[#ed7d13]/50 hover:text-[#d76907] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight className="size-4" />
            </button>
          </nav>
        ) : null}
      </section>

      {previewPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewId(null)
          }}
        >
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-[#101010] shadow-2xl">
            <button
              onClick={() => setPreviewId(null)}
              className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
              aria-label="Cerrar vista previa"
            >
              <X className="size-5" />
            </button>
            <div className="relative aspect-[4/5] max-h-[82vh] w-full">
              <Image
                src={previewPhoto.url}
                alt={previewPhoto.fileName}
                fill
                sizes="768px"
                unoptimized
                className="object-contain"
              />
              {!previewPhoto.hasEmbeddedWatermark ? (
                <div className="pointer-events-none absolute inset-0 flex rotate-[-18deg] items-center justify-center">
                  <span className="select-none whitespace-nowrap text-lg font-bold uppercase tracking-[0.34em] text-white/45 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] sm:text-2xl">
                    Santa Verónica
                  </span>
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-white">
              <span className="truncate text-xs text-white/70">
                {previewPhoto.fileName}
              </span>
              <button
                onClick={() => togglePhoto(previewPhoto.id)}
                disabled={selectionSubmitted}
                className={`flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-default ${
                  selectedIds.includes(previewPhoto.id)
                    ? 'bg-white text-[#d76907]'
                    : 'bg-[#ed7d13] text-white hover:bg-[#db6d08]'
                }`}
              >
                <Check className="size-3.5" />
                {selectedIds.includes(previewPhoto.id)
                  ? 'Seleccionada'
                  : 'Seleccionar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
