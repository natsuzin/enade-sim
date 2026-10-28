import { Avaliacao, DesempenhoTema, Questao, Resultado } from './modelos';

/** Rótulos no estilo da prova: D1, D2, 1..8, D3..D5, 9..35. */
export function rotulos(qids: string[], porId: Map<string, Questao>): string[] {
  let d = 0, o = 0;
  return qids.map(id => porId.get(id)?.tipo === 'disc' ? `D${++d}` : String(++o));
}

/**
 * Nota estimada com os pesos do ENADE:
 * FG = 60% objetivas + 40% discursivas; CE = 85% objetivas + 15% discursivas;
 * nota final = 25% FG + 75% CE (escala 0–100).
 * Discursivas sem autoavaliação contam como zero.
 */
export function avaliar(r: Resultado, porId: Map<string, Questao>): Avaliacao {
  let fgA = 0, fgT = 0, ceA = 0, ceT = 0, branco = 0;
  const fgD: (number | null)[] = [], ceD: (number | null)[] = [];
  for (const id of r.qids) {
    const q = porId.get(id); if (!q) continue;
    if (q.tipo === 'obj') {
      const resp = r.respostas[id];
      if (!resp) branco++;
      const ok = resp === q.resposta;
      if (q.area === 'fg') { fgT++; if (ok) fgA++; } else { ceT++; if (ok) ceA++; }
    } else {
      const n = r.notasDiscursivas[id];
      (q.area === 'fg' ? fgD : ceD).push(typeof n === 'number' ? n : null);
    }
  }
  const media = (a: (number | null)[]) => a.length ? a.reduce<number>((s, x) => s + (x ?? 0), 0) / a.length * 10 : null;
  const fgObj = fgT ? fgA / fgT * 100 : 0, ceObj = ceT ? ceA / ceT * 100 : 0;
  const fgDisc = media(fgD), ceDisc = media(ceD);
  const notaFG = fgDisc === null ? fgObj : 0.6 * fgObj + 0.4 * fgDisc;
  const notaCE = ceDisc === null ? ceObj : 0.85 * ceObj + 0.15 * ceDisc;
  return {
    fgAcertos: fgA, fgTotal: fgT, ceAcertos: ceA, ceTotal: ceT,
    acertos: fgA + ceA, totalObjetivas: fgT + ceT, emBranco: branco,
    discursivas: fgD.length + ceD.length,
    pendentes: [...fgD, ...ceD].filter(x => x === null).length,
    notaFG, notaCE, nota: 0.25 * notaFG + 0.75 * notaCE,
  };
}

export function desempenhoPorTema(lista: Resultado[], porId: Map<string, Questao>): DesempenhoTema[] {
  const m = new Map<string, { a: number; t: number }>();
  for (const r of lista) for (const id of r.qids) {
    const q = porId.get(id); if (!q || q.tipo !== 'obj') continue;
    const e = m.get(q.tema) ?? { a: 0, t: 0 };
    e.t++; if (r.respostas[id] === q.resposta) e.a++;
    m.set(q.tema, e);
  }
  return [...m].map(([tema, e]) => ({ tema, acertos: e.a, total: e.t, taxa: e.a / e.t }));
}

export function classeBarra(taxa: number): string { return taxa >= 0.7 ? 'ok' : taxa >= 0.45 ? 'mid' : 'bad'; }
