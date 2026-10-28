/** Área da questão no ENADE. */
export type Area = 'fg' | 'ce';
export type Tipo = 'obj' | 'disc';
export type Letra = 'A' | 'B' | 'C' | 'D' | 'E';
export const LETRAS: Letra[] = ['A', 'B', 'C', 'D', 'E'];

/** Formato de cada questão nos arquivos public/dados/*.json (markup leve, ver README). */
export interface QuestaoFonte {
  id: string;
  n: number;
  area: Area;
  tipo: Tipo;
  tema: string;
  enunciado: string;
  alternativas?: string[];
  resposta?: Letra;
  explicacao?: string;
  padraoResposta?: string;
}

export interface ProvaFonte {
  ano: number;
  curso: string;
  grau: string;
  anuladas: number[];
  questoes: QuestaoFonte[];
}

/** Questão já pronta para exibição (markup convertido em HTML). */
export interface Questao {
  id: string;
  ano: number;
  n: number;
  area: Area;
  tipo: Tipo;
  tema: string;
  enunciadoHtml: string;
  alternativasHtml: string[];
  resposta?: Letra;
  explicacao?: string;
  padraoHtml?: string;
}

/** Simulado em andamento. */
export interface SimuladoAtual {
  id: string;
  inicio: number;
  prazo: number;
  qids: string[];
  respostas: Record<string, string>;
  marcadas: Record<string, boolean>;
  indice: number;
  comDiscursivas: boolean;
}

/** Simulado entregue (vai para o histórico). */
export interface Resultado {
  id: string;
  data: number;
  /** Só em resultados antigos, de quando o app pedia o nome. */
  nome?: string;
  duracao: number;
  qids: string[];
  respostas: Record<string, string>;
  notasDiscursivas: Record<string, number>;
  comDiscursivas: boolean;
  esgotouTempo: boolean;
}

/** Treino em andamento: questões de um tema ou de um ano, sem cronômetro e com correção na hora. */
export interface TreinoAtual {
  modo: 'tema' | 'ano';
  /** Temas escolhidos ou o ano (como texto, um item só). */
  filtros: string[];
  qids: string[];
  respostas: Record<string, string>;
  /** Questões já corrigidas (alternativa conferida ou padrão de resposta aberto). */
  conferidas: Record<string, boolean>;
  indice: number;
}

export interface Armazenamento {
  versao: 1;
  historico: Resultado[];
  atual: SimuladoAtual | null;
  treino?: TreinoAtual | null;
  /** Quantas vezes cada questão já foi sorteada (o sorteio prioriza as menos vistas). */
  vistas: Record<string, number>;
  tema?: 'claro' | 'escuro';
}

export interface Avaliacao {
  fgAcertos: number; fgTotal: number;
  ceAcertos: number; ceTotal: number;
  acertos: number; totalObjetivas: number;
  emBranco: number;
  discursivas: number; pendentes: number;
  notaFG: number; notaCE: number; nota: number;
}

export interface DesempenhoTema { tema: string; acertos: number; total: number; taxa: number; }
