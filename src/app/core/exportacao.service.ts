import { Injectable, inject } from '@angular/core';
import { BancoService } from './banco.service';
import { avaliar, rotulos } from './avaliacao';
import { LETRAS, Letra, Resultado } from './modelos';
import { formatarData, formatarDuracao, nomeArea, num, pct } from './formatos';

const esc = (s: string) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

@Injectable({ providedIn: 'root' })
export class ExportacaoService {
  private banco = inject(BancoService);

  baixar(nome: string, conteudo: string, tipo: string): void {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const a = document.createElement('a'); a.href = url; a.download = nome; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  nomeArquivo(r: Resultado, ext: string): string {
    const d = new Date(r.data);
    return `simulado-enade-${d.toISOString().slice(0, 10)}-${d.toTimeString().slice(0, 5).replace(':', 'h')}.${ext}`;
  }

  csv(r: Resultado): string {
    const porId = this.banco.porId(), rot = rotulos(r.qids, porId);
    const linhas: (string | number)[][] = [['numero', 'prova_origem', 'questao_origem', 'area', 'tema', 'tipo', 'sua_resposta', 'gabarito', 'resultado', 'autoavaliacao']];
    r.qids.forEach((id, i) => {
      const q = porId.get(id)!; const a = r.respostas[id] ?? '';
      const obj = q.tipo === 'obj';
      linhas.push([rot[i], q.ano, q.n, nomeArea(q.area), q.tema, obj ? 'objetiva' : 'discursiva',
        obj ? a : (a.trim() ? 'respondida' : ''), obj ? q.resposta! : '',
        obj ? (!a ? 'em branco' : a === q.resposta ? 'certa' : 'errada') : '',
        !obj && typeof r.notasDiscursivas[id] === 'number' ? String(r.notasDiscursivas[id]).replace('.', ',') : '']);
    });
    return '\uFEFF' + linhas.map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  }

  /** Relatório HTML autossuficiente (figuras embutidas como base64). */
  async html(r: Resultado): Promise<string> {
    const porId = this.banco.porId(), rot = rotulos(r.qids, porId), e = avaliar(r, porId);
    const cards = r.qids.map((id, i) => {
      const q = porId.get(id)!;
      if (q.tipo === 'disc') {
        const resp = r.respostas[id]?.trim();
        return `<section class="c d"><h3>Discursiva ${rot[i].slice(1)} <small>ENADE ${q.ano}, discursiva ${q.n}</small></h3>${q.enunciadoHtml}<h4>Sua resposta</h4><p class="mine">${resp ? esc(resp) : 'Em branco'}</p><h4>Padrão de resposta</h4><div class="pad">${q.padraoHtml}</div></section>`;
      }
      const a = r.respostas[id] as Letra | undefined, ok = a === q.resposta;
      return `<section class="c ${ok ? 'ok' : 'bad'}"><h3>Questão ${rot[i]}: ${!a ? 'em branco' : ok ? 'certa' : 'errada'} <small>ENADE ${q.ano}, questão ${q.n}, ${esc(q.tema)}</small></h3>${q.enunciadoHtml}<ol type="A">${q.alternativasHtml.map((o, k) => `<li class="${LETRAS[k] === q.resposta ? 'r' : ''} ${LETRAS[k] === a && !ok ? 'w' : ''}">${o}</li>`).join('')}</ol><p><b>Sua resposta:</b> ${a || 'nenhuma'}. <b>Gabarito:</b> ${q.resposta}.</p><p class="why">${esc(q.explicacao ?? '')}</p></section>`;
    }).join('');
    const corpo = await this.embutirImagens(cards);
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resultado do simulado ENADE</title><style>
body{font-family:system-ui,Arial,sans-serif;color:#1B2833;background:#EEF2F5;margin:0;line-height:1.55}main{max-width:820px;margin:0 auto;padding:28px 18px}
.sum,.c{background:#fff;border-radius:14px;padding:16px 20px;margin:12px 0}.c{border-left:5px solid #ccc;page-break-inside:avoid}.c.ok{border-color:#2E8A57}.c.bad{border-color:#BE443D}.c.d{border-color:#3AA0DD}
small{color:#5D6D7A;font-weight:400;font-size:13px}img{max-width:100%}pre{background:#F3F6F8;padding:10px;border-radius:8px;overflow:auto;font-size:13px}
table{border-collapse:collapse}th,td{border:1px solid #D3DCE3;padding:4px 8px;font-size:13px}.src{font-size:12px;color:#5D6D7A}
li.r{color:#2E8A57;font-weight:700}li.w{color:#BE443D;text-decoration:line-through}.why,.pad{background:#DBEDF9;border-radius:10px;padding:10px 14px}.mine{white-space:pre-wrap;background:#F3F6F8;border-radius:10px;padding:10px}.porque{text-align:center;font-weight:700}
</style></head><body><main><h1>Resultado do simulado ENADE</h1><div class="sum">
<p>${formatarData(r.data)} (${formatarDuracao(r.duracao)})</p>
<p>Objetivas: <b>${e.acertos} de ${e.totalObjetivas}</b> (${pct(e.acertos, e.totalObjetivas)}%). Formação geral: ${e.fgAcertos}/${e.fgTotal}. Componente específico: ${e.ceAcertos}/${e.ceTotal}.</p>
<p>Nota estimada: <b>${num(e.nota)}</b></p></div>${corpo}</main></body></html>`;
  }

  private async embutirImagens(html: string): Promise<string> {
    const srcs = [...new Set([...html.matchAll(/src="(figuras\/[^"]+)"/g)].map(m => m[1]))];
    for (const src of srcs) {
      try {
        const blob = await (await fetch(src)).blob();
        const dataUri = await new Promise<string>(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result as string); fr.readAsDataURL(blob); });
        html = html.split(`src="${src}"`).join(`src="${dataUri}"`);
      } catch { /* mantém o caminho relativo */ }
    }
    return html;
  }
}
