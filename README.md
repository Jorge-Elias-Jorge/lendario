# LEGENDÁRIO

Editor profissional de legendas dinâmicas para vídeo — YouTube Shorts, TikTok, Reels, podcasts, documentários, gaming e conteúdo educativo.

## Funcionalidades incluídas nesta versão

- Importação de SRT por texto colado ou ficheiro `.srt`, com validação e relatório de erros
- Editor com pré-visualização de vídeo, linha temporal e edição de cada legenda (texto, início, fim)
- Biblioteca de **220 estilos** de legendas distribuídos por 20 categorias
- Biblioteca de **120 animações** (fade, zoom, pop, bounce, slide, typewriter, reveal, glow, pulse, shake, glitch, elastic, mask, rotate, impact)
- Temas claro e escuro
- Exportação de vídeo com legendas incorporadas (canvas + FFmpeg.wasm → MP4)
- Workflow GitHub Actions que compila a versão web e publica **ZIP como artefacto** descarregável

## Como construir localmente

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # produção (pasta dist/)
```

## Como obter o ZIP

1. Vai ao separador **Actions** do repositório
2. Abre o workflow **Build LEGENDÁRIO**
3. Descarrega o artefacto **legendario-web** (ZIP)

## Limitações conhecidas

- A exportação MP4 usa FFmpeg.wasm e requer a primeira carga dos binários (depois funciona offline em cache)
- A sincronização automática por IA (VAD/alinhamento) está prevista como módulo `src/core/ai` e requer integração de modelo local (silero-vad / whisper.cpp)
- O build Android requer `npx cap add android` e Android SDK; o workflow tenta compilar mas pode necessitar de ajustes nativos
