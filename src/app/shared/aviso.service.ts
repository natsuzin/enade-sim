import { Injectable, signal } from '@angular/core';

/** Mensagens curtas no rodapé da tela (toast). */
@Injectable({ providedIn: 'root' })
export class AvisoService {
  readonly mensagem = signal<string | null>(null);
  private t?: ReturnType<typeof setTimeout>;
  mostrar(msg: string, ms = 3200): void {
    clearTimeout(this.t); this.mensagem.set(msg);
    this.t = setTimeout(() => this.mensagem.set(null), ms);
  }
}
