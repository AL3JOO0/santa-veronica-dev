'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  MoreVertical,
  Plus,
  School,
  Camera,
} from 'lucide-react'

import { getSession, login } from '@/lib/services/auth.service'

const REMEMBER_IDENTIFIER_KEY = 'sv-login-identificador'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [remember, setRemember] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [checking, setChecking] = React.useState(true)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    let active = true

    const savedIdentifier = window.localStorage.getItem(REMEMBER_IDENTIFIER_KEY)
    if (savedIdentifier) {
      setIdentifier(savedIdentifier)
      setRemember(true)
    }

    getSession()
      .then((session) => {
        if (!active || !session) return
        router.replace(
          session.userType === 'ESTUDIANTE' ? '/cliente/galeria' : '/',
        )
      })
      .finally(() => {
        if (active) setChecking(false)
      })

    return () => {
      active = false
    }
  }, [router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(identifier, password, remember)

      if (remember) {
        window.localStorage.setItem(
          REMEMBER_IDENTIFIER_KEY,
          identifier.trim(),
        )
      } else {
        window.localStorage.removeItem(REMEMBER_IDENTIFIER_KEY)
      }

      router.replace(result.redirectTo)
      router.refresh()
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'No fue posible iniciar sesión.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen overflow-x-hidden bg-white text-[#0b1c30]">
      <section className="relative flex min-h-screen w-full flex-col bg-white lg:w-1/2">
        <header className="absolute left-0 top-0 z-20 flex w-full justify-center p-6 lg:p-8">
          <Image
            src="/LOGOSV.webp"
            alt="Santa Verónica Estudio"
            width={4030}
            height={1975}
            priority
            className="h-24 w-auto object-contain"
          />
        </header>

        <div className="z-10 mt-16 flex flex-1 items-center justify-center p-6 sm:p-10 lg:mt-0">
          <div className="w-full max-w-sm">
            <div className="mb-10 w-full text-center">
              <h1 className="mb-2 text-[28px] font-bold leading-9 text-[#0b1c30] lg:text-[32px] lg:leading-10">
                Inicia sesión
              </h1>
              <p className="mx-auto max-w-[300px] text-sm leading-5 text-[#564336]">
                La facilidad de gestionar y seleccionar tus fotografías
                inolvidables.
              </p>
            </div>

            <form className="w-full space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <label className="sr-only" htmlFor="identifier">
                  Usuario o cédula
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  value={identifier}
                  onChange={(event) => {
                    setIdentifier(event.target.value)
                    setError('')
                  }}
                  autoComplete="username"
                  placeholder="Usuario o cédula"
                  className="h-12 w-full rounded-lg border border-[#ddc1b1] bg-white px-4 text-sm text-[#0b1c30] shadow-sm outline-none transition placeholder:text-[#6f6259] focus:border-[#e87c1e] focus:ring-2 focus:ring-[#e87c1e]/20"
                />
              </div>

              <div className="relative">
                <label className="sr-only" htmlFor="password">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                  }}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  className="h-12 w-full rounded-lg border border-[#ddc1b1] bg-white pl-4 pr-12 text-sm text-[#0b1c30] shadow-sm outline-none transition placeholder:text-[#6f6259] focus:border-[#e87c1e] focus:ring-2 focus:ring-[#e87c1e]/20"
                />
                <button
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#564336] transition hover:text-[#954a00]"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? (
                    <Eye className="size-5" />
                  ) : (
                    <EyeOff className="size-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center pb-4 pt-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="size-4 cursor-pointer rounded border-[#ddc1b1] accent-[#e87c1e]"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 cursor-pointer text-sm text-[#564336]"
                >
                  Recordarme
                </label>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                className="flex h-12 w-full items-center justify-center rounded-lg bg-[#e87c1e] text-sm font-medium text-white shadow-md transition hover:bg-[#d66f14] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={!identifier.trim() || !password || loading || checking}
              >
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            <div className="mt-8 w-full text-center">
              <p className="text-sm text-[#564336]">
                ¿Necesitas ayuda?{' '}
                <a
                  className="font-medium text-[#e87c1e] underline-offset-4 hover:underline"
                  href="#"
                >
                  Soporte técnico
                </a>
              </p>
            </div>
          </div>
        </div>

        <footer className="absolute bottom-0 left-0 hidden w-full p-6 lg:block lg:p-8">
          <p className="text-left text-xs text-gray-400">Copyright 2026</p>
        </footer>
      </section>

      <aside className="relative hidden min-h-screen w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#e87c1e] to-[#954a00] lg:flex">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-[20%] top-[20%] size-24 rotate-45 rounded-lg border border-white/20" />
          <div className="absolute right-[15%] top-[30%] size-8 rotate-12 border border-white/20" />
          <div className="absolute bottom-[20%] right-[25%] size-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-16 left-16 grid grid-cols-4 gap-3 opacity-40">
            {Array.from({ length: 16 }, (_, index) => (
              <span key={index} className="size-1.5 rounded-full bg-white" />
            ))}
          </div>
        </div>

        <div className="relative z-10 mb-16 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl transition-transform duration-300 hover:-translate-y-2">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-bold text-[#954a00]">
              Gestión de Sesiones Fotográficas
            </h3>
            <p className="text-sm font-medium text-gray-500">
              Resumen general del mes
            </p>
          </div>

          <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-100 bg-[#f8f9ff] p-4">
            <div className="flex -space-x-3">
              {['portrait-1.webp', 'portrait-2.webp', 'portrait-3.webp'].map(
                (file) => (
                  <div
                    key={file}
                    className="relative size-12 overflow-hidden rounded-full border-2 border-white bg-gray-100"
                  >
                    <Image
                      src={`/gallery/${file}`}
                      alt="Estudiante"
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ),
              )}
              <div className="flex size-12 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-400">
                <Plus className="size-4" />
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Total Fotografías
              </div>
              <div className="text-2xl font-bold text-[#e87c1e]">1,248</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex cursor-default items-center justify-between rounded-xl border border-gray-100 p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#e87c1e]/10 text-[#e87c1e]">
                  <School className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">
                    Grados Promoción 2024
                  </div>
                  <div className="text-xs text-gray-500">15 de Noviembre</div>
                </div>
              </div>
              <MoreVertical className="size-4 text-gray-300" />
            </div>

            <div className="flex cursor-default items-center justify-between rounded-xl border border-gray-100 p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#e87c1e]/10 text-[#e87c1e]">
                  <Camera className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">
                    Sesión Retratos Estudiantes
                  </div>
                  <div className="text-xs text-gray-500">22 de Noviembre</div>
                </div>
              </div>
              <MoreVertical className="size-4 text-gray-300" />
            </div>
          </div>

          <div className="absolute -right-8 top-1/2 flex -translate-y-1/2 items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-lg">
            <div className="flex size-8 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <div className="text-[10px] font-medium text-gray-500">
                Estado de entrega
              </div>
              <div className="text-xs font-bold text-gray-800">
                100% Completado
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg px-8 text-center">
          <h2 className="mb-8 text-[32px] font-bold leading-tight text-white">
            El secreto de una gran fotografía no es la cámara,
            <br /> sino el ojo de quien la toma.
          </h2>
          <div className="flex justify-center gap-2">
            <div className="h-1.5 w-6 rounded-full bg-white" />
            <div className="size-1.5 rounded-full bg-white/40" />
            <div className="size-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </aside>
    </main>
  )
}
