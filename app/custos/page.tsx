import type { Metadata } from "next"
import { Costs } from "@/components/fica/costs"

export const metadata: Metadata = { title: "Custos · RJ.connect" }

export default function Page() {
  return <Costs />
}
