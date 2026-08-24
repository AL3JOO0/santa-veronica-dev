import type { SupabaseClient } from '@supabase/supabase-js'

import { sendEmail } from '@/lib/server/email'
import {
  createSelectionEmailNotification,
  markSelectionEmailNotificationFailed,
  markSelectionEmailNotificationSent,
} from '@/lib/server/email-notifications'

interface PhotoForNotification {
  id: string
  original_filename: string
}

interface NotifySelectionInput {
  admin: SupabaseClient
  selectionId: string
  studentId: string
  photos: PhotoForNotification[]
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function notifySelectionSubmitted(input: NotifySelectionInput) {
  const { admin, selectionId, studentId, photos } = input

  const { data: student, error: studentError } = await admin
    .from('students')
    .select('id, event_id, document_number, first_name, last_name')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    throw new Error('No fue posible obtener los datos del estudiante para la notificación.')
  }

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id, institution_id, name, event_date')
    .eq('id', student.event_id)
    .single()

  if (eventError || !event) {
    throw new Error('No fue posible obtener el evento para la notificación.')
  }

  const { data: institution, error: institutionError } = await admin
    .from('institutions')
    .select('id, name, notification_email')
    .eq('id', event.institution_id)
    .single()

  if (institutionError || !institution) {
    throw new Error('No fue posible obtener la universidad para la notificación.')
  }

  const recipient = String(institution.notification_email || '').trim()
  const studentName = `${student.first_name} ${student.last_name}`.trim()
  const filenames = photos.map((photo) => photo.original_filename).filter(Boolean)
  const subject = `Selección fotográfica - ${studentName} - ${event.name}`

  const text = [
    'Santa Verónica - Nueva selección fotográfica',
    '',
    `Universidad: ${institution.name}`,
    `Evento: ${event.name}`,
    `Estudiante: ${studentName}`,
    `Documento: ${student.document_number}`,
    `Fotografías seleccionadas: ${filenames.length}`,
    '',
    'Archivos seleccionados:',
    ...filenames.map((filename, index) => `${index + 1}. ${filename}`),
    '',
    'Este correo fue generado automáticamente por Santa Verónica.',
  ].join('\n')

  const htmlList = filenames
    .map((filename) => `<li style="margin:0 0 6px 0;">${escapeHtml(filename)}</li>`)
    .join('')

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#172333;line-height:1.5;max-width:680px;margin:0 auto;">
      <div style="border-top:4px solid #e87c1e;padding:24px 4px;">
        <h2 style="margin:0 0 18px;color:#954a00;font-size:22px;">Nueva selección fotográfica</h2>
        <p style="margin:0 0 16px;">Un estudiante realizó el envío de su selección en Santa Verónica.</p>
        <table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
          <tr><td style="padding:6px 12px 6px 0;font-weight:700;">Universidad</td><td>${escapeHtml(institution.name)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;font-weight:700;">Evento</td><td>${escapeHtml(event.name)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;font-weight:700;">Estudiante</td><td>${escapeHtml(studentName)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;font-weight:700;">Documento</td><td>${escapeHtml(String(student.document_number))}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;font-weight:700;">Total seleccionado</td><td>${filenames.length}</td></tr>
        </table>
        <h3 style="font-size:16px;margin:0 0 10px;">Fotografías seleccionadas</h3>
        <ol style="padding-left:22px;margin:0 0 20px;">${htmlList}</ol>
        <p style="font-size:12px;color:#757981;margin:0;">Este correo fue generado automáticamente por Santa Verónica.</p>
      </div>
    </div>
  `

  const notificationId = await createSelectionEmailNotification(admin, {
    selectionId,
    institutionId: institution.id,
    recipientEmail: recipient || null,
    subject,
    body: text,
  })

  if (!recipient || !isValidEmail(recipient)) {
    const message = 'La universidad no tiene configurado un correo de notificación válido.'
    await markSelectionEmailNotificationFailed(admin, notificationId, message)
    return { sent: false, reason: message }
  }

  try {
    await sendEmail({
      to: recipient,
      subject,
      text,
      html,
    })

    await markSelectionEmailNotificationSent(admin, notificationId)
    return { sent: true, recipient }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido enviando el correo.'
    await markSelectionEmailNotificationFailed(admin, notificationId, message)
    console.error('Error enviando notificación de selección:', error)
    return { sent: false, reason: message }
  }
}
