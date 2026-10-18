# Sincronização inteligente offline: primeira versão

## Dependência e estado

PR empilhado sobre `feat/viral-caption-studio` ([PR #2](https://github.com/Jorge-Elias-Jorge/lendario/pull/2)), que depende da exportação offline do [PR #1](https://github.com/Jorge-Elias-Jorge/lendario/pull/1). Não integra nem modifica `main`.

## Implementação funcional

- Modelo Vosk português incluído no APK, com hash fixado, licença Apache 2.0 e download somente na compilação.
- Descodificação de áudio local em fluxo, downmix, frequência real e conservação de silêncio inicial/gaps via PTS.
- Comparação monotônica das palavras reconhecidas com o SRT em Web Worker. Os tempos antigos não restringem a busca.
- Classificação de propostas prontas para ouvir, revisão necessária e texto não localizado. Frases repetidas/curtas/ausentes ou baixa confiança não são automaticamente aprovadas.
- Progresso, cancelamento, bloqueio de exportação concorrente e limpeza de recursos.
- Revisão antes/depois, filtros, ouvir posição proposta e seleção explícita. Validação contra edições posteriores e sobreposição.
- Original preservado no rascunho, restauração e exportação SRT atual/anterior pelo seletor local.
- Tempos reais por palavra usados na prévia Canvas e sobreposição Java. Edição manual invalida metadados acústicos; projetos antigos mantêm fallback uniforme.
- SRT importado mantém ordem e sobreposições para análise, em vez de “corrigir” horários antes de ouvir a fala.
- APK de teste `.sync`, **LEGENDÁRIO Sync teste**, separado do Studio anterior. Dados privados de outra instalação não são migrados.

## Resultados observados

- TypeScript, Vite e **139 testes JavaScript** passaram localmente.
- [Primeira execução Android](https://github.com/Jorge-Elias-Jorge/lendario/actions/runs/39094545220): build e **12 testes em cada versão, Android 8 e 10**, aprovados. Relatórios XML descarregados e conferidos: zero falhas/erros.
- Testes nativos incluem reconhecimento com modelo incluído sem INTERNET, silêncio inicial de dois segundos, ausência de áudio, cancelamento, tempos por palavra não uniformes e regressões de exportação.
- [Execução da revisão final](https://github.com/Jorge-Elias-Jorge/lendario/actions/runs/39094998541): inclui proteções de concorrência/recursos e identificador paralelo `.sync`. Consultar a execução para o estado final, sem confundir o resultado anterior com esta revisão.
- Chromium em desktop/375 px e claro/escuro sem overflow horizontal nos estados medidos.
- Fluxos de revisão, seleção, aplicação parcial, persistência/reabertura, restauração, SRT atual/original, erro, ausência de palavras, cancelamento, filtro e resultado desatualizado exercitados com ponte nativa simulada. Esses testes de UI não são testes acústicos; o reconhecimento real é exercitado nos testes nativos.

## Limitações importantes

É um MVP de reconhecimento e correspondência textual, **não um alinhador fonético forçado nem uma promessa de precisão elevada em qualquer vídeo**. O modelo leve português tem limitações expressivas de reconhecimento conforme o [catálogo oficial Vosk](https://alphacephei.com/vosk/models), e a pontuação não é uma probabilidade calibrada de acerto.

Sem benchmark em narração humana nem teste em celular físico nesta entrega. Fixture de fala sintética é smoke test, não validação de precisão. Até 30 minutos por áudio, com limite adicional de 12 milhões de células de comparação. Não há tradução, normalização de números nem seleção de locutor/faixa.

Documentação em `docs/SINCRONIZACAO-INTELIGENTE.md`. A função deve continuar beta até avaliação com vídeo/SRT reais do usuário.
