import type { Metadata } from "next"
import { Participants } from "@/components/fica/participants"

export const metadata: Metadata = {
  title: "Participantes e Barreiras · RJ.connect",
}

export default function Page() {
  return <Participants />
}
