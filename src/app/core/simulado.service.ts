import { Injectable, computed, inject, signal } from '@angular/core';
import { ArmazenamentoService } from './armazenamento.service';
import { BancoService } from './banco.service';
import { Questao, Resultado, SimuladoAtual } from './modelos';

export const DURACAO_PROVA = 4 * 60 * 60 * 1000;

/** Composição oficial da prova. */
const ESTRUTURA = { fgDisc: 2, fgObj: 8, ceDisc: 3, ceObj: 27 };

function embaralhar<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

@Injectable({ providedIn: 'root' })
export class SimuladoService {
  private store = inject(ArmazenamentoService);
  private banco = inject(BancoService);

  /** Relógio atualizado a cada segundo enquanto há prova em andamento. */
  readonly agora = signal(Date.now());
  readonly atual = computed(() => this.store.estado().atual);
  readonly restante = computed(() => { const a = this.atual(); return a ? a.prazo - this.agora() : 0; });
  private relogio?: ReturnType<typeof setInterval>;

  iniciarRelogio(): void {
    this.pararRelogio();
    this.agora.set(Date.now());
    this.relogio = setInterval(() => this.agora.set(Date.now()), 1000);
  }
  pararRelogio(): void { if (this.relogio) clearInterval(this.relogio); }

  /** Sorteia priorizando as questões menos vistas pelo aluno. */
  private sortear(pool: Questao[], n: number): string[] {
    const vistas = this.store.estado().vistas;
    const ordenado = embaralhar(pool.slice()).sort((a, b) => (vistas[a.id] ?? 0) - (vistas[b.id] ?? 0));
    return embaralhar(ordenado.slice(0, n)).map(q => q.id);
  }

  iniciar(comDiscursivas: boolean): void {
    const qs = this.banco.questoes();
    const de = (area: string, tipo: string) => qs.filter(q => q.area === area && q.tipo === tipo);
    const qids = [
      ...(comDiscursivas ? this.sortear(de('fg', 'disc'), ESTRUTURA.fgDisc) : []),
      ...this.sortear(de('fg', 'obj'), ESTRUTURA.fgObj),
      ...(comDiscursivas ? this.sortear(de('ce', 'disc'), ESTRUTURA.ceDisc) : []),
      ...this.sortear(de('ce', 'obj'), ESTRUTURA.ceObj),
    ];
    const agora = Date.now();
    const sim: SimuladoAtual = {
      id: 's' + agora, inicio: agora, prazo: agora + DURACAO_PROVA, qids,
      respostas: {}, marcadas: {}, indice: 0, comDiscursivas,
    };
    this.store.atualizar(s => { s.atual = sim; });
  }

  responder(id: string, valor: string): void { this.store.atualizar(s => { if (s.atual) s.atual.respostas[id] = valor; }); }
  alternarMarcada(id: string): void { this.store.atualizar(s => { if (s.atual) s.atual.marcadas[id] = !s.atual.marcadas[id]; }); }
  irPara(i: number): void {
    this.store.atualizar(s => { if (s.atual && i >= 0 && i < s.atual.qids.length) s.atual.indice = i; });
  }
  descartar(): void { this.store.atualizar(s => { s.atual = null; }); }

  respondida(id: string): boolean {
    const v = this.atual()?.respostas[id];
    return typeof v === 'string' && v.trim().length > 0;
  }

  /** Entrega a prova e devolve o id do resultado. */
  entregar(esgotou = false): string | null {
    const a = this.atual(); if (!a) return null;
    const fim = Math.min(Date.now(), a.prazo);
    const r: Resultado = {
      id: a.id, data: fim, duracao: fim - a.inicio,
      qids: a.qids, respostas: a.respostas, notasDiscursivas: {}, comDiscursivas: a.comDiscursivas, esgotouTempo: esgotou,
    };
    this.store.atualizar(s => {
      a.qids.forEach(id => s.vistas[id] = (s.vistas[id] ?? 0) + 1);
      s.historico.push(r); s.atual = null;
    });
    this.pararRelogio();
    return r.id;
  }

  avaliarDiscursiva(resultadoId: string, qid: string, nota: number | null): void {
    this.store.atualizar(s => {
      const r = s.historico.find(x => x.id === resultadoId); if (!r) return;
      if (nota === null) delete r.notasDiscursivas[qid]; else r.notasDiscursivas[qid] = nota;
    });
  }
}
