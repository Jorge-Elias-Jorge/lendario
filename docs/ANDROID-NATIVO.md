# Galeria Android, rascunhos e legendas

A interface React/Capacitor permanece híbrida. O plugin LegendarioMedia é Java nativo e integra MediaStore, permissões, pré-visualização e ficheiros privados.

## Galeria e pré-visualização
- Acesso total, parcial ou recusado, com re-seleção de permissões; não usa MANAGE_EXTERNAL_STORAGE.
- Listagem por páginas de até 24 itens, com miniaturas reduzidas em Android 10+.
- Toque no vídeo abre uma pré-visualização real: o plugin copia o vídeo para a cache e devolve um caminho reproduzível.
- A importação para o projeto só acontece após “Usar este vídeo”. “Cancelar” não importa nada.
- Limite temporário: confirmar a pré-visualização copia o vídeo novamente para o armazenamento privado. A cópia da cache é limpa na próxima pré-visualização.

## Rascunhos
- Gravação automática de texto, tempos, estilo e animação após 400 ms de inatividade; também ao sair do editor ou ocultar a aplicação.
- Rascunhos em JSON com AtomicFile; listagem, reabertura e eliminação.
- Projetos localStorage anteriores permanecem acessíveis para migração.

## Legendas
- Biblioteca com 30 estilos em nove categorias: Virais, Neon e luzes, Karaoke, Contorno forte, Minimalistas, Gradientes, Cinema, Glitch e 3D.
- Cor das letras e cor do contorno são configuráveis separadamente, com espessura ajustável.
- Modo “Frase” apresenta o texto numa só cor, sem acompanhar palavra por palavra.
- “Sem animação” está disponível em qualquer estilo.
- Os cartões de estilo e de animação movem-se na prévia para o usuário ver o efeito antes de escolher.
- A personalização está integrada na biblioteca de estilos; não há botão separado.

## Correção do SRT
- “Substituir legendas” limpa o texto anterior antes de aplicar o novo SRT.
- Cada legenda recebe um identificador novo e estável.
- Tempos inválidos e sobreposições são normalizados automaticamente.
- No editor, apenas a legenda mais recente de uma faixa sobreposta é mostrada, eliminando texto duplicado.
- O botão “Corrigir sobreposições” resolve conflitos de tempos num toque.

## Limites atuais
- A exportação não incorpora as novas animações nem preserva o áudio.
- Não há análise acústica nem alinhamento forçado.
- Configurações locais do Editor ainda não são recuperadas pelo rascunho.
- Fotos são apenas consultadas; não geram projetos de vídeo.
- Testes de dispositivo continuam necessários: permissões, pré-visualização, importação, espaço insuficiente, rotação de ecrã e recuperação de rascunhos.
