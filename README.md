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
    estudos.json                 # onde estudar cada tema (vídeos, livros e textos)
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
    app.routes.ts                # '', 'prova', 'resultado/:id', 'treino', 'provas/:ano', 'estudos', 'historico' (lazy loading)
    core/
      modelos.ts                 # interfaces (Questao, SimuladoAtual, Resultado...)
      markup.ts                  # converte o markup dos JSON em HTML
      banco.service.ts           # carrega e prepara as questões
      armazenamento.service.ts   # estado persistido em localStorage
      simulado.service.ts        # sorteio, cronômetro, respostas, entrega
      treino.service.ts          # treino por tema ou por ano
      estudos.service.ts         # carrega o material de estudo por tema
      avaliacao.ts               # correção, nota estimada, desempenho por tema
      exportacao.service.ts      # relatório .html, planilha .csv, backup .json
      formatos.ts                # formatação de datas, tempos e números
    shared/
      barra-lateral.component.ts # navegação entre Simulado, Treino, Provas, Estudos e Histórico
      confirmacao.component.ts   # modal de confirmação
      grafico-evolucao.component.ts  # gráfico SVG do histórico
      aviso.service.ts           # mensagens (toast)
      zoom.ts                    # ampliar figuras ao clicar
    paginas/
      inicio/                    # nome, novo simulado, histórico
      prova/                     # questão, cartão-resposta, cronômetro
      resultado/                 # correção, discursivas, exportação
      treino/                    # escolha do tema/ano e prática com correção na hora
      provas/                    # prova completa de um ano, com gabarito assinalado
      estudos/                   # vídeo-aulas e livros de referência por tema
```

## Como o simulado funciona

- **Composição** (igual à prova real): 2 discursivas + 8 objetivas de formação geral, 3 discursivas + 27 objetivas do componente específico. Está em `ESTRUTURA` no `simulado.service.ts`.
- **Sorteio**: as questões são escolhidas entre todos os anos, priorizando as que o aluno viu menos vezes (`vistas` no armazenamento).
- **Tempo**: 4 horas (`DURACAO_PROVA`). O prazo é um timestamp salvo, então recarregar a página não reinicia o relógio. Ao zerar, a prova é entregue automaticamente.
- **Nota estimada** (`avaliacao.ts`): pesos do ENADE. FG = 60% objetivas + 40% discursivas; CE = 85% objetivas + 15% discursivas; nota = 25% FG + 75% CE. Discursivas sem autoavaliação contam como zero.
- **Questões anuladas**: listadas em `anuladas` no JSON da prova e ignoradas no sorteio.

## Como o treino funciona

- Escolha **um ou mais temas** (agrupados por grande área, com atalho para marcar os temas com menos de 50% de acerto nos simulados) ou **a prova de um ano**; opcionalmente inclua as discursivas e embaralhe a ordem.
- Sem cronômetro e sem nota: cada objetiva é corrigida ao responder, com a explicação logo abaixo; nas discursivas você abre o padrão de resposta quando quiser.
- O progresso fica salvo em `treino` no armazenamento. Treinos não entram no histórico nem alteram o sorteio do simulado.

## Material de estudo

`public/dados/estudos.json` indica, para cada tema das questões, onde estudar: vídeo-aulas (de preferência playlists da Univesp e de outros canais brasileiros; em inglês só quando falta material em português) e o livro de referência que a banca cita nos enunciados. As chaves de `temas` são exatamente os valores do campo `tema` das questões, e o `npm run validar` acusa tema sem material ou chave órfã.

```jsonc
"Grafos": {
  "resumo": "Uma frase sobre o que estudar neste tema para o ENADE.",
  "recursos": [
    { "tipo": "video", "titulo": "Teoria de Grafos", "fonte": "Prof. Douglas Maioli", "idioma": "pt", "url": "https://www.youtube.com/playlist?list=..." },
    { "tipo": "livro", "titulo": "Algoritmos: teoria e prática", "fonte": "Cormen, Leiserson, Rivest e Stein", "capitulos": "22 a 24" }
  ]
}
```

`tipo` é `video`, `livro` ou `texto`; `url` (sempre `https://`) é obrigatória para vídeo e texto. Ao incluir um link, confira antes que ele abre, é do canal indicado e trata do tema. Na tela, `/#/estudos?tema=Grafos` abre a página já no card do tema, e o resultado do simulado leva para lá a partir de cada questão errada ou em branco.

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
      "grupo": "Algoritmos e estruturas de dados",  // grande área que reúne temas no Treino
      "enunciado": "texto em markup",
      "alternativas": ["A...", "B...", "C...", "D...", "E..."],
      "resposta": "A",
      "explicacao": "por que a resposta certa é a certa"
    },
    {
      "id": "2017-d3", "n": 3, "area": "ce", "tipo": "disc", "tema": "Estruturas de dados", "grupo": "Algoritmos e estruturas de dados",
      "enunciado": "...",
      "padraoResposta": "texto em markup"
    }
  ]
}
```

## Dados do usuário

Tudo fica no `localStorage` na chave `enade-cc-simulador:v1` (formato em `Armazenamento`, em `modelos.ts`). O backup exportado pela tela inicial é um JSON com `historico` e `vistas`, e pode ser importado em outro navegador.
