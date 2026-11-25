import type { Metadata } from "next"
import { Groups } from "@/components/fica/groups"

export const metadata: Metadata = { title: "Entidades e Empresas · RJ.connect" }

export default function Page() {
  return <Groups />
}
