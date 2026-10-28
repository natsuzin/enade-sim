import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

interface Item { rota: string; rotulo: string; icone: string; ativo: (url: string) => boolean; }

/** Navegação entre os modos de estudo (lateral no computador, faixa de abas no celular). */
@Component({
  selector: 'app-barra-lateral',
  imports: [RouterLink],
  template: `
    <nav class="side" aria-label="Modos de estudo">
      @for (it of itens; track it.rota) {
        <a class="side-link" [routerLink]="it.rota" [class.ativo]="it.ativo(url())" [attr.aria-current]="it.ativo(url()) ? 'page' : null">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path [attr.d]="it.icone" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
          <span>{{ it.rotulo }}</span>
        </a>
      }
    </nav>`,
})
export class BarraLateralComponent {
  private router = inject(Router);
  url = toSignal(this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => this.router.url)), { initialValue: this.router.url });

  itens: Item[] = [
    { rota: '/', rotulo: 'Simulado', icone: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      ativo: u => u === '/' || u.split('?')[0] === '/prova' || u.startsWith('/resultado') },
    { rota: '/treino', rotulo: 'Treino', icone: 'M4 5h11a3 3 0 013 3v11H7a3 3 0 01-3-3V5zM8 9h6M8 13h4',
      ativo: u => u.startsWith('/treino') },
    { rota: '/provas', rotulo: 'Provas', icone: 'M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 3v5h5M9 13h6M9 17h6',
      ativo: u => u.startsWith('/provas') },
    { rota: '/estudos', rotulo: 'Estudos', icone: 'M3 5h6a3 3 0 013 3v12a2 2 0 00-2-2H3zM21 5h-6a3 3 0 00-3 3v12a2 2 0 012-2h7z',
      ativo: u => u.startsWith('/estudos') },
    { rota: '/historico', rotulo: 'Histórico', icone: 'M4 19V9m6 10V5m6 14v-7m4 7H3',
      ativo: u => u.startsWith('/historico') },
  ];
}
