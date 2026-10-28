import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { BancoService } from './core/banco.service';
import { ArmazenamentoService } from './core/armazenamento.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Hash location: funciona em qualquer hospedagem estática (GitHub Pages, Netlify) sem configurar rewrites.
    provideRouter(routes, withComponentInputBinding(), withHashLocation()),
    provideHttpClient(),
    provideAppInitializer(() => {
      const tema = inject(ArmazenamentoService).estado().tema;
      if (tema) document.documentElement.dataset['theme'] = tema === 'escuro' ? 'dark' : 'light';
      return inject(BancoService).carregar();
    }),
  ],
};
