// src/utils/precos.ts
// utilitário evita duplicar a regra de prioridade (compartilhado → triplo → duplo → single) e as funções de formatação de moeda entre a Home e a página da Expedição

export type TipoAcomodacao = 'compartilhado' | 'triplo' | 'duplo' | 'single';

export interface CamposPreco {
  preco_compartilhado?: number | string | null;
  preco_triplo?: number | string | null;
  preco_duplo?: number | string | null;
  preco_single?: number | string | null;
}

export interface PacoteComPrecos extends CamposPreco {
  lote_atual?: number | null;
  pacote_lotes?: (CamposPreco & { lote_numero: number })[];
}

export interface OpcaoAcomodacao {
  tipo: TipoAcomodacao;
  label: string;
  descricao: string;
  preco: number;
}

export const ORDEM_ACOMODACOES: {
  tipo: TipoAcomodacao;
  campo: keyof CamposPreco;
  label: string;
  descricao: string;
}[] = [
  {
    tipo: 'compartilhado',
    campo: 'preco_compartilhado',
    label: 'Compartilhado',
    descricao: 'Quarto compartilhado com 4 ou mais pessoas, conferir disponibilidade.',
  },
  {
    tipo: 'triplo',
    campo: 'preco_triplo',
    label: 'Triplo',
    descricao: 'Quarto compartilhado em três pessoas.',
  },
  {
    tipo: 'duplo',
    campo: 'preco_duplo',
    label: 'Duplo',
    descricao: 'Quarto para duas pessoas.',
  },
  {
    tipo: 'single',
    campo: 'preco_single',
    label: 'Single',
    descricao: 'Quarto individual.',
  },
];

function extrairNumeroValido(valor: number | string | null | undefined): number {
  if (valor === null || valor === undefined || valor === '') return 0;
  const num = Number(valor);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

/**
 * Retorna todas as acomodações disponíveis (> 0) de um pacote,
 * respeitando o lote atual (quando houver) e a ordem de prioridade.
 */
export function obterOpcoesAcomodacao(pacote: PacoteComPrecos | null | undefined): OpcaoAcomodacao[] {
  if (!pacote) return [];

  const loteAtualInfo =
    pacote.pacote_lotes?.find((l) => l.lote_numero === pacote.lote_atual) ||
    pacote.pacote_lotes?.[0];

  const loteTemAlgumPreco =
    Boolean(loteAtualInfo) &&
    ORDEM_ACOMODACOES.some((cfg) => extrairNumeroValido(loteAtualInfo?.[cfg.campo]) > 0);

  const fonte = loteTemAlgumPreco ? loteAtualInfo! : pacote;

  const opcoes: OpcaoAcomodacao[] = [];

  for (const cfg of ORDEM_ACOMODACOES) {
    const preco = extrairNumeroValido(fonte[cfg.campo]);
    if (preco > 0) {
      opcoes.push({
        tipo: cfg.tipo,
        label: cfg.label,
        descricao: cfg.descricao,
        preco,
      });
    }
  }

  return opcoes;
}

/**
 * Retorna a opção de maior prioridade disponível (Compartilhado -> Triplo -> Duplo -> Single).
 */
export function obterPrecoPrioritario(pacote: PacoteComPrecos | null | undefined): OpcaoAcomodacao | null {
  const opcoes = obterOpcoesAcomodacao(pacote);
  return opcoes[0] || null;
}

export function formatarMoedaBRL(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

export function formatarMoedaUSD(valor: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valor);
}

export function formatarMoedaEUR(valor: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(valor);
}