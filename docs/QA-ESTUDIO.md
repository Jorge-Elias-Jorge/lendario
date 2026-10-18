# Verificação do estúdio

## Inventário de QA

- Entrada pela página inicial sem vídeo; retorno sem modificar rascunhos.
- Catálogo: 105 estilos, categoria, pesquisa sem acentos, nenhum resultado e limpeza de filtros.
- Aplicação: seleção com `aria-pressed`, texto da prévia e fonte incluída.
- Animações: pesquisa, categoria, aplicação em sete camadas, duração/intensidade/curva, remoção e limpeza.
- Prévia: reprodução/pausa, posição, letra/linha/palavra, texto personalizado e mudança de apresentação.
- Personalização: fonte/peso, tamanho, alinhamento, coordenadas, espaçamento, contorno, cores, fundo e destaque.
- Fluxo de projeto: importar vídeo/SRT, editar, guardar e recuperar camadas/ritmo.
- Layout: desktop, 375 px, retorno ao desktop e janela baixa; verificar overflow e cartões legíveis.
- Cenários negativos: pesquisa sem resultado e modo biblioteca depois de um projeto guardado.
- Exportação: testes anteriores, catálogo completo no Android, vetores JavaScript/Java e MP4 com composição de estúdio sem permissão de internet.

## Evidência automática

Executar `npm test`, `npm run typecheck` e o workflow manual Android. Os resultados e limitações da execução devem ser associados ao PR, sem tratar um teste de prévia como prova de compatibilidade com todos os celulares.

## Resultados observados nesta implementação

- TypeScript, build Vite e 113 testes JavaScript aprovados localmente.
- Android 8: oito testes instrumentados aprovados, zero falhas/erros; relatório XML descarregado da [execução Android](https://github.com/Jorge-Elias-Jorge/lendario/actions/runs/39088090388).
- Chromium: 105 estilos e 99 animações visíveis; pesquisa `karaoke`, seleção, pesquisa sem resultado e limpeza verificadas.
- Sete animações aplicadas simultaneamente; curva linear, remoção do destaque e limpeza das sete camadas verificadas.
- Fonte, peso, alinhamento, sliders, maiúsculas, itálico, preenchimento, brilho e fundo exercitados com interação.
- Fluxo completo com MP4 local: duas legendas SRT importadas, primeira editada, animação por letra e apresentação Palavra aplicadas, projeto guardado, regresso à página inicial, exploração da biblioteca e reabertura. Texto, camada por letra e apresentação recuperados corretamente.
- Layout revisto em desktop, 375 px e janela desktop de 540 px de altura. Sem overflow horizontal nos estados medidos; prévia e composição de camadas inspecionadas visualmente.
- Nenhum erro JavaScript observado até esta etapa. Não representa certificação em celular físico, vídeos longos, todos os codecs, HDR ou 4K.
- Android 10: oito testes instrumentados aprovados, zero falhas/erros, na mesma primeira execução. Relatório XML descarregado e conferido.
- Exportação de navegador concluída: vídeo WebM gerado e ligação de descarga exibida após o botão Concluir. Não confundir esse fallback com a exportação MP4 nativa.
- Tema claro também inspecionado em 375 px, sem overflow horizontal. Fonte carregada e nenhum erro JavaScript observado ao finalizar.
- [Revisão final](https://github.com/Jorge-Elias-Jorge/lendario/actions/runs/39088382565): APK compilado. A única alteração de código desde a primeira execução é a inicialização da apresentação a partir do estilo selecionado; o código nativo permanece igual. A repetição dos testes instrumentados deve ser acompanhada na execução.
