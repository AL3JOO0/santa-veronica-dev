# Login de estudiantes por documento y contraseña

El proyecto mantiene un solo `/login`.

- **Administrador:** usuario como `adminsv`; se valida con `usuarios_acceso` + Supabase Auth.
- **Estudiante:** número de documento; se valida contra `students.password_hash` con bcrypt.

Los estudiantes **no se crean en `auth.users`**, **no necesitan `usuarios_acceso`** y **no van en `.env`**.

## 1. Base de datos

Ejecuta `supabase/student_password_login.sql`.

Agrega `password_hash` a `students`. Como ya detectaste un documento duplicado, el script no borra nada automáticamente. Revisa los dos registros, elimina el que realmente no necesites y luego crea el índice único:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_document_number
ON public.students(document_number);
```

## 2. Estudiante individual

El formulario **Agregar estudiante** ahora pide contraseña. El API la recibe y guarda únicamente su hash bcrypt.

Al editar, el campo de contraseña queda vacío. Si no escribes nada, conserva la actual; si escribes una nueva, genera otro hash.

## 3. Carga masiva

En el detalle del evento se agregaron **Plantilla** e **Importar Excel**.

La plantilla tiene:

`Documento | Nombre | Apellido | Correo | Contraseña | Estado`

La importación se procesa por lotes de 40 estudiantes. El servidor genera el hash de cada contraseña. Si un documento ya existe en el mismo evento, actualiza sus datos y contraseña; si pertenece a otro evento, detiene el lote para evitar moverlo por accidente.

## 4. Login

Ejemplo:

```text
Usuario o cédula: 1032456789
Contraseña: Foto2026!
```

Si la clave coincide, la sesión guarda el `students.id` y redirige a `/cliente/galeria`, que sigue consultando únicamente las fotos asociadas a ese estudiante.
