# LEGENDÁRIO

Editor React/Capacitor de legendas dinâmicas para vídeo. O APK Android inclui um motor de exportação nativo e não precisa de internet para renderizar ou guardar vídeos.

## Estúdio de legendas

Inclui 105 estilos e 99 animações combináveis em sete camadas, com seis fontes incluídas para utilização offline. Abra **Explorar estilos e animações** na página inicial para experimentar sem importar um vídeo. Os novos tratamentos também são implementados na exportação MP4.

O APK debug deste ramo, “LEGENDÁRIO Editor teste”, usa o identificador `.editor`, separado da versão principal e das versões Studio/Sync anteriores, sem migrar ou apagar rascunhos existentes. A documentação de recursos, referências públicas e limites está em [Estúdio de legendas](docs/ESTUDIO-DE-LEGENDAS.md).

## Fluxo do editor

Na página inicial, **Novo projeto** abre a seleção de mídia. No Android, o acesso é solicitado por um botão explícito; a galeria apresenta miniaturas reais, duração e pesquisa nas mídias carregadas. Android 8/9 também têm extração local de miniaturas. Selecione um vídeo, reproduza a prévia e confirme **Usar este vídeo** para importar.

O editor mantém a prévia acima dos botões **Texto**, **Estilos**, **Animações**, **Ritmo** e **Sincronizar**. Cada botão abre um painel contextual. A timeline contém faixas de vídeo e legendas, seleção, seek e zoom. O acesso a arquivo/colagem SRT fica abaixo da timeline. **Exportar** permanece no cabeçalho, com configurações próprias. Janelas muito baixas permitem rolagem para não cortar controles.

Rascunhos do navegador preservam legendas e ajustes, mas pedem a seleção do vídeo ao reabrir. Quando o navegador bloqueia armazenamento persistente, a prévia informa que os rascunhos são temporários. No Android, mídia importada e rascunhos continuam em arquivos privados locais.

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

O workflow **Build APK LEGENDÁRIO** publica `legendario-apk-debug`. Quando iniciado manualmente também executa o workflow de teste de exportação em emuladores Android 8 e 10, com a permissão `INTERNET` removida do APK de testes. O teste confirma a ausência dessa permissão antes de invocar o caminho de produção dos plugins.

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
# Sincronização inteligente offline (beta)

No editor Android, abra **Sincronizar** para comparar o áudio do vídeo com o SRT, ouvir posições sugeridas e aplicar apenas as correções selecionadas. O modelo português é incluído no APK, sem download durante o uso. A primeira versão usa reconhecimento Vosk e correspondência de palavras; não é alinhamento fonético forçado nem precisão garantida. Tempos originais são preservados e podem ser restaurados ou guardados como SRT.

Compilação local: após `npx cap sync android` e `python3 scripts/install_native.py`, execute também `python3 scripts/prepare_speech_model.py` para incluir o modelo com hash fixado e licenças. O modelo binário não é versionado no Git. Sem esse passo, a análise informa erro de modelo ausente; não há fallback que baixe dados.

Arquitetura, requisitos e limites em [docs/SINCRONIZACAO-INTELIGENTE.md](docs/SINCRONIZACAO-INTELIGENTE.md).
