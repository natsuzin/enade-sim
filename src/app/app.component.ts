import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { rolarParaTopo } from './shared/rolagem';
import { AvisoService } from './shared/aviso.service';
import { ZoomService } from './shared/zoom';
import { CabecalhoComponent } from './shared/cabecalho.component';
import { BarraLateralComponent } from './shared/barra-lateral.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CabecalhoComponent, BarraLateralComponent],
  template: `
    @if (!foco()) { <app-cabecalho /> }
    <div class="layout" [class.foco]="foco()">
      @if (!foco()) { <app-barra-lateral /> }
      <div class="conteudo"><router-outlet /></div>
    </div>
    @if (zoom.src(); as src) {
      <div class="zoom" (click)="zoom.src.set(null)"><img [src]="src" alt="Figura ampliada"></div>
    }
    @if (aviso.mensagem(); as msg) { <div class="toast" role="status">{{ msg }}</div> }
  `,
})
export class AppComponent {
  aviso = inject(AvisoService);
  zoom = inject(ZoomService);
  private router = inject(Router);
  private url = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => { rolarParaTopo(); return this.router.url; })),
    { initialValue: this.router.url });
  /** Durante a prova o app esconde cabeçalho e barra lateral (modo foco). */
  foco = computed(() => this.url().split('?')[0] === '/prova');

  constructor() {
    // Garantia extra no celular: se o navegador deslocar a janela (ex.: ao fechar o teclado), volta ao topo.
    const corrigir = () => { if (window.scrollX || window.scrollY) window.scrollTo(0, 0); };
    window.addEventListener('scroll', corrigir, { passive: true });
    window.visualViewport?.addEventListener('resize', corrigir);
  }
}
