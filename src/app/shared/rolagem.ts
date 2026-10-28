/** A página rola dentro de .conteudo (cabeçalho e barra lateral ficam fixos), não na janela. */
export function rolarParaTopo(): void {
  document.querySelector('.conteudo')?.scrollTo({ top: 0 });
}
