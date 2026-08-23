import { NextRequest, NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2 } from "@/lib/r2"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  const { studentId, filename, mimeType } = await req.json()

  if (!studentId || !filename || !mimeType) {
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 })
  }

  const ext = filename.split(".").pop()
  const key = `students/${studentId}/${randomUUID()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
  })

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 })

  return NextResponse.json({ uploadUrl, key })
}