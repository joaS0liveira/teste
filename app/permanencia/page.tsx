import type { Metadata } from "next"
import { Permanence } from "@/components/fica/permanence"

export const metadata: Metadata = {
  title: "Permanência no Emprego · RJ.connect",
}

export default function Page() {
  return <Permanence />
}
