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

## Resultados observados

- `npm run typecheck`, `npm run build` e 139 testes JavaScript aprovados.
- [Primeira execução Android](https://github.com/Jorge-Elias-Jorge/lendario/actions/runs/39094545220): 12 testes em cada emulador Android 8 e 10, zero falhas/erros. Relatórios XML descarregados e conferidos.
- Chromium real: aba Sincronizar com análise desabilitada e explicação correta no navegador; sem SRT, ambos os botões relevantes desabilitados. Sem erro JavaScript.
- UI com ponte de teste simulada: Worker e estado real do aplicativo exercitados com duas propostas prontas e uma não localizada; seleção parcial alterou apenas a primeira.
- SRT serializado refletiu horários corrigidos ou anteriores corretamente. Original e palavras sobreviveram ao rascunho e à reabertura; restauração recuperou os tempos anteriores.
- Filtro de não localizadas/revisão, seleção bloqueada para revisão, edição de SRT após análise, alerta de proposta desatualizada e botão Aplicar desabilitado verificados.
- Cancelamento, nenhuma palavra, erro de faixa de áudio e desmontagem da aba foram exercitados com a ponte simulada; exportação fica bloqueada enquanto a análise está ativa.
- Ouvir posição sugerida verificado com reprodução real do vídeo local: seek confirmado próximo de 1,65 s, sem aplicar a proposta.
- Desktop 1366×1000, 1366×540 e celular 375×812, temas claro/escuro, estados inicial/resultados/revisão inspecionados. Sem overflow horizontal medido; cinco abas e textos cabem.
- O seletor SAF de SRT e a qualidade acústica com voz humana no celular ainda exigem teste de usuário. A simulação UI não certifica os plugins nativos, e o teste nativo de reconhecimento não mede precisão em áudio humano.
