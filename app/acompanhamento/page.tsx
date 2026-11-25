import type { Metadata } from "next"
import { FollowUp } from "@/components/fica/follow-up"

export const metadata: Metadata = {
  title: "Acompanhamento e Planos de Ação · RJ.connect",
}

export default function Page() {
  return <FollowUp />
}
