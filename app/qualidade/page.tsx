import type { Metadata } from "next"
import { DataQuality } from "@/components/fica/data-quality"

export const metadata: Metadata = { title: "Qualidade dos Dados · RJ.connect" }

export default function Page() {
  return <DataQuality />
}
