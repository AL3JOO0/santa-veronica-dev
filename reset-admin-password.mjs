import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { error } = await supabase.auth.admin.updateUserById(
  "d21b6492-8fae-4396-a073-c26181b3638c",
  {
    password: "Manager1!"
  }
)

if (error) {
  console.error("Error:", error.message)
} else {
  console.log("Contraseña cambiada correctamente")
}