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
  nome_cliente: string;
  email?: string;
  telefone: string;
  data_nascimento?: string;
  cpf?: string;
  passaporte?: string;
  valor_pago: number;
  forma_pagamento?: string;
  status: string;
  contato_emergencia?: string;
  observacoes?: string;
  created_at: string;
}