import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArmazenamentoService } from '../core/armazenamento.service';
import { ExportacaoService } from '../core/exportacao.service';
import { AvisoService } from './aviso.service';

/** Cabeçalho fixo do app: marca, tema e backup (em menu no celular). */
@Component({
  selector: 'app-cabecalho',
  imports: [RouterLink],
  template: `
    <header class="site-head">
      <div class="wrap">
        <div class="logo"><a class="logo-t" routerLink="/" (click)="menuAberto.set(false)">Simulado <b>ENADE</b></a><span class="logo-s">Ciência da Computação, bacharelado</span></div>
        <button class="btn icon menu-toggle" [attr.aria-expanded]="menuAberto()" aria-controls="acoes-cab"
                aria-label="Menu" (click)="menuAberto.set(!menuAberto())">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path [attr.d]="menuAberto() ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
        </button>
        <nav id="acoes-cab" class="head-actions" [class.open]="menuAberto()">
          <button class="btn ghost" [disabled]="!temHistorico()" [attr.title]="temHistorico() ? null : 'Entregue um simulado para ter o que exportar'" (click)="exportar()">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            Exportar backup
          </button>
          <button class="btn ghost" (click)="arquivo.click()">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4l4 4M5 19h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
            Importar backup
          </button>
          <input #arquivo type="file" accept="application/json,.json" class="hidden" (change)="importar($event)">
          <button class="btn ghost" (click)="alternarTema()">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/></svg>
            Alternar tema
          </button>
        </nav>
      </div>
    </header>
    @if (menuAberto()) { <div class="head-scrim" (click)="menuAberto.set(false)"></div> }`,
})
export class CabecalhoComponent {
  private store = inject(ArmazenamentoService);
  private exp = inject(ExportacaoService);
  private aviso = inject(AvisoService);

  menuAberto = signal(false);
  temHistorico = computed(() => this.store.estado().historico.length > 0);

  @HostListener('document:keydown.escape') fechar(): void { this.menuAberto.set(false); }

  alternarTema(): void {
    const raiz = document.documentElement;
    const escuroAgora = raiz.dataset['theme'] ? raiz.dataset['theme'] === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    raiz.dataset['theme'] = escuroAgora ? 'light' : 'dark';
    this.store.atualizar(s => { s.tema = escuroAgora ? 'claro' : 'escuro'; });
    this.menuAberto.set(false);
  }

  exportar(): void {
    const s = this.store.estado();
    const data = new Date().toISOString().slice(0, 10);
    this.exp.baixar(`simulado-enade-backup-${data}.json`, JSON.stringify({ app: 'enade-cc-simulador', historico: s.historico, vistas: s.vistas }, null, 1), 'application/json');
    this.menuAberto.set(false);
  }

  async importar(ev: Event): Promise<void> {
    const campo = ev.target as HTMLInputElement;
    const arq = campo.files?.[0]; if (!arq) return;
    try {
      const d = JSON.parse(await arq.text());
      if (!Array.isArray(d.historico)) throw new Error('formato');
      let n = 0, repetidos = 0;
      this.store.atualizar(s => {
        const ids = new Set(s.historico.map(x => x.id));
        for (const r of d.historico) {
          if (!r?.id || !Array.isArray(r.qids)) continue;
          if (ids.has(r.id)) { repetidos++; continue; }
          s.historico.push(r); ids.add(r.id); n++;
        }
        s.historico.sort((a, b) => a.data - b.data);
        for (const [k, v] of Object.entries<number>(d.vistas ?? {})) s.vistas[k] = Math.max(s.vistas[k] ?? 0, v);
      });
      const jaSalvos = repetidos ? `${repetidos} já estava(m) salvo(s) neste navegador` : '';
      this.aviso.mostrar(
        n ? `${n} simulado(s) importado(s)${jaSalvos ? '; ' + jaSalvos : ''}.`
          : repetidos ? `Os ${repetidos} simulado(s) desse backup já estão neste navegador.`
          : 'Esse backup não tem simulados.', 4500);
    } catch { this.aviso.mostrar('Esse arquivo não é um backup deste simulador.'); }
    campo.value = '';
    this.menuAberto.set(false);
  }
}
