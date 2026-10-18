# Inventário de QA da sincronização

- Aba Sincronizar: disponível no editor real; não aparece na biblioteca de demonstração.
- Sem SRT: aviso e análise desabilitada.
- Navegador: aviso honesto de análise Android, sem reconhecimento simulado.
- Android: análise local com progresso, cancelamento e tratamento de ausência de áudio.
- Propostas: filtros, classificação, caixas de seleção, deslocamento, original/proposta, ouvir posição e aplicação explícita.
- Segurança: resultado desatualizado recusado, correspondência parcial não aplicada, seleção com colisão recusada.
- Persistência: tempos por palavra, proveniência e original sobrevivem ao rascunho; edição manual invalida tempos por palavra.
- Reversão: restaura tempos anteriores sem apagar texto atual.
- Arquivos: guardar SRT atual/original; cancelamento do seletor.
- Renderização: prévia e Android com limites por palavra desiguais e fallback para projeto antigo.
- Visual: desktop, 375 px, claro/escuro, cinco abas sem corte, textos longos e resultados.
- Exploratórios: frase repetida e SRT traduzido; áudio sem voz e vídeo sem faixa de áudio.

Registrar resultados efetivos no PR, separando testes com dados sintéticos e validação em aparelho físico.
