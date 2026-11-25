import type { Metadata } from "next"
import { Tasks } from "@/components/fica/tasks"

export const metadata: Metadata = { title: "Tarefas · RJ.connect" }

export default function Page() {
  return <Tasks />
}
