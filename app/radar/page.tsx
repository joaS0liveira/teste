import type { Metadata } from "next"
import { RadarHome } from "@/components/fica/radar-home"

export const metadata: Metadata = { title: "Radar · RJ.connect" }

export default function Page() {
  return <RadarHome />
}
