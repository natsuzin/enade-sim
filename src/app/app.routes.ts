import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ArmazenamentoService } from './core/armazenamento.service';

/** Só entra na prova se houver simulado em andamento. */
const temSimulado = () => !!inject(ArmazenamentoService).estado().atual || inject(Router).parseUrl('/');

export const routes: Routes = [
  { path: '', title: 'Simulado ENADE', loadComponent: () => import('./paginas/inicio/inicio.component').then(m => m.InicioComponent) },
  { path: 'historico', title: 'Histórico', loadComponent: () => import('./paginas/historico/historico.component').then(m => m.HistoricoComponent) },
  { path: 'prova', title: 'Prova em andamento', canActivate: [temSimulado], loadComponent: () => import('./paginas/prova/prova.component').then(m => m.ProvaComponent) },
  { path: 'resultado/:id', title: 'Resultado do simulado', loadComponent: () => import('./paginas/resultado/resultado.component').then(m => m.ResultadoComponent) },
  { path: '**', redirectTo: '' },
];
