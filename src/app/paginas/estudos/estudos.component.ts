import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ArmazenamentoService } from '../../core/armazenamento.service';
import { BancoService } from '../../core/banco.service';
import { EstudosService } from '../../core/estudos.service';
import { classeBarra, desempenhoPorTema } from '../../core/avaliacao';
import { pct } from '../../core/formatos';
import { DesempenhoTema, Recurso } from '../../core/modelos';

/** Normaliza para busca: sem acentos e sem diferença de maiúsculas. */
const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Onde estudar cada tema: vídeo-aulas e o livro de referência citado pela banca. */
@Component({
  selector: 'app-estudos',
  templateUrl: './estudos.component.html',
})
export class EstudosComponent {
  /** Vem de /estudos?tema=... (withComponentInputBinding): abre a página já no card do tema. */
  tema = input<string>();
  private store = inject(ArmazenamentoService);
  private banco = inject(BancoService);
  estudos = inject(EstudosService);

  classeBarra = classeBarra; pct = pct;
  busca = signal('');
  destacado = signal<string | null>(null);

  private desempenho = computed(() =>
    new Map(desempenhoPorTema(this.store.estado().historico, this.banco.porId()).map(d => [d.tema, d])));
  temHistorico = computed(() => this.desempenho().size > 0);

  /** Com histórico: do pior para o melhor aproveitamento, e os temas sem dados no fim. Sem histórico: alfabética. */
  cards = computed(() => {
    const d = this.desempenho();
    const lista = Object.entries(this.estudos.temas()).map(([tema, e]) => ({ tema, ...e, d: d.get(tema) as DesempenhoTema | undefined }));
    const alfabetica = (a: { tema: string }, b: { tema: string }) => a.tema.localeCompare(b.tema, 'pt-BR');
    return lista.sort((a, b) => {
      if (a.d && b.d) return a.d.taxa - b.d.taxa || alfabetica(a, b);
      if (a.d || b.d) return a.d ? -1 : 1;
      return alfabetica(a, b);
    });
  });

  visiveis = computed(() => {
    const termo = normalizar(this.busca().trim());
    return this.cards().filter(c => !termo || normalizar(c.tema).includes(termo) || normalizar(c.resumo).includes(termo));
  });

  constructor() {
    this.estudos.carregar();
    // Ao chegar com ?tema=..., limpa a busca e rola até o card quando o material terminar de carregar.
    effect(() => {
      const alvo = this.tema();
      if (!alvo || !this.estudos.carregado()) return;
      this.busca.set('');
      this.destacado.set(alvo);
      setTimeout(() => document.getElementById(this.idCard(alvo))?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    });
  }

  idCard(tema: string): string { return 'estudo-' + tema; }

  descricao(r: Recurso): string {
    if (r.tipo === 'livro') return [r.fonte, r.capitulos ? `capítulos ${r.capitulos}` : ''].filter(Boolean).join(' · ');
    return r.fonte ?? '';
  }
}
