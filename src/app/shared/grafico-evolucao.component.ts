import { Component, computed, input } from '@angular/core';
import { Avaliacao } from '../core/modelos';
import { num, pct } from '../core/formatos';

/** Gráfico em SVG da nota estimada e do % de acerto por simulado. */
@Component({
  selector: 'app-grafico-evolucao',
  template: `
    @if (avaliacoes().length < 2) {
      <p class="muted" style="font-size:14px;margin:4px 0">Faça mais um simulado para ver o gráfico de evolução.</p>
    } @else {
      <svg class="chart" [attr.viewBox]="'0 0 ' + W + ' ' + H" role="img" aria-label="Gráfico da nota estimada por simulado">
        @for (v of [0,25,50,75,100]; track v) {
          <line [attr.x1]="P.l" [attr.x2]="W-P.r" [attr.y1]="y(v)" [attr.y2]="y(v)" stroke="var(--line)" />
          <text [attr.x]="P.l-6" [attr.y]="y(v)+4" text-anchor="end" font-size="11" fill="var(--muted)">{{ v }}</text>
        }
        <polyline fill="none" stroke="var(--line)" stroke-width="2.5" stroke-linejoin="round" [attr.points]="linhaAcertos()" />
        <polyline fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" [attr.points]="linhaNota()" />
        @for (e of avaliacoes(); track $index) {
          <circle [attr.cx]="x($index)" [attr.cy]="y(e.nota)" r="4" fill="var(--accent)">
            <title>Simulado {{ $index + 1 }}: nota {{ num(e.nota) }}, {{ pct(e.acertos, e.totalObjetivas) }}% nas objetivas</title>
          </circle>
          <text [attr.x]="x($index)" [attr.y]="H-8" text-anchor="middle" font-size="11" fill="var(--muted)">{{ $index + 1 }}</text>
        }
      </svg>
      <div class="legend" style="margin:0 0 6px">
        <span><i style="background:var(--accent);border-color:var(--accent)"></i>Nota estimada</span>
        <span><i style="background:var(--line)"></i>% de acerto nas objetivas</span>
      </div>
    }`,
})
export class GraficoEvolucaoComponent {
  avaliacoes = input.required<Avaliacao[]>();
  readonly W = 460; readonly H = 170; readonly P = { l: 32, r: 12, t: 14, b: 26 };
  num = num; pct = pct;
  x(i: number): number { const n = this.avaliacoes().length; return this.P.l + i * (this.W - this.P.l - this.P.r) / Math.max(1, n - 1); }
  y(v: number): number { return this.P.t + (100 - v) * (this.H - this.P.t - this.P.b) / 100; }
  linhaNota = computed(() => this.avaliacoes().map((e, i) => `${this.x(i)},${this.y(e.nota)}`).join(' '));
  linhaAcertos = computed(() => this.avaliacoes().map((e, i) => `${this.x(i)},${this.y(pct(e.acertos, e.totalObjetivas))}`).join(' '));
}
