# Galeria Android e rascunhos: lote inicial

A interface React/Capacitor permanece híbrida. O plugin LegendarioMedia é Java nativo e integra MediaStore, permissões e ficheiros privados.

## Incluído
- Acesso total/parcial/recusado e re-seleção de permissões; não usa MANAGE_EXTERNAL_STORAGE.
- Listagem de fotos e vídeos por páginas de até 24 itens, com thumbnails reduzidas em Android 10+.
- Importação de vídeo em streaming para ficheiro privado, sem upload e sem alterar o original. Requer espaço adicional equivalente ao vídeo escolhido.
- Rascunhos JSON nativos com AtomicFile e recuperação por identificador; listagem, abertura e eliminação.
- Autosave de texto SRT importado, tempos, estilo e animação do store após 400 ms de inatividade; gravação ao sair do editor ou ocultar a página, sem garantia absoluta contra morte imediata do processo.
- Projetos localStorage anteriores mantidos e disponíveis para migração ao voltar a escolher o vídeo.
- Build injeta o plugin e permissões depois de cap sync. Não substitui MainActivity se já contiver onCreate personalizado.

## Limites explícitos
- Fotos são apenas consultadas; não viram projetos de vídeo.
- Eliminar rascunho não elimina a cópia privada importada nesta primeira integração, para não apagar média indevidamente. É necessária gestão futura de cópias órfãs.
- Importação não tem cancelamento nem progresso percentual; a interface mostra estado ocupado. Sem integração de exportação nativa: exportação fica desativada para vídeos da biblioteca, em vez de fingir funcionar.
- Configurações locais do Editor (horizontal, duração, modo por palavra, velocidade) ainda não estão no store e não são recuperadas. O SRT original bruto não é preservado separadamente do texto parseado.
- Permissão só é solicitada após o utilizador tocar na explicação da primeira abertura ou na galeria, não durante a instalação.
- Modelos de alinhamento forçado/IA e catálogo com mais de 100 animações reais continuam não implementados. Não contam como parte funcional deste lote.
- Sem migração para Kotlin/Compose e sem alteração de CaptionDesigner, biblioteca de estilos ou lógica de efeitos.

## Testes necessários no APK
Negar/permissão parcial/permissão total, revogar permissão, voltar à aplicação, carregar páginas, importar vídeo grande e ficheiro incompatível, espaço insuficiente, guardar/reabrir após terminar processo, apagar rascunho, migrar projeto antigo. Testar Android 12, 13 e 14+. Não declarar testes nativos executados antes de compilar e correr no dispositivo.
