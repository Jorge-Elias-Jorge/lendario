# Sincronização inteligente offline: primeira versão

## O que está implementado

Na aba **Sincronizar**, o APK Android analisa a primeira faixa de áudio do vídeo importado localmente. MediaExtractor e MediaCodec descodificam o áudio em fluxo, fazem downmix para mono e alimentam o reconhecedor Vosk com a frequência real do PCM. O modelo português é incluído no APK e preparado no armazenamento privado na primeira utilização. Nenhum áudio é enviado a servidores; não há microfone, API de nuvem, chave ou download durante a análise.

O modelo é obtido apenas durante a compilação, com SHA-256 fixado e licença incluída. O [Vosk documenta suporte a reconhecimento offline no Android](https://alphacephei.com/vosk/android), e o [catálogo oficial identifica o modelo pequeno português, a licença Apache 2.0 e suas limitações de reconhecimento](https://alphacephei.com/vosk/models). As dependências Android Vosk e JNA estão fixadas nas versões do [exemplo oficial Android](https://github.com/alphacep/vosk-android-demo/blob/master/app/build.gradle).

## Comparação com o SRT

- Preserva a ordem do arquivo SRT e os tempos importados, inclusive sobreposições. Não “conserta” o arquivo antes da análise acústica.
- Compara a sequência original de palavras com as palavras reconhecidas, usando correspondência exata após normalização de acentos, pontuação e caixa.
- Usa LCS monotônico global, sem limitar a busca à janela temporal antiga. Corrige atrasos/adiantamentos diferentes por legenda, se a correspondência for suficiente.
- A comparação roda num Web Worker. Há limite de 12 milhões de células para evitar consumo quadrático ilimitado em celulares.
- Marca como pronta somente uma legenda com pelo menos três palavras, cobertura de 100%, escore médio mínimo 0,85, confiança mínima por palavra 0,65, sem pausas longas e sem frase idêntica repetida.
- Frases curtas, parciais, repetidas ou incertas exigem revisão manual e não são aplicadas pelo botão de seleção. Ausência de fala ou correspondência não gera tempos inventados.
- A confiança de ASR não é calibrada como probabilidade de alinhamento correto. Os limiares são heurísticos e não representam certificação de precisão.
- Mostra horários antigos e propostos, tamanho/direção do deslocamento, cobertura e motivo da classificação. O botão de ouvir salta para a posição proposta; a legenda na prévia mantém os tempos atuais até aplicar.
- Não aplica nada automaticamente. A seleção é validada novamente contra o estado atual e contra sobreposições com legendas vizinhas.

## Persistência, reversão e exportação

O APK de teste desta etapa usa identificador `.sync` e nome **LEGENDÁRIO Sync teste**, separado do APK Studio anterior. Isso evita exigir desinstalação ou substituir rascunhos de outra assinatura debug. O aplicativo novo não importa automaticamente os dados privados de outra instalação: escolha novamente o vídeo e o SRT de teste, preservando os aplicativos antigos.

Aplicar altera apenas os tempos selecionados e adiciona os tempos por palavra. O primeiro conjunto de tempos originais fica guardado dentro de cada legenda no rascunho; reanalisar não apaga essa referência. Restaurar recupera os tempos anteriores, preservando o texto atual. Alterações manuais no texto/início/fim invalidam os tempos por palavra para evitar karaoke desatualizado.

A prévia Canvas e a sobreposição Java da exportação MP4 usam os tempos por palavra quando a sequência completa é válida; projetos antigos e metadados inválidos usam a divisão uniforme anterior. O movimento de letras é distribuído dentro da palavra, não localizado por fonema. O formato SRT continua contendo apenas início/fim por legenda, enquanto os tempos por palavra ficam no projeto.

Guardar SRT atual e SRT original usa o seletor de arquivos local Android em UTF-8. O navegador não executa reconhecimento: informa a limitação e permite guardar o SRT e revisar projetos.

## Limites explícitos desta entrega

Esta é uma **primeira implementação de reconhecimento e correspondência textual**, não um alinhador fonético forçado como o [WhisperX](https://github.com/m-bain/whisperX). Não é uma integração de Whisper nem um sistema de precisão absoluta.

O modelo leve português publicado tem taxas de erro de palavras elevadas nos conjuntos indicados pelo [catálogo Vosk](https://alphacephei.com/vosk/models): 68,92 no CORAA dev e 32,60 no CV test. Esses números não são precisão de sincronização e não foram medidos pelo LEGENDÁRIO. Fala clara, texto próximo da narração e revisão humana são importantes; sotaques moçambicanos, ruído, música, nomes e números podem resultar em poucas propostas aplicáveis.

Não há expansão de números, tradução, identificação de locutores ou seleção de outra faixa de áudio. Duas vozes simultâneas, frases fora da ordem e conteúdo diferente do SRT podem impedir o alinhamento. A duração máxima atual é 30 minutos; o limite de comparação pode exigir trechos menores.

O modelo ocupa cerca de 31 MB comprimido e 52 MB extraído nesta versão. O aplicativo exige 100 MB livres na primeira preparação, além do espaço do vídeo e do APK; modelos pequenos Vosk normalmente precisam de cerca de 300 MB de memória em execução segundo a [documentação do fornecedor](https://alphacephei.com/vosk/models). Testar com narrações reais no celular continua necessário.

## Validação

Os testes JavaScript cobrem deslocamentos independentes, acentos, texto ausente, silêncio, repetição, baixa confiança, pausas, limites de recursos, seleção, original preservado, reversão, propostas desatualizadas, sobreposições, alteração manual e tempos por palavra não uniformes.

Os testes instrumentados Android exercitam reconhecimento do modelo incluído, descodificação AAC 48 kHz estéreo com silêncio inicial, ausência de faixa de áudio, cancelamento e uso de tempos não uniformes na sobreposição Java. A fala do fixture é sintética; o teste é de funcionamento e integridade temporal, não um benchmark de precisão em narração humana.

Consultar o PR e as execuções de CI para os resultados observados; este documento não declara aprovação de uma execução ainda pendente.
