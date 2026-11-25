import type { Metadata } from "next"
import { Recommendations } from "@/components/fica/recommendations"

export const metadata: Metadata = {
  title: "Recomendações e Intervenções · RJ.connect",
}

export default function Page() {
  return <Recommendations />
}
