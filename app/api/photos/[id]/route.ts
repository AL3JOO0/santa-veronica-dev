import { NextRequest, NextResponse } from "next/server"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { r2 } from "@/lib/r2"
import { supabase } from "@/lib/supabase"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("storage_key")
    .eq("id", id)
    .single()

  if (fetchError || !photo) {
    return NextResponse.json({ error: "Foto no encontrada." }, { status: 404 })
  }

  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: photo.storage_key,
    })
  )

  const { error: deleteError } = await supabase
    .from("photos")
    .delete()
    .eq("id", id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}