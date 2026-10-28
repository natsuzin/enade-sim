import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { BancoService } from '../../core/banco.service';
import { ModoTreino, TreinoService } from '../../core/treino.service';
import { nomeArea, pct } from '../../core/formatos';
import { classeBarra } from '../../core/avaliacao';
import { LETRAS, Letra, Questao } from '../../core/modelos';
import { ConfirmacaoComponent } from '../../shared/confirmacao.component';
import { ZoomFigurasDirective } from '../../shared/zoom';
import { rolarParaTopo } from '../../shared/rolagem';

@Component({
  selector: 'app-treino',
  imports: [FormsModule, NgTemplateOutlet, ConfirmacaoComponent, ZoomFigurasDirective],
  templateUrl: './treino.component.html',
})
export class TreinoComponent implements OnDestroy {
  banco = inject(BancoService);
  treino = inject(TreinoService);

  readonly LETRAS = LETRAS;
  nomeArea = nomeArea; pct = pct; classeBarra = classeBarra;

  // Configuração de um novo treino
  modo = signal<ModoTreino>('tema');
  temas = signal<string[]>([]);
  ano = signal('');
  comDiscursivas = signal(false);
  aleatorio = signal(true);
  filtros = computed(() => this.modo() === 'tema' ? this.temas() : this.ano() ? [this.ano()] : []);
  disponiveis = computed(() => this.treino.filtrar(this.modo(), this.filtros(), this.comDiscursivas()).length);

  // Treino em andamento
  atual = this.treino.atual;
  cartaoAberto = signal(false);
  confirmarEncerrar = signal(false);
  questao = computed<Questao | undefined>(() => { const t = this.atual(); return t ? this.banco.porId().get(t.qids[t.indice]) : undefined; });
  respostaAtual = computed(() => { const t = this.atual(), q = this.questao(); return t && q ? t.respostas[q.id] ?? '' : ''; });
  conferida = computed(() => { const t = this.atual(), q = this.questao(); return !!(t && q && t.conferidas[q.id]); });
  titulo = computed(() => {
    const t = this.atual(); if (!t) return '';
    if (t.modo === 'ano') return `Prova de ${t.filtros[0]}`;
    return t.filtros.length === 1 ? t.filtros[0] : `${t.filtros.length} temas`;
  });

  /** Situação de cada questão para o cartão lateral. */
  itens = computed(() => {
    const t = this.atual(); if (!t) return [];
    const porId = this.banco.porId();
    return t.qids.map((id, i) => {
      const q = porId.get(id)!;
      const resp = t.respostas[id] ?? '';
      const status = !t.conferidas[id] ? '' : q.tipo === 'disc' ? 'done' : resp === q.resposta ? 'ok' : 'bad';
      return { id, i, q, status };
    });
  });
  objetivas = computed(() => this.itens().filter(x => x.q.tipo === 'obj'));
  acertos = computed(() => this.itens().filter(x => x.status === 'ok').length);
  conferidas = computed(() => this.itens().filter(x => x.status).length);
  respondidasObj = computed(() => this.objetivas().filter(x => x.status).length);
  terminou = computed(() => this.itens().length > 0 && this.conferidas() === this.itens().length);

  private debounce?: ReturnType<typeof setTimeout>;
  private pendente?: () => void;

  ngOnDestroy(): void { this.salvarPendente(); }
  private salvarPendente(): void { clearTimeout(this.debounce); this.pendente?.(); }

  alternarTema(tema: string): void {
    this.temas.update(l => l.includes(tema) ? l.filter(x => x !== tema) : [...l, tema]);
  }
  todosTemas(marcar: boolean): void { this.temas.set(marcar ? this.treino.temas().map(t => t.tema) : []); }

  /** Quantos temas do grupo estão marcados: todos, alguns ou nenhum. */
  marcadosNoGrupo(temas: { tema: string }[]): number { return temas.filter(t => this.temas().includes(t.tema)).length; }
  alternarGrupo(temas: { tema: string }[]): void {
    const nomes = temas.map(t => t.tema);
    const todos = this.marcadosNoGrupo(temas) === temas.length;
    this.temas.update(l => todos ? l.filter(x => !nomes.includes(x)) : [...new Set([...l, ...nomes])]);
  }

  /** Formação geral fica numa faixa própria; os grupos do componente específico vão para a grade. */
  grupoFG = computed(() => this.treino.grupos().find(g => g.grupo === 'Formação geral'));
  gruposCE = computed(() => this.treino.grupos().filter(g => g.grupo !== 'Formação geral'));

  /** Temas com menos de 50% de acerto nos simulados entregues. */
  fracos = computed(() => [...this.treino.desempenho().values()].filter(d => d.taxa < 0.5).map(d => d.tema));
  marcarFracos(): void { this.temas.set(this.fracos()); }

  comecar(): void {
    if (!this.disponiveis()) return;
    this.treino.iniciar(this.modo(), this.filtros(), this.comDiscursivas(), this.aleatorio());
    rolarParaTopo();
  }

  encerrar(): void { this.salvarPendente(); this.treino.encerrar(); this.confirmarEncerrar.set(false); }

  escolher(l: Letra): void {
    const q = this.questao(); if (!q || this.conferida()) return;
    this.treino.responder(q.id, l);
  }
  digitar(texto: string): void {
    const q = this.questao(); if (!q) return;
    clearTimeout(this.debounce);
    this.pendente = () => { this.treino.responder(q.id, texto); this.pendente = undefined; };
    this.debounce = setTimeout(() => this.pendente?.(), 400);
  }
  verPadrao(): void { const q = this.questao(); if (!q) return; this.salvarPendente(); this.treino.conferir(q.id); }

  irPara(i: number): void { this.salvarPendente(); this.treino.irPara(i); this.cartaoAberto.set(false); rolarParaTopo(); }
  mover(d: number): void { const t = this.atual(); if (t) this.irPara(t.indice + d); }

  /** Classe da alternativa depois da correção. */
  classeOpcao(l: Letra): string {
    const q = this.questao();
    if (!this.conferida() || !q) return this.respostaAtual() === l ? 'sel' : '';
    if (l === q.resposta) return 'ok';
    return this.respostaAtual() === l ? 'bad' : 'off';
  }

  @HostListener('document:keydown', ['$event'])
  atalho(e: KeyboardEvent): void {
    if (!this.atual()) return;
    if (e.key === 'Escape' && this.cartaoAberto()) { this.cartaoAberto.set(false); return; }
    const alvo = e.target as HTMLElement;
    if (alvo.closest('textarea,input,select') || e.ctrlKey || e.metaKey || e.altKey || this.confirmarEncerrar()) return;
    const k = e.key.toUpperCase() as Letra;
    if (LETRAS.includes(k) && this.questao()?.tipo === 'obj') { e.preventDefault(); this.escolher(k); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); this.mover(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this.mover(-1); }
  }
}
