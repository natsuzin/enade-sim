// Verifica os arquivos de public/dados antes de publicar: rode com `npm run validar`.
import { readFileSync, existsSync } from 'node:fs';
const raiz = new URL('../public/', import.meta.url);
const indice = JSON.parse(readFileSync(new URL('dados/indice.json', raiz)));
let erros = 0;
const falha = (msg) => { console.error('✖ ' + msg); erros++; };
for (const curso of indice.provas) {
  const ids = new Set();
  for (const ano of curso.anos) {
    const arq = `dados/${curso.curso}-${ano}.json`;
    if (!existsSync(new URL(arq, raiz))) { falha(`${arq} não existe`); continue; }
    const prova = JSON.parse(readFileSync(new URL(arq, raiz)));
    const cont = { fg: { obj: 0, disc: 0 }, ce: { obj: 0, disc: 0 } };
    for (const q of prova.questoes) {
      const ref = `${arq} ${q.id}`;
      if (ids.has(q.id)) falha(`${ref}: id repetido`); ids.add(q.id);
      if (!['fg', 'ce'].includes(q.area)) falha(`${ref}: area inválida`);
      if (!['obj', 'disc'].includes(q.tipo)) falha(`${ref}: tipo inválido`);
      if (!q.enunciado?.trim()) falha(`${ref}: enunciado vazio`);
      if (q.tipo === 'obj') {
        if (q.alternativas?.length !== 5) falha(`${ref}: precisa de 5 alternativas`);
        if (!'ABCDE'.includes(q.resposta ?? 'x')) falha(`${ref}: resposta inválida`);
        if (!q.explicacao?.trim()) falha(`${ref}: sem explicação`);
      } else if (!q.padraoResposta?.trim()) falha(`${ref}: sem padrão de resposta`);
      for (const [, nome] of `${q.enunciado}${q.padraoResposta ?? ''}`.matchAll(/\[\[img:(\w+)\]\]/g))
        if (!existsSync(new URL(`figuras/${nome}.png`, raiz))) falha(`${ref}: figura ${nome}.png não encontrada`);
      if (!(q.tipo === 'obj' && prova.anuladas.includes(q.n))) cont[q.area][q.tipo]++;
    }
    console.log(`${arq}: FG ${cont.fg.obj} obj + ${cont.fg.disc} disc, CE ${cont.ce.obj} obj + ${cont.ce.disc} disc`);
  }
}
if (erros) { console.error(`\n${erros} problema(s) encontrado(s).`); process.exit(1); }
console.log('\nTudo certo.');
