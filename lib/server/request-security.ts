import 'server-only'

import { createHash } from 'node:crypto'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const globalForRateLimit = globalThis as typeof globalThis & {
  __svRateLimits?: Map<string, RateLimitEntry>
}

const rateLimits = globalForRateLimit.__svRateLimits ?? new Map<string, RateLimitEntry>()
globalForRateLimit.__svRateLimits = rateLimits

export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    const originUrl = new URL(origin)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const host = forwardedHost || request.headers.get('host')
    return Boolean(host && originUrl.host === host)
  } catch {
    return false
  }
}

export function getClientAddress(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const existing = rateLimits.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    rateLimits.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  existing.count += 1
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  }
}

let warnedAboutDatabaseRateLimit = false

export async function consumeDistributedRateLimit(
  admin: SupabaseClient,
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const keyHash = createHash('sha256').update(key).digest('hex')
  const { data, error } = await admin.rpc('consume_login_rate_limit', {
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (!error && Array.isArray(data) && data[0]) {
    const result = data[0] as { allowed: boolean; retry_after: number }
    return {
      allowed: result.allowed,
      remaining: 0,
      resetAt: Date.now() + Math.max(1, result.retry_after) * 1000,
    }
  }

  if (!warnedAboutDatabaseRateLimit) {
    warnedAboutDatabaseRateLimit = true
    console.warn(
      'Rate limit distribuido no disponible; usando fallback local. Ejecuta supabase/security_hardening.sql.',
      error?.message,
    )
  }

  return consumeRateLimit(key, limit, windowSeconds * 1000)
}
