import type { Metadata } from "next"
import { Simulator } from "@/components/fica/simulator"

export const metadata: Metadata = { title: "E se? · RJ.connect" }

export default function Page() {
  return <Simulator />
}
