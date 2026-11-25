import type { Metadata } from "next"
import { Suspense } from "react"
import { Journeys } from "@/components/fica/journeys"
import { Loading } from "@/components/fica/screen"

export const metadata: Metadata = { title: "Percursos · RJ.connect" }

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Journeys />
    </Suspense>
  )
}
