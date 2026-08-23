-- ============================================================
-- SANTA VERONICA - LOGIN UNIFICADO
-- Administradores: ingresan con usuario.
-- Estudiantes: ingresan con numero de cedula.
-- La contraseña SIEMPRE la administra Supabase Auth.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usuarios_acceso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    identificador VARCHAR(100) NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL,
    id_usuario UUID REFERENCES public.users(id) ON DELETE CASCADE,
    id_estudiante UUID REFERENCES public.students(id) ON DELETE CASCADE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_usuarios_acceso_tipo
        CHECK (tipo_usuario IN ('ADMINISTRADOR', 'ESTUDIANTE')),

    CONSTRAINT chk_usuarios_acceso_perfil
        CHECK (
            (
                tipo_usuario = 'ADMINISTRADOR'
                AND id_usuario IS NOT NULL
                AND id_estudiante IS NULL
            )
            OR
            (
                tipo_usuario = 'ESTUDIANTE'
                AND id_estudiante IS NOT NULL
                AND id_usuario IS NULL
            )
        )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_acceso_identificador
ON public.usuarios_acceso (LOWER(identificador));

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_acceso_auth
ON public.usuarios_acceso (auth_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_acceso_usuario
ON public.usuarios_acceso (id_usuario)
WHERE id_usuario IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_acceso_estudiante
ON public.usuarios_acceso (id_estudiante)
WHERE id_estudiante IS NOT NULL;

CREATE OR REPLACE FUNCTION public.actualizar_fecha_usuarios_acceso()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_actualizar_fecha_usuarios_acceso
ON public.usuarios_acceso;

CREATE TRIGGER trg_actualizar_fecha_usuarios_acceso
BEFORE UPDATE ON public.usuarios_acceso
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_fecha_usuarios_acceso();

-- La aplicacion consulta esta tabla solamente desde las rutas API del servidor
-- usando SUPABASE_SERVICE_ROLE_KEY.
ALTER TABLE public.usuarios_acceso ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- EJEMPLOS DE RELACION
-- Primero crea el usuario en Authentication > Users y copia su UUID.
-- NO guardes contraseñas en public.users, students ni usuarios_acceso.
-- ============================================================

-- ADMINISTRADOR
-- Reemplaza los valores antes de ejecutar.
-- INSERT INTO public.usuarios_acceso (
--     auth_user_id,
--     identificador,
--     tipo_usuario,
--     id_usuario
-- )
-- SELECT
--     'UUID_AUTH_ADMIN'::uuid,
--     'adminsv',
--     'ADMINISTRADOR',
--     u.id
-- FROM public.users u
-- WHERE u.email = 'admin@santaveronica.com';

-- ESTUDIANTE
-- Reemplaza UUID_AUTH_ESTUDIANTE y la cedula.
-- INSERT INTO public.usuarios_acceso (
--     auth_user_id,
--     identificador,
--     tipo_usuario,
--     id_estudiante
-- )
-- SELECT
--     'UUID_AUTH_ESTUDIANTE'::uuid,
--     s.document_number,
--     'ESTUDIANTE',
--     s.id
-- FROM public.students s
-- WHERE s.document_number = '1032456789';

-- Validacion rapida:
-- SELECT
--     ua.identificador,
--     ua.tipo_usuario,
--     ua.activo,
--     ua.id_usuario,
--     ua.id_estudiante,
--     ua.auth_user_id
-- FROM public.usuarios_acceso ua
-- ORDER BY ua.fecha_creacion DESC;
