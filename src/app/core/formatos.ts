export function formatarTempo(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`;
}
export function formatarDuracao(ms: number): string {
  const m = Math.round(ms / 60000), h = Math.floor(m / 60);
  return h ? `${h}h${String(m % 60).padStart(2, '0')}` : `${m} min`;
}
export function formatarData(t: number): string {
  const d = new Date(t);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
export function pct(a: number, b: number): number { return b ? Math.round(a / b * 100) : 0; }
export function num(x: number, casas = 1): string {
  return x.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
export function nomeArea(a: 'fg' | 'ce'): string { return a === 'fg' ? 'Formação geral' : 'Componente específico'; }
