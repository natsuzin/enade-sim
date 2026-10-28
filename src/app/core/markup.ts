/**
 * Converte o markup leve usado nos arquivos de questões em HTML.
 *
 * Regras (uma por linha, parágrafos separados por linha em branco):
 *   ```  ...  ```        bloco de código
 *   [[img:nome]]         figura em public/figuras/nome.png
 *   [[sudoku]]           grade de sudoku da prova de 2014
 *   ~ texto              linha de fonte/referência
 *   <table ...>          tabela HTML crua (uma linha)
 *   PORQUE               separador das questões de asserção-razão
 *   I. / II. / ...       afirmação numerada
 * HTML inline (<i>, <b>, <code>, <u>, &lt;) é mantido.
 */
const SUDOKU = ['53..7....', '6..195...', '.98....6.', '8...6...3', '4..8.3..1', '7...2...6', '.6....28.', '...419..5', '....8..79'];

function escapar(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Protege URLs do tipo <http://...> para não virarem tags. */
function inline(s: string): string {
  return s.replace(/<(https?:[^>]*)>/g, (_, u: string) => `&lt;${u.trim()}&gt;`);
}

function sudoku(): string {
  const linhas = SUDOKU.map((l, r) =>
    '<tr>' + [...l].map((ch, c) =>
      `<td class="${r % 3 === 0 ? 'bt ' : ''}${c % 3 === 0 ? 'bl' : ''}">${ch === '.' ? '' : ch}</td>`).join('') + '</tr>');
  return `<figure class="fig"><table class="sudoku">${linhas.join('')}</table></figure>`;
}

export function markupParaHtml(texto: string, pastaFiguras = 'figuras'): string {
  const out: string[] = [];
  const partes = texto.split(/```\n?([\s\S]*?)```/);
  partes.forEach((parte, i) => {
    if (i % 2 === 1) {
      out.push(`<pre class="code"><code>${escapar(parte.replace(/\n+$/, ''))}</code></pre>`);
      return;
    }
    for (const paragrafo of parte.replace(/^\n+|\n+$/g, '').split(/\n\s*\n/)) {
      const p = paragrafo.trim();
      if (!p) continue;
      let buf: string[] = [];
      const flush = () => { if (buf.length) { out.push(`<p>${buf.map(inline).join('<br>')}</p>`); buf = []; } };
      for (const linha of p.split('\n')) {
        const st = linha.trim();
        const img = st.match(/^\[\[img:(\w+)\]\]$/);
        const af = st.match(/^(I|II|III|IV|V)\. (.*)$/);
        if (img) { flush(); out.push(`<figure class="fig"><img src="${pastaFiguras}/${img[1]}.png" alt="Figura da questão" loading="lazy"></figure>`); }
        else if (st === '[[sudoku]]') { flush(); out.push(sudoku()); }
        else if (st.startsWith('~ ')) { flush(); out.push(`<p class="src">${inline(st.slice(2))}</p>`); }
        else if (st.startsWith('<table')) { flush(); out.push(`<div class="tbwrap">${st}</div>`); }
        else if (st === 'PORQUE') { flush(); out.push('<p class="porque">PORQUE</p>'); }
        else if (af) { flush(); out.push(`<p class="af"><span class="afn">${af[1]}.</span> ${inline(af[2])}</p>`); }
        else buf.push(st);
      }
      flush();
    }
  });
  return out.join('');
}

/** Alternativas podem ser texto simples ou HTML (começando com "<"). */
export function alternativaParaHtml(a: string): string {
  return a.startsWith('<') ? a : inline(a);
}
