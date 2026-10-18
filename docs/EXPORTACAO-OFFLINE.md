# Exportação MP4 offline

## Diagnóstico do código anterior

- JavaScript enviava `cues` e `style` com `JSON.stringify`, mas Java usava `getArray` e `getObject`. O plugin podia receber `null` e omitir legendas/estilo.
- O vídeo original inteiro era convertido num data URL. O descodificador recebia esse texto como origem em vez de um caminho local.
- O fim de entrada do descodificador era confundido com o fim de saída. O codificador podia nunca receber o sinal de fim, ficando num ciclo sem conclusão.
- Frames eram descartados se o buffer do codificador não estivesse disponível naquele instante.
- A conversão NV12 usava um deslocamento de linha de crominância incorreto, além de ignorar características de cor e recorte do descodificador.
- O MP4 era carregado de novo na WebView, convertido em Base64, copiado para outro temporário e apresentado ao seletor como `video/webm`, com extensão `.webm`.
- A qualidade selecionada na interface não era enviada ao renderizador Android.

## Arquitetura atual

`ficheiro importado privado → Media3/MediaCodec → composição GPU + overlay transparente reutilizado → MP4 temporário → MediaStore ou seletor local`

Só caminhos, metadados, objetos de legendas e progresso atravessam a ponte Capacitor. O vídeo não passa por `fetch`, `Blob` ou `FileReader` no caminho Android.

O motor usa [AndroidX Media3 Transformer](https://developer.android.com/media/media3/transformer/getting-started), fixado em [1.5.1](https://github.com/androidx/media/tree/1.5.1) para reproduzir o build. As dependências são descarregadas durante a compilação e incluídas no APK; o aparelho não as descarrega ao exportar.

## Armazenamento e falhas

No Android 10+, o plugin insere um MP4 pendente na coleção de vídeos, copia e verifica o comprimento persistido antes de retirar `IS_PENDING`. Se a cópia falhar, elimina a entrada incompleta. A API segue o modelo de [armazenamento de média do Android](https://developer.android.com/training/data-storage/shared/media).

No Android 8/9 utiliza `ACTION_CREATE_DOCUMENT` com `EXTRA_LOCAL_ONLY`, MIME `video/mp4` e extensão `.mp4`. A cópia ocorre num executor, sem bloquear a interface. Se o utilizador cancelar ou o destino falhar, pode repetir a gravação a partir do mesmo MP4 enquanto o painel continuar aberto.

Depois de sucesso ou de descarte explícito, o temporário é removido. Cancelamento e erro de renderização removem a saída parcial. Se o sistema encerrar o processo abruptamente, um temporário pode permanecer na cache até o Android a limpar.

Os plugins só aceitam origens na pasta privada `imports` e saídas geradas na pasta de cache `exports`. Não aceitam URLs remotos nem caminhos arbitrários.

## Validação num aparelho real

- Instalar o APK e importar um vídeo local. Ativar modo de avião antes de exportar.
- Exportar em Alta e Ultra e reproduzir na galeria. Confirmar imagem, áudio, duração e legibilidade das legendas.
- Repetir com vídeo vertical, horizontal, rotação de metadados, 30/60 fps, sem áudio e com AAC.
- Usar ficheiro longo para observar memória e aquecimento; testar espaço insuficiente.
- Cancelar durante a renderização e iniciar nova exportação.
- Android 8/9: cancelar a escolha do destino e usar “Tentar guardar novamente”.
- Confirmar que não aparece extensão WebM para um conteúdo MP4 e que a galeria não mostra ficheiro incompleto.
- Testar HDR e 4K separadamente: dependem do aparelho e não são garantidos pelo teste de fixture SDR em emulador.

## Limites de fidelidade

As palavras ativas são estimadas uniformemente dentro do tempo da legenda, não alinhadas por análise acústica. Fontes do sistema, medição de texto e quebra de linhas nativas podem diferir da prévia HTML. O projeto não inclui alinhamento forçado nem garantia de equivalência de todos os efeitos CSS.
