# Inventário de QA do editor reorganizado

## Fluxos a verificar

- Home: novo projeto, projetos recentes reais, pesquisa, eliminar com confirmação, biblioteca de demonstração, tema.
- Importação Android: negada, permitida e parcial; miniaturas Android 8/9 e 10+; carregar mais sem duplicar, pesquisa no conjunto carregado, vazio, erro.
- Importação: selecionar, reproduzir, escolher outra mídia, confirmar uma única vez e só então entrar no editor. Mídias inválidas e falta de espaço não devem criar projeto fictício.
- Editor: prévia proporcional em retrato/paisagem, reprodução/pausa, recuar/avançar, scrub, velocidade só de prévia.
- Ferramentas: Texto, Estilos, Animações, Ritmo e Sincronizar abrem apenas o respectivo painel. Fechar, Escape, foco e retorno ao acionador.
- Timeline: abaixo dos botões, faixas vídeo/CC, blocos por tempo, playhead, scroll horizontal independente, zoom, seleção/edit, legendas fora da duração visíveis para revisão.
- SRT: acionador abaixo da timeline; arquivo/colar, validação, preservar texto ao fechar sem aplicar, confirmação de substituição, adicionar, limpar, estado vazio.
- Exportação: botão no cabeçalho, qualidade em painel próprio, prévia não altera qualidade exportada, guardado local e recuperação de falhas preservados.
- Persistência: salvar/reabrir ajustes e tempos por palavra, biblioteca não sobrescreve rascunho, falha de gravação visível.
- Sandbox: prévia temporária explicitamente identificada quando armazenamento persistente é bloqueado; aplicativo Android mantém arquivos locais.
- Visual: 375×812, 375×667, desktop 1366×900, janela curta 1366×540, paisagem móvel; claro/escuro, redução de movimento e textos longos.
- Exploratórios: SRT inválido, vídeo sem suporte, permissão negada, miniatura indisponível, cancelar confirmação e mudança rápida de categoria.

Este inventário não é declaração de aprovação. Registrar os resultados efetivos e distinguir ponte simulada, navegador real, emulador e aparelho físico.

## Resultados efetivos em 18/10/2026

- **Código verificado:** `c673d0f89d31bdb327d4b0fe7b3e2a49d547ee8c`. TypeScript, build Vite e 168 testes JavaScript aprovados. Ver [execução Android e regressões](https://github.com/Jorge-Elias-Jorge/lendario/actions/runs/39097435244).
- **Chromium real:** novo projeto, arquivo local, prévia com confirmação, importação SRT por texto e arquivo, SRT inválido sem substituir, cancelamento da substituição, adição ao fim e preservação do texto do painel ao fechar.
- **Editor:** painéis Texto/Estilos/Animações/Ritmo/Sincronizar abertos e fechados; Escape e foco dentro do diálogo. Edição de texto, navegação entre legendas, busca de estilos, aplicar/remover animação, alteração e retorno do ritmo e velocidade, reprodução/pausa, avanço/recuo e zoom exercitados.
- **Persistência:** projeto reaberto recuperou três legendas e ajustes. Alterar um estilo na biblioteca de demonstração não sobrescreveu o estilo do projeto guardado. Pesquisa sem resultado e mídia inválida/danificada também foram verificadas, sem criar projeto fictício.
- **Exportação WebM:** arquivo gerado e descarregado por controles reais, com VP8/Opus, dimensões 240×320 e 133244 bytes. Este é um fixture curto, não um ensaio de carga com vídeo longo.
- **Galeria com ponte simulada:** permissão inicialmente negada, autorização explícita, acesso parcial, busca, alternância Vídeos/Fotos, fotos não importáveis, reprodução real do fixture de prévia e retorno à galeria sem importar. A miniatura apresentada no ensaio foi extraída do fixture real. A simulação valida a interface, não a permissão do sistema Android nem uma biblioteca MediaStore real.
- **Responsividade:** inspeção em 375×812, 375×667, 1366×900, 1366×540 e paisagem 812×375. Retrato e janela desktop curta mantiveram ferramentas, timeline e SRT visíveis; paisagem muito baixa permite rolagem para alcançar SRT sem corte permanente. Painéis usam rolagem interna.
- **Contraste:** rótulos secundários medidos no editor: mínimo 6,42:1 em escuro e 5,03:1 em claro; blocos de legenda medidos acima de 5:1 em claro. Isto não equivale a certificação global de acessibilidade.
- **Sandbox de produção:** build estático executado em iframe com origem opaca, sem acesso ao armazenamento persistente. Home e seleção de mídia abriram sem erro e o aviso de rascunhos temporários apareceu. O servidor Vite de desenvolvimento não serve para este ensaio, pois depende de módulos de desenvolvimento.
- **Verificações negativas:** nenhum erro JavaScript de página nos fluxos principais; nenhum overflow horizontal em 375 px. Mídia incompatível no seletor de navegador bloqueou a confirmação. Miniatura ausente apresenta fallback explícito.
- **Android 8/API 26:** 14 testes instrumentados, zero falhas/erros, incluindo miniatura local real, falha de miniatura sem inventar imagem, renderização com áudio/sem áudio, composição e reconhecimento português sem INTERNET no APK alvo de testes.
- **Android 10/API 29:** 14 testes instrumentados aprovados, zero falhas/erros/skips; exportação e miniaturas aprovadas. Workflow completo concluído com sucesso.

## Limites da validação

Não foi utilizado aparelho físico do usuário. O fluxo completo da galeria MediaStore, permissões recentes do Android, vídeos longos/grandes, falta real de armazenamento, interrupção do processo e codecs específicos de fabricantes precisam de teste no dispositivo. O modelo e as fontes foram encontrados no APK compilado, mas a precisão da sincronização com a narração real do usuário continua sem garantia.
