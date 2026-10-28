import { Directive, HostListener, Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ZoomService { readonly src = signal<string | null>(null); }

/** Amplia qualquer figura (.fig img) clicada dentro do elemento. */
@Directive({ selector: '[appZoomFiguras]' })
export class ZoomFigurasDirective {
  private zoom = inject(ZoomService);
  @HostListener('click', ['$event'])
  aoClicar(ev: MouseEvent): void {
    const el = ev.target as HTMLElement;
    if (el instanceof HTMLImageElement && el.closest('.fig')) this.zoom.src.set(el.src);
  }
}
