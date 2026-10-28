import { Injectable, computed, inject } from '@angular/core';
import { ArmazenamentoService } from './armazenamento.service';
import { BancoService } from './banco.service';
import { Questao, TreinoAtual } from './modelos';
import { desempenhoPorTema } from './avaliacao';

export type ModoTreino = TreinoAtual['modo'];

function embaralhar<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Treino livre por tema ou por ano: sem cronômetro, sem nota, correção logo após responder. */
@Injectable({ providedIn: 'root' })
export class TreinoService {
  private store = inject(ArmazenamentoService);
  private banco = inject(BancoService);

  readonly atual = computed(() => {
    const t = this.store.estado().treino;
    if (!t) return null;
    // Treinos salvos antes da escolha de vários temas tinham `filtro: string`.
    const antigo = (t as unknown as { filtro?: string }).filtro;
    return t.filtros ? t : { ...t, filtros: antigo ? [antigo] : [] };
  });

  /** Temas com a quantidade de questões, em ordem alfabética. */
  readonly temas = computed(() => {
    const cont = new Map<string, number>();
    for (const q of this.banco.questoes()) cont.set(q.tema, (cont.get(q.tema) ?? 0) + 1);
    return [...cont].map(([tema, total]) => ({ tema, total })).sort((a, b) => a.tema.localeCompare(b.tema, 'pt-BR'));
  });

  /** Temas reunidos por grande área: Formação geral primeiro, depois as áreas com mais temas (equilibra a grade). */
  readonly grupos = computed(() => {
    const grupoDe = new Map(this.banco.questoes().map(q => [q.tema, q.grupo]));
    const m = new Map<string, { tema: string; total: number }[]>();
    for (const t of this.temas()) { const g = grupoDe.get(t.tema)!; m.set(g, [...(m.get(g) ?? []), t]); }
    return [...m].map(([grupo, temas]) => ({ grupo, temas, total: temas.reduce((s, t) => s + t.total, 0) }))
      .sort((a, b) => Number(b.grupo === 'Formação geral') - Number(a.grupo === 'Formação geral') || b.temas.length - a.temas.length || b.total - a.total);
  });

  /** Aproveitamento nas objetivas de cada tema, somando os simulados entregues. */
  readonly desempenho = computed(() =>
    new Map(desempenhoPorTema(this.store.estado().historico, this.banco.porId()).map(d => [d.tema, d])));

  /** Questões que entram num treino com esse filtro. */
  filtrar(modo: ModoTreino, filtros: string[], comDiscursivas: boolean): Questao[] {
    return this.banco.questoes().filter(q =>
      filtros.includes(modo === 'tema' ? q.tema : String(q.ano)) && (comDiscursivas || q.tipo === 'obj'));
  }

  iniciar(modo: ModoTreino, filtros: string[], comDiscursivas: boolean, aleatorio: boolean): void {
    const qs = this.filtrar(modo, filtros, comDiscursivas)
      .sort((a, b) => a.ano - b.ano || a.n - b.n || a.tipo.localeCompare(b.tipo));
    const treino: TreinoAtual = {
      modo, filtros, qids: (aleatorio ? embaralhar(qs) : qs).map(q => q.id),
      respostas: {}, conferidas: {}, indice: 0,
    };
    this.store.atualizar(s => { s.treino = treino; });
  }

  /** Objetivas: responder já confere. Discursivas: o texto é salvo e a conferência é separada. */
  responder(id: string, valor: string): void {
    this.store.atualizar(s => {
      const t = s.treino; if (!t || t.conferidas[id]) return;
      t.respostas[id] = valor;
      if (this.banco.porId().get(id)?.tipo === 'obj') t.conferidas[id] = true;
    });
  }
  conferir(id: string): void { this.store.atualizar(s => { if (s.treino) s.treino.conferidas[id] = true; }); }
  irPara(i: number): void {
    this.store.atualizar(s => { if (s.treino && i >= 0 && i < s.treino.qids.length) s.treino.indice = i; });
  }
  encerrar(): void { this.store.atualizar(s => { s.treino = null; }); }
}
