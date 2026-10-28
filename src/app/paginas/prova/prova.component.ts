import { Component, HostListener, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BancoService } from '../../core/banco.service';
import { DURACAO_PROVA, SimuladoService } from '../../core/simulado.service';
import { rotulos } from '../../core/avaliacao';
import { formatarTempo } from '../../core/formatos';
import { LETRAS, Letra, Questao } from '../../core/modelos';
import { AvisoService } from '../../shared/aviso.service';
import { ConfirmacaoComponent } from '../../shared/confirmacao.component';
import { ZoomFigurasDirective } from '../../shared/zoom';
import { rolarParaTopo } from '../../shared/rolagem';

@Component({
  selector: 'app-prova',
  imports: [ConfirmacaoComponent, ZoomFigurasDirective],
  templateUrl: './prova.component.html',
})
export class ProvaComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private aviso = inject(AvisoService);
  banco = inject(BancoService);
  sim = inject(SimuladoService);

  readonly LETRAS = LETRAS;
  cartaoAberto = signal(false);
  confirmarEntrega = signal(false);
  atual = this.sim.atual;
  rot = computed(() => rotulos(this.atual()?.qids ?? [], this.banco.porId()));
  questao = computed<Questao | undefined>(() => { const a = this.atual(); return a ? this.banco.porId().get(a.qids[a.indice]) : undefined; });
  respostaAtual = computed(() => { const a = this.atual(), q = this.questao(); return a && q ? a.respostas[q.id] ?? '' : ''; });
  respondidas = computed(() => (this.atual()?.qids ?? []).filter(id => this.sim.respondida(id)).length);
  emBranco = computed(() => (this.atual()?.qids.length ?? 0) - this.respondidas());
  marcadas = computed(() => Object.values(this.atual()?.marcadas ?? {}).filter(Boolean).length);
  nivelTempo = computed(() => { const r = this.sim.restante(); return r < 5 * 60000 ? 'crit' : r < 30 * 60000 ? 'warn' : ''; });
  larguraTrilho = computed(() => Math.max(0, this.sim.restante()) / DURACAO_PROVA * 100);
  tempo = computed(() => formatarTempo(this.sim.restante()));
  palavras = computed(() => { const t = this.respostaAtual().trim(); return t ? t.split(/\s+/).length : 0; });

  /** Índices das questões por área, para o cartão-resposta. */
  grupos = computed(() => {
    const a = this.atual(); if (!a) return [];
    const porId = this.banco.porId();
    return (['fg', 'ce'] as const).map(area => ({
      titulo: area === 'fg' ? 'Formação geral' : 'Componente específico',
      itens: a.qids.map((id, i) => ({ id, i, q: porId.get(id)! })).filter(x => x.q.area === area),
    }));
  });

  private avisados = new Set<string>();
  private debounce?: ReturnType<typeof setTimeout>;
  private pendente?: () => void;

  constructor() {
    effect(() => {
      const r = this.sim.restante();
      if (!this.atual()) return;
      if (r <= 0) { this.aviso.mostrar('Tempo esgotado. A prova foi entregue.', 4500); this.entregar(true); return; }
      for (const [min, msg] of [[30, 'Faltam 30 minutos.'], [5, 'Faltam 5 minutos.']] as const) {
        if (r < min * 60000 && r > (min - 1) * 60000 && !this.avisados.has(msg)) { this.avisados.add(msg); this.aviso.mostrar(msg); }
      }
    });
  }

  ngOnInit(): void {
    if (!this.atual()) { this.router.navigate(['/']); return; }
    this.sim.iniciarRelogio();
  }
  ngOnDestroy(): void { this.sim.pararRelogio(); this.salvarPendente(); }
  private salvarPendente(): void { clearTimeout(this.debounce); this.pendente?.(); }

  escolher(l: Letra): void {
    const q = this.questao(); if (!q) return;
    this.sim.responder(q.id, this.respostaAtual() === l ? '' : l);
  }
  digitar(texto: string): void {
    const q = this.questao(); if (!q) return;
    clearTimeout(this.debounce);
    this.pendente = () => { this.sim.responder(q.id, texto); this.pendente = undefined; };
    this.debounce = setTimeout(() => this.pendente?.(), 400);
  }
  irPara(i: number): void { this.salvarPendente(); this.sim.irPara(i); this.cartaoAberto.set(false); rolarParaTopo(); }
  mover(d: number): void { const a = this.atual(); if (a) this.irPara(a.indice + d); }
  sair(): void { this.salvarPendente(); this.router.navigate(['/']); }
  marcar(): void { const q = this.questao(); if (q) this.sim.alternarMarcada(q.id); }

  entregar(esgotou = false): void {
    this.salvarPendente();
    const id = this.sim.entregar(esgotou);
    this.confirmarEntrega.set(false);
    if (id) this.router.navigate(['/resultado', id]);
  }

  @HostListener('document:keydown', ['$event'])
  atalho(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.cartaoAberto()) { this.cartaoAberto.set(false); return; }
    const alvo = e.target as HTMLElement;
    if (alvo.closest('textarea,input') || e.ctrlKey || e.metaKey || e.altKey || this.confirmarEntrega()) return;
    const k = e.key.toUpperCase() as Letra;
    if (LETRAS.includes(k) && this.questao()?.tipo === 'obj') { e.preventDefault(); this.escolher(k); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); this.mover(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this.mover(-1); }
  }
}
