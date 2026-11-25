import type { Metadata } from "next"
import { Consultation } from "@/components/fica/consultation"

export const metadata: Metadata = { title: "Consulta · RJ.connect" }

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <Consultation key={id} id={id} />
}
