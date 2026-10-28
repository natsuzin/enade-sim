import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ArmazenamentoService } from '../../core/armazenamento.service';
import { BancoService } from '../../core/banco.service';
import { SimuladoService } from '../../core/simulado.service';
import { ExportacaoService } from '../../core/exportacao.service';
import { avaliar, classeBarra, desempenhoPorTema, rotulos } from '../../core/avaliacao';
import { formatarData, formatarDuracao, nomeArea, num, pct } from '../../core/formatos';
import { LETRAS, Letra, Questao } from '../../core/modelos';
import { ZoomFigurasDirective } from '../../shared/zoom';

type Aba = 'erradas' | 'disc' | 'todas';

@Component({
  selector: 'app-resultado',
  imports: [RouterLink, ZoomFigurasDirective],
  templateUrl: './resultado.component.html',
})
export class ResultadoComponent {
  /** Vem da rota /resultado/:id (withComponentInputBinding). */
  id = input.required<string>();
  private store = inject(ArmazenamentoService);
  private router = inject(Router);
  private sim = inject(SimuladoService);
  private exp = inject(ExportacaoService);
  banco = inject(BancoService);

  readonly LETRAS = LETRAS;
  readonly NOTAS = [0, 2.5, 5, 7.5, 10];
  aba = signal<Aba>('erradas');

  resultado = computed(() => this.store.estado().historico.find(r => r.id === this.id()));
  av = computed(() => { const r = this.resultado(); return r ? avaliar(r, this.banco.porId()) : null; });
  rot = computed(() => rotulos(this.resultado()?.qids ?? [], this.banco.porId()));
  temas = computed(() => { const r = this.resultado(); return r ? desempenhoPorTema([r], this.banco.porId()).sort((a, b) => a.taxa - b.taxa) : []; });

  itens = computed(() => {
    const r = this.resultado(); if (!r) return [];
    return r.qids.map((id, i) => {
      const q = this.banco.porId().get(id)!;
      const resp = r.respostas[id] ?? '';
      const status = q.tipo === 'disc' ? 'disc' : !resp ? 'blank' : resp === q.resposta ? 'ok' : 'bad';
      return { id, i, q, resp, status };
    });
  });
  erradas = computed(() => this.itens().filter(x => x.status === 'bad' || x.status === 'blank'));
  filtrados = computed(() => {
    const a = this.aba();
    return a === 'todas' ? this.itens() : a === 'disc' ? this.itens().filter(x => x.status === 'disc') : this.erradas();
  });

  fmtData = formatarData; fmtDur = formatarDuracao; num = num; pct = pct; nomeArea = nomeArea; classeBarra = classeBarra;

  alternativa(q: Questao, l: string): string { return q.alternativasHtml[LETRAS.indexOf(l as Letra)] ?? ''; }

  notaDiscursiva(qid: string): number | undefined { return this.resultado()?.notasDiscursivas[qid]; }
  avaliar(qid: string, n: number): void {
    this.sim.avaliarDiscursiva(this.id(), qid, this.notaDiscursiva(qid) === n ? null : n);
  }

  irPara(i: number): void {
    if (!this.filtrados().some(x => x.i === i)) this.aba.set('todas');
    setTimeout(() => document.getElementById('q-' + i)?.scrollIntoView({ behavior: 'smooth' }));
  }

  async baixarHtml(): Promise<void> {
    const r = this.resultado(); if (!r) return;
    this.exp.baixar(this.exp.nomeArquivo(r, 'html'), await this.exp.html(r), 'text/html');
  }
  baixarCsv(): void {
    const r = this.resultado(); if (!r) return;
    this.exp.baixar(this.exp.nomeArquivo(r, 'csv'), this.exp.csv(r), 'text/csv');
  }
  inicio(): void { this.router.navigate(['/']); }
}
