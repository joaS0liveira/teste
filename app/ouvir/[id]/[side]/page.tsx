import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ListenPage } from "@/components/fica/listen-page"

export const metadata: Metadata = { title: "Ouvir · RJ.connect" }

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; side: string }>
}) {
  const { id, side } = await params
  if (side !== "company" && side !== "worker") notFound()
  return <ListenPage key={side} companyId={id} side={side} />
}
