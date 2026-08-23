import { StudentPhotos } from "@/components/students/student-photos"

interface Props {
  params: Promise<{
    id: string
    studentId: string
  }>
}

export default async function StudentPhotosPage({ params }: Props) {
  const { id, studentId } = await params

  return (
    <div className="mx-auto max-w-7xl">
      <StudentPhotos eventId={id} studentId={studentId} />
    </div>
  )
}