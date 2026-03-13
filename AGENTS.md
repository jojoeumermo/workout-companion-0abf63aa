# AGENTS.md

Este projeto é um aplicativo de treino de academia com IA integrado.

Objetivo do projeto:
Criar um aplicativo completo de acompanhamento de treino com rotinas, registro de séries, histórico, estatísticas e assistente de IA.

Todas as alterações feitas por agentes de IA devem respeitar as regras abaixo.

---

REGRAS IMPORTANTES

Nunca remover funcionalidades existentes.

Nunca alterar o fluxo principal de treino sem necessidade.

Sempre preservar dados do usuário.

Nunca apagar histórico de treinos.

Nunca remover o sistema FitAI Coach.

---

ARQUITETURA DO APP

O aplicativo possui os seguintes sistemas principais:

* rotinas de treino
* registro de séries (peso e repetições)
* histórico de treinos
* estatísticas e heatmap
* biblioteca de exercícios
* chat de IA (FitAI Coach)

Todas as alterações devem manter compatibilidade com esses sistemas.

---

SISTEMA DE TREINO

Fluxo correto do treino:

1. usuário seleciona rotina
2. usuário inicia treino
3. treino ativo é criado
4. séries são registradas
5. treino finalizado é salvo no histórico

Nunca alterar esse fluxo.

---

HISTÓRICO DE TREINOS

Cada treino salvo deve conter:

data
rotina utilizada
exercícios realizados
séries registradas
peso
repetições

Nunca apagar dados históricos.

---

BIBLIOTECA DE EXERCÍCIOS

A biblioteca deve conter exercícios com:

nome
grupo muscular
equipamento
imagem ou GIF

Novos exercícios podem ser adicionados, mas nunca remover os existentes.

---

FITAI COACH

O chat de IA deve permanecer funcional.

Ele deve conseguir:

analisar treinos
sugerir exercícios
sugerir progressão de carga
gerar rotinas

Nunca remover essa funcionalidade.

---

PRIORIDADES DE DESENVOLVIMENTO

1. corrigir bugs
2. melhorar performance
3. melhorar experiência de treino
4. adicionar novas funcionalidades

---

ALTERAÇÕES DE INTERFACE

Mudanças de design devem:

manter interface simples
manter modo dark
priorizar uso durante treino

---

TESTES OBRIGATÓRIOS

Após qualquer alteração verificar:

criar rotina
iniciar treino
registrar séries
finalizar treino
visualizar histórico
visualizar estatísticas

Nenhuma dessas funções pode quebrar.

---

OBJETIVO FINAL

Este aplicativo deve evoluir para um assistente inteligente de treino com:

registro completo de treinos
análise de progresso
biblioteca grande de exercícios
IA integrada
