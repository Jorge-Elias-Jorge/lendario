# LEGENDÁRIO

Editor React/Capacitor de legendas dinâmicas para vídeo. O APK Android inclui um motor de exportação nativo e não precisa de internet para renderizar ou guardar vídeos.

## Exportação Android

- Motor AndroidX Media3 Transformer 1.5.1, incluído no APK: descodificação/codificação com MediaCodec e composição de legendas por GPU.
- MP4 com vídeo H.264 e áudio AAC, quando a origem tem áudio. Vídeos sem áudio também são aceites.
- Resolução e timestamps da origem, sem redução silenciosa de resolução para contornar um codec incompatível.
- Alta e Ultra definem taxas de vídeo proporcionais à resolução e à cadência; a taxa de áudio solicitada, quando há recodificação, é 192 ou 256 kbps. Áudio AAC compatível pode ser copiado sem recodificação.
- Android 10+: gravação transacional diretamente em `Movies/Legendario`, visível na galeria depois de concluir.
- Android 8/9: seletor do sistema para escolher um destino local, com nome `.mp4` e tipo `video/mp4`.
- Nenhum vídeo inteiro é convertido em Base64 ou transferido pela ponte JavaScript. Os plugins recebem caminhos locais e copiam ficheiros em blocos.
- Progresso, cancelamento durante a renderização, verificação do tamanho guardado e nova tentativa de gravação sem renderizar novamente.
- Importação e exportação não utilizam servidor, API paga, CDN ou download de codecs durante a utilização.

O motor Media3 é uma biblioteca Android, não um serviço contratado. Consulte a [documentação do Transformer](https://developer.android.com/media/media3/transformer/getting-started) e o [código da versão utilizada](https://github.com/androidx/media/tree/1.5.1).

## Desenvolvimento

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npx cap add android       # apenas na primeira configuração
npx cap sync android
python3 scripts/install_native.py
cd android
./gradlew assembleDebug
```

Requisitos do build nativo: Node 20, Java 17 e Android SDK 35. O script nativo é idempotente, regista os plugins e instala as dependências Media3; o APK suporta Android 8/API 26 ou superior.

O workflow **Build APK LEGENDÁRIO** publica `legendario-apk-debug`. Quando iniciado manualmente também executa o workflow de teste de exportação em emulador Android 10, com Wi-Fi e dados móveis desativados.

## Verificação e limites

- Os testes JavaScript verificam argumentos estruturados, passagem direta de caminhos, Alta/Ultra, cancelamento, exclusão mútua, erro do motor e repetição da gravação.
- Os testes instrumentados exportam fixtures locais com e sem áudio e com rotação. Verificam MP4/H.264, presença de áudio, duração, frames, orientação e pixels das legendas.
- Nenhum teste em emulador garante compatibilidade com todos os codificadores de fabricantes. Validar num aparelho real em modo de avião antes de distribuir.
- A exportação com legendas recodifica o vídeo: qualidade alta não significa compressão matematicamente sem perdas.
- A resolução máxima depende do codificador do aparelho. Uma configuração incompatível apresenta erro em vez de reduzir a resolução sem aviso.
- HDR é convertido para SDR por OpenGL no Android 10+. HDR em Android 8/9 pode não ser suportado; não há promessa de preservação de HDR.
- Manter a aplicação aberta até terminar. Esta versão não implementa serviço de exportação em segundo plano nem retoma depois de o processo Android ser encerrado.
- O navegador mantém o exportador WebM em tempo real; o novo motor MP4 offline pertence ao APK Android.
- As legendas nativas incluem texto, cores, contorno, gradiente, sombra, movimentos básicos e modos Frase/Realce ativo/Palavra/Blocos. Não é garantida equivalência pixel a pixel com as fontes e o layout do navegador.

Veja [o diagnóstico e o roteiro de validação](docs/EXPORTACAO-OFFLINE.md).
