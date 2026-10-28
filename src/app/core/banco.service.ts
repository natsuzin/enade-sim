import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProvaFonte, Questao } from './modelos';
import { alternativaParaHtml, markupParaHtml } from './markup';

interface Indice { provas: { curso: string; nome: string; anos: number[] }[]; }

/** Carrega os arquivos de public/dados e expõe o banco de questões. */
@Injectable({ providedIn: 'root' })
export class BancoService {
  private http = inject(HttpClient);
  readonly questoes = signal<Questao[]>([]);
  readonly carregado = signal(false);
  readonly erro = signal<string | null>(null);
  readonly porId = computed(() => new Map(this.questoes().map(q => [q.id, q])));
  readonly totalObjetivas = computed(() => this.questoes().filter(q => q.tipo === 'obj').length);
  readonly totalDiscursivas = computed(() => this.questoes().filter(q => q.tipo === 'disc').length);
  readonly anos = signal<number[]>([]);

  private carregando?: Promise<void>;

  carregar(curso = 'cc-bacharelado'): Promise<void> {
    return this.carregando ??= this.fazerCarga(curso);
  }

  private async fazerCarga(curso: string): Promise<void> {
    try {
      const indice = await firstValueFrom(this.http.get<Indice>('dados/indice.json'));
      const entrada = indice.provas.find(p => p.curso === curso);
      if (!entrada) throw new Error(`Curso ${curso} não está no índice.`);
      const provas = await Promise.all(entrada.anos.map(ano =>
        firstValueFrom(this.http.get<ProvaFonte>(`dados/${curso}-${ano}.json`))));
      const lista: Questao[] = [];
      for (const prova of provas) {
        for (const q of prova.questoes) {
          if (q.tipo === 'obj' && prova.anuladas.includes(q.n)) continue;
          lista.push({
            id: q.id, ano: prova.ano, n: q.n, area: q.area, tipo: q.tipo, tema: q.tema,
            enunciadoHtml: markupParaHtml(q.enunciado),
            alternativasHtml: (q.alternativas ?? []).map(alternativaParaHtml),
            resposta: q.resposta, explicacao: q.explicacao,
            padraoHtml: q.padraoResposta ? markupParaHtml(q.padraoResposta) : undefined,
          });
        }
      }
      this.anos.set(entrada.anos);
      this.questoes.set(lista);
      this.carregado.set(true);
    } catch (e) {
      this.erro.set('Não foi possível carregar as questões. Verifique a pasta public/dados.');
      console.error(e);
    }
  }
}
