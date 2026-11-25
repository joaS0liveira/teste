import type { Metadata } from "next"
import { Training } from "@/components/fica/training"

export const metadata: Metadata = {
  title: "Formação e Desenvolvimento · RJ.connect",
}

export default function Page() {
  return <Training />
}
