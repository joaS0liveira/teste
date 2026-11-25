import type { Metadata } from "next"
import { Study } from "@/components/fica/study"

export const metadata: Metadata = { title: "Conheça o Estudo · RJ.connect" }

export default function Page() {
  return <Study />
}
