import { Injectable, signal } from '@angular/core';
import { Armazenamento } from './modelos';

const CHAVE = 'enade-cc-simulador:v1';
const VAZIO: Armazenamento = { versao: 1, historico: [], atual: null, vistas: {} };

/** Persistência em localStorage. Todo o estado do usuário passa por aqui. */
@Injectable({ providedIn: 'root' })
export class ArmazenamentoService {
  readonly estado = signal<Armazenamento>(this.ler());

  private ler(): Armazenamento {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) return { ...VAZIO, ...JSON.parse(bruto) };
    } catch { /* armazenamento indisponível */ }
    return structuredClone(VAZIO);
  }

  /** Aplica uma alteração e salva. */
  atualizar(fn: (s: Armazenamento) => void): void {
    const novo = structuredClone(this.estado());
    fn(novo);
    this.estado.set(novo);
    try { localStorage.setItem(CHAVE, JSON.stringify(novo)); } catch { /* cota cheia ou modo privado */ }
  }
}
