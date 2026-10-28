import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArmazenamentoService } from '../../core/armazenamento.service';
import { BancoService } from '../../core/banco.service';
import { SimuladoService } from '../../core/simulado.service';
import { avaliar } from '../../core/avaliacao';
import { formatarTempo, num } from '../../core/formatos';
import { GraficoEvolucaoComponent } from '../../shared/grafico-evolucao.component';
import { ConfirmacaoComponent } from '../../shared/confirmacao.component';

@Component({
  selector: 'app-inicio',
  imports: [FormsModule, RouterLink, GraficoEvolucaoComponent, ConfirmacaoComponent],
  templateUrl: './inicio.component.html',
})
export class InicioComponent {
  private store = inject(ArmazenamentoService);
  private router = inject(Router);
  banco = inject(BancoService);
  simulado = inject(SimuladoService);

  comDiscursivas = signal(true);
  confirmarDescarte = signal(false);
  historico = computed(() => this.store.estado().historico);
  atual = computed(() => this.store.estado().atual);
  restanteAtual = computed(() => { const a = this.atual(); return a ? a.prazo - Date.now() : 0; });

  avaliacoes = computed(() => this.historico().map(r => avaliar(r, this.banco.porId())));
  melhor = computed(() => Math.max(0, ...this.avaliacoes().map(e => e.nota)));
  media = computed(() => { const a = this.avaliacoes(); return a.length ? a.reduce((s, e) => s + e.nota, 0) / a.length : 0; });

  fmtTempo = formatarTempo; num = num;

  comecar(): void {
    this.simulado.iniciar(this.comDiscursivas());
    this.router.navigate(['/prova']);
  }

  continuar(): void {
    if (this.restanteAtual() > 0) { this.router.navigate(['/prova']); return; }
    const id = this.simulado.entregar(true);
    if (id) this.router.navigate(['/resultado', id]);
  }

  descartar(): void { this.simulado.descartar(); this.confirmarDescarte.set(false); }
}
