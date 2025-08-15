# 📋 PLANO DE AÇÃO: MELHORIAS DA ÁREA DO ADMINISTRADOR

## 🎯 Objetivo Principal
Implementar uma área de administração robusta e intuitiva para gerenciar usuários, planos Premium e moderar o conteúdo da comunidade ("Resenha"), garantindo um ambiente seguro e bem administrado.

## 📝 Instruções Gerais
- Este documento servirá como um registro do progresso.
- Cada etapa será implementada de forma incremental.
- A aprovação ("OK") do cliente será aguardada antes de prosseguir para a próxima grande funcionalidade.
- A implementação não removerá ou alterará a ordem das funcionalidades existentes para o usuário final.

---

## 📌 Etapas de Implementação

### **Fase 1: Estrutura e Gerenciamento de Usuários**

- [x] **1.1: Criação da Estrutura do Painel ADM**
    - [x] Criar um novo componente `AdminDashboard.tsx`.
    - [x] Adicionar um botão de acesso no `Header.tsx`, visível apenas para administradores.
    - [x] Implementar a lógica de troca de visualização no `App.tsx` para mostrar o painel ADM.
    - [x] O painel terá uma visão geral (dashboard) e abas para as diferentes seções.

- [x] **1.2: Visualização de Usuários**
    - [x] Criar um componente `UserManagementTable.tsx`.
    - [x] Listar todos os usuários registrados em uma tabela com informações: Avatar, Nome, Email, Data de Cadastro, Status Premium.
    - [x] Adicionar funcionalidades de busca e paginação na tabela de usuários.

- [x] **1.3: Ações de Gerenciamento de Usuário**
    - [x] Implementar um modal para visualização de detalhes completos do usuário (`UserDetailsModal.tsx`).
    - [x] Adicionar botão de "Deletar Usuário" com caixa de confirmação.
    - [x] Adicionar funcionalidade para "Autorizar" novos usuários (se houver um fluxo de aprovação).

### **Fase 2: Gerenciamento de Planos e Comunicação (Integrado)**

- [x] **2.1: Interface de Gerenciamento de Planos (Integrada)**
    - [x] A funcionalidade foi integrada diretamente no modal de 'Detalhes do Usuário' para um fluxo de trabalho mais eficiente. A aba separada de "Planos" foi removida.

- [x] **2.2: Ações de Plano Premium e Notificações (Integrado)**
    - [x] Adicionada seção no modal do usuário para conceder acesso Premium por dias específicos (com campo customizado e botões rápidos) ou vitalício.
    - [x] Botão para revogar acesso Premium implementado diretamente no perfil do usuário.
    - [x] Adicionada funcionalidade para enviar notificações diretas para o usuário através do painel, que aparecerão em seu sino de notificações.

### **Fase 3: Moderação de Conteúdo ("Resenha")**

- [x] **3.1: Feed de Moderação**
    - [x] Criar um componente `ContentModeration.tsx`.
    - [x] Exibir todas as postagens da "Resenha" em um feed, com informações do autor.
    - [x] Adicionar filtros para visualizar posts por categoria (Vitória, Estratégia, etc.) ou por status (Pendentes, Aprovados).

- [x] **3.2: Ações de Moderação**
    - [x] Adicionar um botão "Deletar Postagem" para remover conteúdo impróprio.
    - [x] Adicionar um sistema de "flags" ou denúncias, onde posts reportados por usuários aparecem em uma fila prioritária para moderação (Funcionalidade Avançada).

### **Fase 4: Finalização e Dashboard Analítico**

- [x] **4.1: Dashboard de Visão Geral**
    - [x] Criar um novo componente `DashboardOverview.tsx`.
    - [x] Adicionar gráficos de crescimento de usuários e de distribuição de planos (Premium vs. Grátis).
    - [x] Implementar um feed de atividades recentes (novos usuários, novas postagens).
    - [x] Definir a "Visão Geral" como a aba padrão para fornecer insights imediatos ao administrador.

### **Fase 5: Moderação Assistida por IA**

- [x] **5.1: Implementação da Fila de Revisão**
    - [x] Adicionado um botão "Analisar com IA" na aba de Moderação.
    - [x] Ao clicar, o sistema envia as postagens recentes para a IA Gemini para análise de conteúdo (spam, assédio, etc.).
    - [x] Uma nova seção "Fila de Revisão da IA" aparece acima da lista principal, mostrando apenas as postagens sinalizadas pela IA, o motivo e ações rápidas.

### **Fase 6: Ferramentas de Análise e Dados**
- [x] **6.1: Filtros Avançados na Tabela de Usuários**
  - [x] Implementados filtros por status de assinatura (Premium/Grátis), nível de atividade (nº de posts) e data de cadastro.
  - [x] Adicionada coluna "Posts" para visualização rápida da atividade.

- [x] **6.2: Painel de Saúde do Sistema**
  - [x] Criada nova aba "Sistema".
  - [x] Implementado componente `SystemHealth.tsx` com dados simulados de uso de API e log de erros.

### **Fase 7: Comunicação e Engajamento em Massa**
- [x] **7.1: Ferramenta de Notificação em Massa**
  - [x] Criada nova aba "Comunicação".
  - [x] Implementado componente `MassNotificationSender.tsx` para enviar mensagens a grupos de usuários (Todos, Premium, Grátis).
  - [x] Ação é registrada no log de auditoria.

### **Fase 8: Segurança e Controle**
- [x] **8.1: Log de Auditoria**
  - [x] Criada nova aba "Auditoria".
  - [x] Implementado componente `AuditLog.tsx` para exibir um registro de todas as ações administrativas.
  - [x] Lógica de registro de ações (concessão de premium, exclusão de posts, etc.) implementada no `AdminDashboard.tsx`.
  - [x] Log é persistido no `localStorage`.
  
### **Fase 9: Central de Sinais Manuais**
- [x] **9.1: Criação do Painel de Envio de Sinais**
    - [x] Adicionada nova aba "Sinais Manuais" no painel de administrador.
    - [x] Implementado componente `ManualSignalSender.tsx` com botões para enviar sinais de "Vela Alta", "Grande Pague" e "Alerta de Risco".
    - [x] Adicionada funcionalidade para retirar um sinal ativo.
    - [x] Implementado um histórico de sinais enviados persistido no `localStorage`.
    - [x] Ações de envio e retirada são registradas no log de auditoria.

- [x] **9.2: Banner de Alerta para Usuários**
    - [x] Criado componente `AdminSignalBanner.tsx` que aparece no topo da tela para todos os usuários.
    - [x] Banner é `sticky` e pode ser dispensado pelo usuário.
    - [x] O banner possui cores e animações distintas para cada tipo de sinal (Azul para Vela Alta, Dourado para Grande Pague, Vermelho para Risco).
---

🛑 **IMPORTANTE:** Após completar cada etapa, **aguarde o comando `OK` do usuário para continuar a próxima**.