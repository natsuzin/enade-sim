# Simulado ENADE: Ciência da Computação

Simulador web das provas do ENADE com questões reais (2014, 2017 e 2021), cronômetro de 4 horas, correção comentada, autoavaliação das discursivas, exportação do resultado e histórico de evolução salvo no navegador.

Feito em **Angular 19** (componentes standalone, signals e o novo controle de fluxo `@if`/`@for`), sem backend: os dados são arquivos JSON estáticos e o estado do usuário fica no `localStorage`.

## Requisitos

- Node.js 20 LTS ou mais recente (18.19+ também funciona)
- npm 10+

## Comandos

```bash
npm install        # instala as dependências
npm start          # servidor de desenvolvimento em http://localhost:4200
npm run build      # build de produção em dist/enade-simulador/browser
npm run validar    # confere os arquivos de questões (ids, gabaritos, figuras)
```

O build de produção baixa as fontes do Google Fonts para embuti-las. Sem internet, use `npx ng build --configuration development`.

## Estrutura

```
public/
  dados/
    indice.json                  # cursos e anos disponíveis
    cc-bacharelado-2014.json     # uma prova por arquivo
    cc-bacharelado-2017.json
    cc-bacharelado-2021.json
  figuras/                       # imagens usadas nos enunciados ([[img:nome]])
scripts/
  validar-dados.mjs              # validação dos JSON
src/
  styles.css                     # tokens de cor (claro/escuro) e todos os estilos
  app/
    app.config.ts                # providers; carrega o banco antes de abrir o app
    app.routes.ts                # '', 'prova', 'resultado/:id' (lazy loading)
    core/
      modelos.ts                 # interfaces (Questao, SimuladoAtual, Resultado...)
      markup.ts                  # converte o markup dos JSON em HTML
      banco.service.ts           # carrega e prepara as questões
      armazenamento.service.ts   # estado persistido em localStorage
      simulado.service.ts        # sorteio, cronômetro, respostas, entrega
      avaliacao.ts               # correção, nota estimada, desempenho por tema
      exportacao.service.ts      # relatório .html, planilha .csv, backup .json
      formatos.ts                # formatação de datas, tempos e números
    shared/
      confirmacao.component.ts   # modal de confirmação
      grafico-evolucao.component.ts  # gráfico SVG do histórico
      aviso.service.ts           # mensagens (toast)
      zoom.ts                    # ampliar figuras ao clicar
    paginas/
      inicio/                    # nome, novo simulado, histórico
      prova/                     # questão, cartão-resposta, cronômetro
      resultado/                 # correção, discursivas, exportação
```

## Como o simulado funciona

- **Composição** (igual à prova real): 2 discursivas + 8 objetivas de formação geral, 3 discursivas + 27 objetivas do componente específico. Está em `ESTRUTURA` no `simulado.service.ts`.
- **Sorteio**: as questões são escolhidas entre todos os anos, priorizando as que o aluno viu menos vezes (`vistas` no armazenamento).
- **Tempo**: 4 horas (`DURACAO_PROVA`). O prazo é um timestamp salvo, então recarregar a página não reinicia o relógio. Ao zerar, a prova é entregue automaticamente.
- **Nota estimada** (`avaliacao.ts`): pesos do ENADE. FG = 60% objetivas + 40% discursivas; CE = 85% objetivas + 15% discursivas; nota = 25% FG + 75% CE. Discursivas sem autoavaliação contam como zero.
- **Questões anuladas**: listadas em `anuladas` no JSON da prova e ignoradas no sorteio.

## Formato dos arquivos de questões

```jsonc
{
  "ano": 2017,
  "curso": "Ciência da Computação",
  "grau": "Bacharelado",
  "anuladas": [],
  "questoes": [
    {
      "id": "2017-09",            // único em todo o banco
      "n": 9,                     // número na prova original
      "area": "ce",               // "fg" (formação geral) ou "ce" (componente específico)
      "tipo": "obj",              // "obj" ou "disc"
      "tema": "Estruturas de dados",  // usado nas estatísticas por tema
      "enunciado": "texto em markup",
      "alternativas": ["A...", "B...", "C...", "D...", "E..."],
      "resposta": "A",
      "explicacao": "por que a resposta certa é a certa"
    },
    {
      "id": "2017-d3", "n": 3, "area": "ce", "tipo": "disc", "tema": "Estruturas de dados",
      "enunciado": "...",
      "padraoResposta": "texto em markup"
    }
  ]
}
```

### Markup dos enunciados

Parágrafos são separados por uma linha em branco; dentro de um parágrafo, cada quebra de linha vira `<br>`. Regras especiais, uma por linha:

| Escreva | Resultado |
| --- | --- |
| ` ``` ` … ` ``` ` | bloco de código (o conteúdo é escapado) |
| `[[img:17_09a]]` | figura `public/figuras/17_09a.png` (clicável para ampliar) |
| `~ Disponível em: ...` | linha de fonte, em letra menor |
| `<table class="tb">...</table>` | tabela HTML (em uma única linha) |
| `PORQUE` | separador das questões de asserção-razão |
| `I. texto` | afirmação numerada (I a V) |

HTML simples dentro do texto (`<i>`, `<b>`, `<code>`, `<u>`, `&lt;`) é mantido. Uma alternativa que começa com `<` é tratada como HTML (por exemplo `<pre>` para SQL).

## Adicionar uma prova nova

1. Crie `public/dados/cc-bacharelado-AAAA.json` no formato acima (ids no padrão `AAAA-NN` e `AAAA-dN`).
2. Recorte as figuras em PNG para `public/figuras/` (largura de até 900 px).
3. Adicione o ano em `public/dados/indice.json`.
4. Rode `npm run validar`.

## Adicionar outro curso

Os arquivos já são separados por curso (`<curso>-<ano>.json`) e o `BancoService.carregar(curso)` recebe o identificador. Faltaria: uma tela ou rota para escolher o curso, guardar o curso escolhido em `SimuladoAtual`/`Resultado` e separar o histórico por curso.

## Dados do usuário

Tudo fica no `localStorage` na chave `enade-cc-simulador:v1` (formato em `Armazenamento`, em `modelos.ts`). O backup exportado pela tela inicial é um JSON com `historico` e `vistas`, e pode ser importado em outro navegador.

## Publicação

O roteamento usa hash (`/#/prova`), então o build funciona em qualquer hospedagem estática (GitHub Pages, Netlify, Vercel, Firebase Hosting) sem configurar redirecionamentos. Publique o conteúdo de `dist/enade-simulador/browser`. Para subpastas (GitHub Pages de repositório), use `ng build --base-href /nome-do-repo/`.

## Ideias para continuar

- Modo treino por tema ou por ano, sem cronômetro
- Correção assistida das discursivas com um modelo de linguagem
- Contas de usuário e sincronização do histórico (Firebase, Supabase ou backend próprio)
- Testes unitários para `avaliacao.ts` e `markup.ts`, e e2e do fluxo da prova
- PWA para uso offline
