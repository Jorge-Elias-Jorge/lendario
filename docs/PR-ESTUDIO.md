# Estúdio de legendas offline

## Estrutura e dependência

Esta alteração depende da correção de exportação offline do [PR #1](https://github.com/Jorge-Elias-Jorge/lendario/pull/1). A base deste PR é `fix/offline-media3-export`, não `main`. Nenhuma integração automática em `main` foi realizada.

## Implementação

- 105 estilos no total: 33 preservados e 72 novos estilos originais.
- 99 receitas de animação no total: 33 preservadas e 66 novas.
- Sete camadas combináveis: entrada, saída, contínua, palavra, letra, linha e destaque.
- Duração, intensidade, curva, remoção por camada e limpeza completa.
- Destaque karaoke, marcador, pílula, moldura, sublinhado, ampliação, contorno, gradiente, extrusão 2D e caixas por linha.
- Seis fontes incluídas no APK com licenças SIL OFL.
- Prévia Canvas e renderização Android com os mesmos parâmetros e fórmulas de movimento.
- Persistência de composição e apresentação; biblioteca de demonstração que não sobrescreve rascunhos.
- APK debug com identificador `.studio` para instalação paralela ao aplicativo anterior.

## Validação

- `npm run typecheck`, `npm run build` e 113 testes JavaScript passaram localmente.
- Catálogo gera 1.296 vetores numéricos para comparação JavaScript/Java.
- [Primeira execução Android](https://github.com/Jorge-Elias-Jorge/lendario/actions/runs/39088090388): APK compilado e oito testes instrumentados passaram em cada versão, Android 8 e Android 10, incluindo renderização de todas as receitas e MP4 com composição de estúdio sem permissão INTERNET. Ambos os relatórios XML foram descarregados e conferidos: zero falhas/erros.
- [Execução da revisão final](https://github.com/Jorge-Elias-Jorge/lendario/actions/runs/39088382565): inclui a correção de apresentação inicial do primeiro estilo. Consultar o estado da execução para o resultado final do build e dos emuladores.
- Interface exercitada em Chromium: filtros, estado vazio, aplicação em sete camadas, remoção, limpeza, curva, fonte, apresentação e ajustes. Verificação a 375 px sem overflow horizontal.

## Limitações

Não inclui conteúdo proprietário nem promete todos os modelos pagos do CapCut ou um ranking das legendas mais usadas. Os tempos por palavra/letra são distribuídos uniformemente dentro de cada legenda, sem reconhecimento de voz ou alinhamento acústico. O teste em emulador não substitui a verificação no celular, especialmente para codecs, 4K/HDR e vídeos longos.

Detalhes e licenças em `docs/ESTUDIO-DE-LEGENDAS.md`.
