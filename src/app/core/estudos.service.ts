import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EstudoTema, Estudos } from './modelos';

/** Carrega public/dados/estudos.json: onde estudar cada tema das provas. */
@Injectable({ providedIn: 'root' })
export class EstudosService {
  private http = inject(HttpClient);
  readonly temas = signal<Record<string, EstudoTema>>({});
  readonly carregado = signal(false);
  readonly erro = signal<string | null>(null);

  private carregando?: Promise<void>;

  carregar(): Promise<void> {
    return this.carregando ??= this.fazerCarga();
  }

  private async fazerCarga(): Promise<void> {
    try {
      const estudos = await firstValueFrom(this.http.get<Estudos>('dados/estudos.json'));
      this.temas.set(estudos.temas);
      this.carregado.set(true);
    } catch (e) {
      this.erro.set('Não foi possível carregar o material de estudo. Verifique o arquivo public/dados/estudos.json.');
      console.error(e);
    }
  }
}
