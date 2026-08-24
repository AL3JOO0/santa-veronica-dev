-- ============================================================
-- Santa Verónica
-- Correo de notificaciones por universidad + auditoría de envíos
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- El script es idempotente: se puede volver a ejecutar.
-- ============================================================

-- 1. Correo que recibirá las selecciones del estudiante.
ALTER TABLE public.institutions
ADD COLUMN IF NOT EXISTS notification_email VARCHAR(320);

COMMENT ON COLUMN public.institutions.notification_email IS
'Correo que recibe las notificaciones cuando un estudiante envía su selección fotográfica.';

-- 2. Completar la tabla existente de notificaciones.
-- Los enums notification_status y notification_type ya forman parte
-- del modelo actual del proyecto.
ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS selection_id UUID REFERENCES public.selections(id) ON DELETE CASCADE;

ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL;

ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(320);

ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS subject TEXT;

ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS type notification_type NOT NULL DEFAULT 'SELECTION_SUBMITTED';

ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS status notification_status NOT NULL DEFAULT 'PENDING';

ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.email_notifications
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS uq_email_notifications_id
ON public.email_notifications(id);

CREATE INDEX IF NOT EXISTS idx_email_notifications_selection
ON public.email_notifications(selection_id);

CREATE INDEX IF NOT EXISTS idx_email_notifications_status
ON public.email_notifications(status);

CREATE INDEX IF NOT EXISTS idx_institutions_notification_email
ON public.institutions(notification_email)
WHERE notification_email IS NOT NULL;
