import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BancoService } from '../../core/banco.service';
import { nomeArea } from '../../core/formatos';
import { LETRAS, Questao } from '../../core/modelos';
import { ZoomFigurasDirective } from '../../shared/zoom';

/** Ordem da prova real: discursivas de FG, objetivas de FG, discursivas de CE, objetivas de CE. */
function ordemProva(a: Questao, b: Questao): number {
  const peso = (q: Questao) => (q.area === 'fg' ? 0 : 2) + (q.tipo === 'disc' ? 0 : 1);
  return peso(a) - peso(b) || a.n - b.n;
}

/** Consulta das provas completas, com o gabarito assinalado. */
@Component({
  selector: 'app-provas',
  imports: [RouterLink, ZoomFigurasDirective],
  templateUrl: './provas.component.html',
})
export class ProvasComponent {
  /** Vem da rota /provas/:ano; vazio na lista de provas. */
  ano = input<string>();
  banco = inject(BancoService);

  readonly LETRAS = LETRAS;
  nomeArea = nomeArea;
  gabarito = signal(true);

  /** Provas disponíveis, da mais recente para a mais antiga. */
  provas = computed(() => [...this.banco.anos()].sort((a, b) => b - a).map(ano => {
    const qs = this.banco.questoes().filter(q => q.ano === ano);
    return { ano, objetivas: qs.filter(q => q.tipo === 'obj').length, discursivas: qs.filter(q => q.tipo === 'disc').length };
  }));

  questoes = computed(() => {
    const ano = Number(this.ano());
    return this.banco.questoes().filter(q => q.ano === ano).sort(ordemProva);
  });

  /** Blocos da prova, para o índice e os títulos de seção. */
  secoes = computed(() => (['fg', 'ce'] as const)
    .map(area => ({ area, titulo: nomeArea(area), itens: this.questoes().filter(q => q.area === area) }))
    .filter(s => s.itens.length));

  rotulo(q: Questao): string { return q.tipo === 'disc' ? `D${q.n}` : String(q.n); }

  irPara(q: Questao): void { document.getElementById('q-' + q.id)?.scrollIntoView({ behavior: 'smooth' }); }
}
