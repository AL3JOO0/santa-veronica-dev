# Revisión del merge - Santa Verónica

Se revisó el proyecto posterior al merge contra la versión que ya tenía el login unificado y el acceso de estudiantes por documento + contraseña.

## Se conservaron los cambios nuevos

- Nuevo diálogo de importación masiva desde Excel.
- Validación previa de filas y documentos repetidos en el archivo.
- Cambios actuales de la vista de evento.
- Cambios actuales del encabezado y sidebar.
- Login visual unificado.
- Galería del estudiante y envío de selección.

## Ajustes aplicados después del merge

El merge había regresado `lib/services/students.service.ts` a acceso directo desde el navegador a Supabase. Eso hacía que crear/importar estudiantes no pasara por las APIs que generan `password_hash`.

Se corrigió para que:

- Crear estudiante use `POST /api/students`.
- Editar estudiante use `PATCH /api/students/[id]`.
- Eliminar use `DELETE /api/students/[id]`.
- Consultar estudiantes use las rutas API protegidas.
- La carga masiva use `POST /api/students/bulk` en lotes de 40.
- La plantilla Excel vuelva a incluir la columna `Contraseña`.
- La contraseña de cada fila llegue al backend y sea convertida a bcrypt antes de guardarse.
- El nuevo diálogo de importación del merge se mantenga.

## Flujo conservado

Administrador:
`/login -> usuarios_acceso -> Supabase Auth -> Dashboard`

Estudiante:
`/login -> students.document_number -> password_hash/bcrypt -> /cliente/galeria`

Los estudiantes no necesitan registros individuales en Supabase Authentication.

## Base de datos requerida

Ejecutar `supabase/student_password_login.sql` para garantizar la columna `students.password_hash` y el índice único de `document_number` una vez eliminados los documentos duplicados.

El archivo `.env` real no se incluye en el comprimido corregido.
