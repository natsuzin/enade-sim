import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AvisoService } from './shared/aviso.service';
import { ZoomService } from './shared/zoom';
import { CabecalhoComponent } from './shared/cabecalho.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CabecalhoComponent],
  template: `
    <app-cabecalho />
    <router-outlet />
    @if (zoom.src(); as src) {
      <div class="zoom" (click)="zoom.src.set(null)"><img [src]="src" alt="Figura ampliada"></div>
    }
    @if (aviso.mensagem(); as msg) { <div class="toast" role="status">{{ msg }}</div> }
  `,
})
export class AppComponent {
  aviso = inject(AvisoService);
  zoom = inject(ZoomService);
}
