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
