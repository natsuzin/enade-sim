import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ArmazenamentoService } from './core/armazenamento.service';

/** Só entra na prova se houver simulado em andamento. */
const temSimulado = () => !!inject(ArmazenamentoService).estado().atual || inject(Router).parseUrl('/');

export const routes: Routes = [
  { path: '', loadComponent: () => import('./paginas/inicio/inicio.component').then(m => m.InicioComponent) },
  { path: 'treino', loadComponent: () => import('./paginas/treino/treino.component').then(m => m.TreinoComponent) },
  { path: 'provas', loadComponent: () => import('./paginas/provas/provas.component').then(m => m.ProvasComponent) },
  { path: 'provas/:ano', loadComponent: () => import('./paginas/provas/provas.component').then(m => m.ProvasComponent) },
  { path: 'historico', loadComponent: () => import('./paginas/historico/historico.component').then(m => m.HistoricoComponent) },
  { path: 'prova', canActivate: [temSimulado], loadComponent: () => import('./paginas/prova/prova.component').then(m => m.ProvaComponent) },
  { path: 'resultado/:id', loadComponent: () => import('./paginas/resultado/resultado.component').then(m => m.ResultadoComponent) },
  { path: '**', redirectTo: '' },
];
