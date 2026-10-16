# Estado real dos efeitos e sincronização

Este lote adiciona 12 receitas visuais originais e 12 movimentos de pré-visualização. Não inclui recursos proprietários do CapCut nem fontes comerciais. As fontes são resolvidas pelo dispositivo.

O painel Personalizar grava variações globais em localStorage. O estilo estendido, incluindo a animação recomendada, é serializado pelo botão Guardar já existente. Não há estilos individuais por cue neste lote. Posição horizontal, duração do efeito, modo e velocidade continuam locais ao editor e não persistem.

Os cartões são exemplos estáticos renderizados, não thumbnails de animação. Gradientes e brilho dependem do suporte CSS do WebView e precisam de teste no APK.

A temporização por palavra é uniforme e estimada. Não usa áudio. Alinhamento forçado requer modelo acústico português licenciado, inferência nativa (por exemplo ONNX Runtime), extração PCM em segmentos e algoritmo CTC com normalização/tokenização compatíveis. Sherpa-onnx oferecer ASR Android não implementa por si só este pipeline. Este projeto ainda não contém esses binários/modelos; não declarar sincronização acústica funcional.

O exportador atual não preserva áudio e não reproduz os novos efeitos. A implementação integral exige motor de composição partilhado, mux de áudio, cancelamento e testes reais de paridade preview/export. Este lote não altera o exportador nem o workflow APK.

Validação necessária: compilar APK, testar as 12 receitas e movimentos, guardar/reabrir variações, testar vídeos verticais/horizontais e suporte a gradientes no WebView. Não declarar estes testes executados apenas porque o commit foi enviado.
