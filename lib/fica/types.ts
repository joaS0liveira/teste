// Shapes of the original JSON files. Field names follow the source.

export type Entity = { id: string; nome: string }

export type Company = {
  id: string
  nome_ficticio: string
  regiao: string
  setor: string
}

export type Participant = {
  id: string
  idade: number
  regiao: string
  situacao_inicial: string
  data_entrada: string
  entidade_social_id: string
  barreiras_emprego: string
  nivel_qualificacao: string
}

export type ContractType = "temporario" | "permanente"

export type Placement = {
  id: string
  id_participante: string
  id_empresa: string
  horas_semanais: number
  salario: number
  data_colocacao: string
  data_fim: string | null
  motivo_saida: string | null
  tipo_contrato: ContractType
}

export type ActionPlan = {
  id_participante: string
  data: string
  tipo_acao: string
  estado: string
}

export type TrainingAction = {
  id: string
  id_participante: string
  tipo_formacao: string
  area: string
  data_inicio: string
  data_fim: string | null
  conclusao: boolean
  resultado: string
}

export type TrainingCost = {
  id_acao: string
  custo: number
  fornecedor: string
  horas: number
}

export type SupportResource = {
  id_entidade: string
  custo: number
  horas_acompanhamento: number
}

export type RawContact = {
  id: string
  id_participante: string
  data: string
  tipo_contacto: string
  estado: "realizado" | "nao_realizado" | "agendado"
  resultado_contacto: string | null
  encaminhamento: string | null
  proximo_contacto: string | null
}

export type DateStatus = "certain" | "converted" | "unreliable"

export type Contact = {
  raw: RawContact
  /** ISO date, or null when the date cannot be trusted. */
  date: string | null
  dateStatus: DateStatus
  /** Only kept when the contact took place. */
  result: string | null
  /** Scheduled, with a date already in the past. */
  toConfirm: boolean
}
