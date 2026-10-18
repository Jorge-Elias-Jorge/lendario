# Estúdio de legendas do LEGENDÁRIO

## Catálogo

São 105 estilos: os 33 existentes e 72 novas receitas originais. Há 99 animações: as 33 existentes e 66 novas receitas. As receitas combinam 27 tipos implementados, incluindo ausência de movimento e a compatibilidade Mask/Reveal, com sete unidades de aplicação.

- **Famílias visuais:** Shorts/Reels, marcadores, caixas/cartões, podcasts, cinema/documentário, gaming/tecnologia, editorial/educação, retro/criativas e karaoke progressivo, além das categorias anteriores.
- **Tratamentos:** caixa por linha ou bloco, opacidade, cantos arredondados, contorno, letras vazadas, extrusão 2D, gradiente, sombra, brilho, marcador, pílula, moldura, sublinhado, cor e ampliação da palavra ativa.
- **Movimentos:** fade, zoom, pop, bounce, slide nas quatro direções, revelação, rotação, elasticidade, impacto, pulso, luz, tremor, glitch determinístico, flutuação, onda, piscar, digitação, flip 2D, desfoque, esticar, balanço, espaçamento, órbita, rolagem e compressão.
- **Camadas:** entrada, saída, contínua, palavra, letra, linha e destaque. Escolher uma nova animação numa camada não elimina as restantes. Duração, intensidade e curva são editáveis; cada camada pode ser removida.

Não se afirma que estas sejam “todas as animações existentes” nem que o catálogo reproduza todos os modelos pagos de outras aplicações. São receitas próprias inspiradas em convenções visuais públicas, sem pacotes proprietários, marcas d’água, estilos pessoais de criadores ou material obtido por extração de aplicativos.

## Referências de linguagem visual

O guia público do [CapCut sobre legendas animadas](https://www.capcut.com/resource/animated-subtitle) descreve fades, pops, slides, brilho e ênfase de palavras. A documentação do [Descript sobre animação de texto](https://help.descript.com/effects-animations-transitions/text-animations) descreve entrada/saída, desfoque, escala, rotação e unidades por palavra, linha e caractere.

Estas referências orientam famílias de efeitos, não comprovam uma classificação das legendas “mais usadas”. Nenhum dado de mercado ou ranking de popularidade foi presumido.

## Fontes offline e licenças

O aplicativo inclui Manrope, Anton, Bebas Neue, Barlow Condensed, Libre Baskerville e Space Mono. Os ficheiros e suas licenças SIL OFL estão em `public/fonts`; são copiados para o APK durante o build e não são descarregados ao exportar. Manrope e Libre Baskerville usam variação de peso; as demais incluem o desenho/peso do ficheiro distribuído, com possíveis variações sintéticas do renderizador.

As fontes são carregadas pelo Canvas na prévia e por `Typeface.Builder` no Android. Rasterização, itálico sintético e métricas podem diferir entre WebView e Android; não se promete equivalência pixel a pixel.

## Prévia, exportação e rascunhos

A prévia do editor e o exportador WebM usam `drawCaption`. A exportação MP4 usa o correspondente nativo `LegendarioCaptionOverlay`, com os mesmos campos de estilo e fórmulas de movimento.

`animationTracks` fica dentro do estilo e é guardado com o rascunho. Posição horizontal, palavras por bloco, apresentação e duração também são persistidas; rascunhos antigos continuam a resolver `defaultMotion`. A recuperação é atómica para não substituir as camadas guardadas por uma animação de interface.

A biblioteca pode ser explorada sem vídeo, a partir da página inicial. A entrada nesse modo guarda e desassocia o rascunho atual antes de permitir experiências, para não substituir o projeto anterior.

## Limites

- Os tempos por palavra/letra são estimados uniformemente dentro de cada legenda. Não foi acrescentada transcrição, reconhecimento de voz ou alinhamento acústico automático.
- Flip e extrusão são tratamentos 2D, não modelos 3D ou física de partículas.
- Os efeitos não incluem filmagens, stickers, animações proprietárias ou sons de terceiros.
- A indicação de máximo de linhas é uma meta de ajuste de tamanho, não um corte de texto. Texto muito longo pode precisar de ser dividido em legendas menores.
- Caracteres são separados por code points; sequências de emoji com ZWJ e certos sinais combinantes não têm garantia de animação como um único grafema.
- O suporte a codecs, 4K e HDR permanece dependente do aparelho. Manter o aplicativo aberto durante a exportação.
- O APK debug original do estúdio usa `com.legendario.editor.studio` e o nome “LEGENDÁRIO Studio teste”. A etapa seguinte de sincronização usa `.sync` e “LEGENDÁRIO Sync teste”, também para instalação paralela. Não migram rascunhos automaticamente nem substituem o aplicativo anterior. A versão release mantém o identificador original.

## Testes

`npm test` valida catálogo, fontes/licenças, todas as receitas de movimento, camadas, ciclos, tempos futuros, recuperação legada e o fluxo de exportação anterior. `catalog:fixtures` gera 1.296 vetores de movimento para comparação numérica entre JavaScript e Java.

Os testes instrumentados verificam as fórmulas, desenham todas as receitas com fontes incluídas e exportam uma composição de estúdio para MP4. A execução usa um APK alvo sem permissão `INTERNET`, além dos testes anteriores de áudio, rotação e armazenamento. Executar o workflow manual de build para validar também Android 8 e Android 10.
