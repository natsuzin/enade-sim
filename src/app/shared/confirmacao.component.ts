import { Component, input, output } from '@angular/core';

/** Diálogo modal simples de confirmação. */
@Component({
  selector: 'app-confirmacao',
  template: `
    <div class="scrim" (click)="cancelar.emit()" (keydown.escape)="cancelar.emit()">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt" (click)="$event.stopPropagation()">
        <h2 id="mt">{{ titulo() }}</h2>
        <p>{{ mensagem() }}</p>
        <div class="row">
          <button class="btn" (click)="cancelar.emit()">{{ textoCancelar() }}</button>
          <button class="btn primary" (click)="confirmar.emit()" #ok>{{ textoConfirmar() }}</button>
        </div>
      </div>
    </div>`,
})
export class ConfirmacaoComponent {
  titulo = input.required<string>();
  mensagem = input<string>('');
  textoConfirmar = input<string>('Confirmar');
  textoCancelar = input<string>('Cancelar');
  confirmar = output<void>();
  cancelar = output<void>();
}
