import type { SupabaseClient } from '@supabase/supabase-js'

interface CreateNotificationInput {
  selectionId: string
  institutionId: string | null
  recipientEmail: string | null
  subject: string
  body: string
}

export async function createSelectionEmailNotification(
  admin: SupabaseClient,
  input: CreateNotificationInput,
) {
  const { data, error } = await admin
    .from('email_notifications')
    .insert({
      selection_id: input.selectionId,
      institution_id: input.institutionId,
      recipient_email: input.recipientEmail,
      subject: input.subject,
      body: input.body,
      type: 'SELECTION_SUBMITTED',
      status: 'PENDING',
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    // La notificación por correo no debe impedir que el estudiante
    // entregue su selección. Se registra el problema en consola.
    console.warn('No fue posible registrar email_notifications:', error)
    return null
  }

  return data.id as string
}

export async function markSelectionEmailNotificationSent(
  admin: SupabaseClient,
  id: string | null,
) {
  if (!id) return

  const now = new Date().toISOString()
  const { error } = await admin
    .from('email_notifications')
    .update({
      status: 'SENT',
      sent_at: now,
      error_message: null,
      updated_at: now,
    })
    .eq('id', id)

  if (error) {
    console.warn('No fue posible marcar la notificación como SENT:', error)
  }
}

export async function markSelectionEmailNotificationFailed(
  admin: SupabaseClient,
  id: string | null,
  errorMessage: string,
) {
  if (!id) return

  const { error } = await admin
    .from('email_notifications')
    .update({
      status: 'FAILED',
      error_message: errorMessage.slice(0, 2000),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.warn('No fue posible marcar la notificación como FAILED:', error)
  }
}
