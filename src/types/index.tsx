export interface Expedicao {
  id: string;
  nome: string;
  pais: string;
  tipo_destino: string;
  categorias: string[];
  descricao: string;
  fotos: string[];
  incluso: string[];
  nao_incluso: string[];
  observacoes: string[];
  created_at: string;
}

export interface Pacote {
  id: string;
  nome: string;
  expedicao_id: string;
  data_inicio: string;
  data_fim: string;
  vagas: number;
  vagas_ocupadas: number;
  preco_duplo: number;
  preco_single?: number;
  status: string;
  desconto_percentual: number;
  promocao_inicio?: string;
  promocao_fim?: string;
  lote_atual?: number;
  pacote_lotes?: PacoteLote[];
  created_at: string;
}

export interface Roteiro {
  id: string;
  expedicao_id: string;
  dia: number;
  titulo: string;
  descricao: string;
  created_at: string;
}

export interface Reserva {
  id: string;
  pacote_id: string;
  cliente_id: string;
  valor_pago: number;
  forma_pagamento?: string;
  status: string;
  observacoes?: string;
  created_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  instagram?: string;
  data_nascimento?: string;
  cpf?: string;
  passaporte?: string;
  contato_emergencia?: string;
  observacoes?: string;
  aceita_ofertas: boolean;
  created_at: string;
}

export interface PacoteLote {
  id: string;
  pacote_id: string;
  lote_numero: number;
  preco_duplo: number;
  preco_single?: number;
  vagas_gatilho: number;
}