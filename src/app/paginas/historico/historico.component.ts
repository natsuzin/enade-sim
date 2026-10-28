import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ArmazenamentoService } from '../../core/armazenamento.service';
import { BancoService } from '../../core/banco.service';
import { avaliar, classeBarra, desempenhoPorTema } from '../../core/avaliacao';
import { formatarData, formatarDuracao, num, pct } from '../../core/formatos';
import { Resultado } from '../../core/modelos';

@Component({
  selector: 'app-historico',
  imports: [RouterLink],
  templateUrl: './historico.component.html',
})
export class HistoricoComponent {
  private store = inject(ArmazenamentoService);
  private router = inject(Router);
  private banco = inject(BancoService);

  historico = computed(() => this.store.estado().historico);
  avaliacoes = computed(() => this.historico().map(r => avaliar(r, this.banco.porId())));
  temas = computed(() => desempenhoPorTema(this.historico(), this.banco.porId())
    .sort((a, b) => a.taxa - b.taxa || b.total - a.total));
  listaInvertida = computed(() => this.historico().map((r, i) => ({ r, e: this.avaliacoes()[i] })).reverse());

  fmtData = formatarData; fmtDur = formatarDuracao; num = num; pct = pct; classeBarra = classeBarra;

  abrir(r: Resultado): void { this.router.navigate(['/resultado', r.id]); }
}
