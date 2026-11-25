import type { Metadata } from "next"
import { Companies } from "@/components/fica/companies"

export const metadata: Metadata = { title: "Empresas · RJ.connect" }

export default function Page() {
  return <Companies />
}
