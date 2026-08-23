-- SANTA VERONICA - LOGIN DE ESTUDIANTES POR CEDULA + CONTRASENA
-- Administradores: usuarios_acceso + Supabase Auth.
-- Estudiantes: students.document_number + students.password_hash.

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS password_hash TEXT;

COMMENT ON COLUMN public.students.password_hash IS
'Hash bcrypt de la contrasena del estudiante. Nunca guardar texto plano.';

CREATE INDEX IF NOT EXISTS idx_students_document_number
ON public.students(document_number);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.students
        GROUP BY document_number
        HAVING COUNT(*) > 1
    ) THEN
        RAISE NOTICE 'Hay documentos duplicados. Limpialos antes de crear uq_students_document_number.';
    ELSE
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = 'public'
              AND indexname = 'uq_students_document_number'
        ) THEN
            EXECUTE 'CREATE UNIQUE INDEX uq_students_document_number ON public.students(document_number)';
        END IF;
    END IF;
END
$$;

-- DUPLICADOS:
-- SELECT document_number, COUNT(*) AS cantidad
-- FROM public.students
-- GROUP BY document_number
-- HAVING COUNT(*) > 1;

-- Revisar antes de borrar uno:
-- SELECT id, event_id, document_number, first_name, last_name, email, status, created_at
-- FROM public.students
-- WHERE document_number = '019988578'
-- ORDER BY created_at;

-- Una vez limpio:
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_students_document_number
-- ON public.students(document_number);

-- Estudiantes sin clave:
-- SELECT id, document_number, first_name, last_name
-- FROM public.students
-- WHERE password_hash IS NULL;
