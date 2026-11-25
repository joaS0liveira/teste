import type { Metadata } from "next"
import { CompanyCasePage } from "@/components/fica/company-case"

export const metadata: Metadata = { title: "Caso · RJ.connect" }

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CompanyCasePage key={id} id={id} />
}
