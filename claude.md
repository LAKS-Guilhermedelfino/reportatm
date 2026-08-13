# PROMPT PARA CLAUDE CODE — Sistema de Report Comercial (LAKS)

> Cole este arquivo inteiro no Claude Code como primeira mensagem do projeto.
> Sugestão: salve-o também como `CLAUDE.md` na raiz do repositório para que o contexto persista entre sessões.

---

## 0. INSTRUÇÕES DE EXECUÇÃO PARA VOCÊ, CLAUDE CODE

Antes de escrever qualquer código:

1. Leia este documento inteiro.
2. Crie um `PLAN.md` na raiz com o plano de implementação dividido nas fases da seção 12, e me mostre antes de começar.
3. Trabalhe **fase por fase**. Ao final de cada fase, rode `npm run build`, `npm run lint` e os testes, e só então siga para a próxima.
4. Nunca invente dados de negócio: se algo não estiver especificado aqui, pergunte antes de assumir.
5. Todo texto de interface é em **português do Brasil**. Código, nomes de variáveis, tabelas e commits em **inglês**.
6. Escreva `CLAUDE.md` com as convenções do projeto e mantenha atualizado.

---

## 1. CONTEXTO DE NEGÓCIO

A LAKS Company é uma assessoria de marketing e vendas para corretoras de plano de saúde no Brasil. Uma das clientes tem um time de **consultoras comerciais** (vendedoras) que hoje enviam, todo dia, um report manual por WhatsApp neste formato:

```
📊 RESUMO COMERCIAL DO DIA
CONSULTORA Andressa
▫️ Leads novos recebidos: 3
▫️ Contatos com leads novos: 3
▫️ Leads antigos contatados: 6
▫️ Leads antigos que responderam: 2
▫️ Follow-ups que chamei/liguei: 17
▫️ Follow-ups que responderam/atenderam: 5
▫️ Ligações realizadas: 35
▫️ Ligações atendidas: 5
▫️ Call: 2
▫️ Cotações enviadas: 4
▫️ Negociação em andamento: 2
▫️ Processos lançados no sistema:
▫️ Vendas fechadas: 1 R$1.879,36
```

**Problemas do modelo atual:** dado solto em conversa de WhatsApp, sem histórico consolidado, sem comparação entre consultoras, sem comparação com meta, e sem forma de enxergar em que etapa do funil cada consultora está travando.

**O que o sistema precisa resolver:** substituir o WhatsApp pelo preenchimento estruturado, consolidar por consultora e por time, e — este é o objetivo central — **apontar automaticamente o que não está sendo cumprido**: metas não atingidas, etapas do funil com conversão fora do padrão, dias sem preenchimento e quedas de performance.

**Usuário principal do painel:** o gestor (eu). **Usuárias do formulário:** as consultoras.

---

## 2. OBJETIVO DO SISTEMA (em uma frase)

Um app web onde cada consultora preenche seu report comercial diário, e o gestor cadastra consultoras e metas manuais, acompanha relatórios individuais e do time nos recortes **diário, semanal, quinzenal e mensal**, e recebe um **diagnóstico automático dos pontos não cumpridos**.

---

## 3. STACK OBRIGATÓRIA

- **Next.js 15** (App Router, TypeScript, Server Components por padrão)
- **Supabase** — Postgres + Auth + Row Level Security
- **Tailwind CSS** + **shadcn/ui** como base de componentes
- **Recharts** para gráficos
- **date-fns** (com `date-fns-tz`) para datas — timezone fixo `America/Sao_Paulo`
- **Zod** para validação de schemas (compartilhada entre client e server)
- **React Hook Form** para formulários
- **Vitest** para testes unitários das regras de cálculo
- Deploy alvo: **Vercel**

Regras técnicas:

- Migrations do banco versionadas em `supabase/migrations/` (SQL puro). Nada de alteração manual pelo dashboard.
- Toda escrita passa por **Server Actions** com validação Zod no servidor. Nunca confie no client.
- RLS habilitado em todas as tabelas, sem exceção.
- Variáveis sensíveis em `.env.local`, com `.env.example` comitado.

---

## 4. IDENTIDADE VISUAL — LAKS COMPANY

Extraído do Manual de Marca oficial. **Siga à risca.**

### 4.1 Paleta

| # | Nome | HEX | RGB | Uso |
|---|------|-----|-----|-----|
| 01 | Digital Orange | `#FF4200` | 255 66 0 | Cor primária. Ações, destaques, dados em foco, estado ativo. Usar com moderação — é acento, não fundo de tela. |
| 02 | Anti-Flash White | `#ECECEC` | 236 236 236 | Texto principal sobre fundo escuro; fundo de tela no tema claro. |
| 03 | Grey | `#B5B5B5` | 181 181 181 | Texto secundário, labels, bordas, eixos de gráfico. |
| 04 | Raisin Black | `#0D0900` | 13 9 0 | Fundo principal (tema escuro); texto sobre fundo claro. |

**O tema padrão da aplicação é escuro**: fundo `#0D0900`, texto `#ECECEC`, acento `#FF4200`. Implemente também o tema claro (fundo `#ECECEC`, texto `#0D0900`), alternável, mas o escuro é o default.

Superfícies intermediárias no tema escuro (derivadas, para cards e elevação): `#161210`, `#1F1A18`, `#2A2422`. Bordas: `rgba(236,236,236,0.10)`.

**Cores funcionais** (a marca não tem verde/vermelho — use apenas em indicadores de status, nunca como elemento decorativo):

- Sucesso / meta atingida: `#22C55E`
- Atenção / meta em risco: `#F5A524`
- Crítico / meta não atingida: `#EF4444`
- Neutro / sem dado: `#B5B5B5`

**Acessibilidade obrigatória:** texto sobre `#FF4200` deve ser `#0D0900` (contraste 5,7:1 — aprovado). **Nunca use branco sobre o laranja**: fica em 3,5:1 e reprova. `#FF4200` sobre `#0D0900` também está em 5,7:1 e pode ser usado em texto. Contrastes já verificados: `#ECECEC` sobre `#0D0900` = 16,8:1; `#B5B5B5` sobre `#0D0900` = 9,7:1. Todo texto de corpo precisa atingir no mínimo 4,5:1 — valide qualquer cor nova que você introduzir.

### 4.2 Tipografia

- **Títulos, números grandes e KPIs:** `Neuething Sans` (arquivos `.ttf` em `LAKS COMPANY [IDV]/Documents font/Neuething/`). **Exclusivamente em CAIXA ALTA** — é regra do manual de marca. Use os pesos SemiBold Expanded / SemiBold SemiExpanded.
- **Texto corrido, formulários, tabelas:** `Helvetica Neue` (arquivos `.otf` em `LAKS COMPANY [IDV]/Documents font/Helvetica-neue/`), pesos Regular / Medium / Bold.
- Carregue via `next/font/local` a partir de `/public/fonts`. Fallback: `Inter, system-ui, -apple-system, sans-serif`.
- Se houver dúvida de licenciamento para web, use `Archivo Expanded` (títulos) e `Inter` (texto) como substitutas — mas mantenha a regra de caixa alta nos títulos.

### 4.3 Logo

Arquivos em `LAKS COMPANY [IDV]/Versões da Marca/`. Use a **versão principal horizontal clara** sobre o fundo escuro e a versão escura sobre fundo claro. Símbolo isolado no favicon e no menu recolhido.

**Área de segurança:** margem mínima de 1x (a altura do símbolo) em torno da marca — nada pode invadir esse espaço. Redução mínima: 10mm de largura para a versão horizontal.

### 4.4 Linguagem visual

Ângulos de ascensão, cantos levemente arredondados (`border-radius` 8px em cards, 6px em botões, 4px em inputs), layout limpo e funcional. Conceitos da marca: performance, precisão, dinamismo, equilíbrio. Nada de gradientes espalhafatosos, sombras pesadas ou ícones coloridos aleatórios — ícones monocromáticos (`lucide-react`) em `#B5B5B5`, virando `#FF4200` no estado ativo.

Crie um arquivo `src/styles/tokens.css` com todas as cores como CSS custom properties e configure o `tailwind.config.ts` para consumi-las. Nenhum hex solto no meio dos componentes.

---

## 5. PERFIS DE USUÁRIO

| Perfil | Permissões |
|--------|-----------|
| **admin** (gestor) | Tudo: cadastra empresas e consultoras, define metas, vê todos os relatórios, edita reports de qualquer data, exporta. |
| **gestora** (líder da corretora cliente) | Vê e edita apenas dentro da sua empresa. Cadastra consultoras e metas da sua empresa. |
| **consultora** | Preenche e edita o próprio report do dia. Vê apenas o próprio histórico, as próprias metas e o próprio desempenho. Não vê dados das colegas. |

Autenticação: Supabase Auth com e-mail + senha. Convite de consultora feito pelo admin/gestora (gera link de primeiro acesso). Sem cadastro público.

**Multi-tenant desde o início:** toda tabela de dados carrega `company_id`. A LAKS atende dezenas de corretoras e este sistema tende a ser replicado — não comece single-tenant.

---

## 6. MODELO DE DADOS

Crie as migrations correspondentes. Toda tabela tem `id uuid primary key default gen_random_uuid()`, `created_at`, `updated_at`.

### `companies`
`name`, `slug`, `active boolean default true`

### `profiles` (1:1 com `auth.users`)
`company_id`, `full_name`, `email`, `role` (`admin` | `gestora` | `consultora`), `active boolean default true`, `started_at date`

### `daily_reports`
Um registro por consultora por dia. **Constraint única: `(consultant_id, report_date)`.**

`company_id`, `consultant_id` (FK profiles), `report_date date`, `filled_at timestamptz`, `filled_by` (FK profiles — para saber se foi a consultora ou o gestor que lançou), `notes text`

Campos numéricos (todos `integer not null default 0`, com `check (valor >= 0)`):

**Bloco 1 — Leads**
- `new_leads_received` — Leads novos recebidos
- `new_leads_contacted` — Contatos com leads novos
- `old_leads_contacted` — Leads antigos contatados
- `old_leads_replied` — Leads antigos que responderam

**Bloco 2 — Follow-ups por temperatura** *(campo novo, substitui o "Follow-ups que chamei/liguei" agregado)*
- `followup_cold_done` / `followup_cold_replied`
- `followup_warm_done` / `followup_warm_replied`
- `followup_hot_done` / `followup_hot_replied`

> Total de follow-ups e total de respostas são **calculados**, nunca armazenados.
> Defina na UI o critério de temperatura (texto de ajuda no formulário):
> **Frio** = sem interação há mais de 30 dias ou nunca respondeu. **Morno** = respondeu ou interagiu nos últimos 30 dias, sem proposta em aberto. **Quente** = tem cotação/proposta em aberto ou reunião marcada.

**Bloco 3 — Ligações**
- `calls_made` — Ligações realizadas
- `calls_answered` — Ligações atendidas

**Bloco 4 — Reuniões** *(campos novos)*
- `meetings_scheduled` — Reuniões agendadas
- `meetings_held` — Reuniões realizadas (equivale ao "Call" do report antigo)

**Bloco 5 — Comercial**
- `quotes_sent` — Cotações enviadas
- `negotiations_open` — Negociação em andamento
- `proposals_submitted` — Propostas lançadas no sistema
- `sales_closed` — Vendas fechadas (quantidade)
- `sales_amount_cents bigint not null default 0` — Valor total vendido **em centavos** (nunca use float para dinheiro)

### `goals`
Metas manuais, definidas pelo gestor. Permitir meta por consultora **e** meta padrão da empresa (quando `consultant_id` é nulo, vale como fallback para quem não tem meta própria).

`company_id`, `consultant_id` (nullable), `period_type` (`monthly` | `biweekly` | `weekly` | `daily`), `period_start date`, `period_end date`

Campos de meta (`integer`, nullable — nulo significa "sem meta para este indicador"):
- `goal_followup_cold`
- `goal_followup_warm`
- `goal_followup_hot`
- `goal_calls_made`
- `goal_meetings_scheduled`
- `goal_meetings_held`
- `goal_proposals_submitted`
- `goal_sales_closed`
- `goal_sales_amount_cents bigint`

Constraint: sem sobreposição de períodos para a mesma consultora e mesmo `period_type`.

### `business_days`
Configuração de dias úteis por empresa, para o cálculo de ritmo (pacing): `company_id`, `weekday_mask` (quais dias da semana contam), e tabela auxiliar `holidays` (`company_id`, `date`, `description`).

### `audit_log`
`company_id`, `actor_id`, `action`, `entity`, `entity_id`, `before jsonb`, `after jsonb`, `created_at`. Registre toda edição de report feita **após o dia de referência** e toda alteração de meta.

### RLS
- `consultora`: `SELECT`/`INSERT`/`UPDATE` apenas onde `consultant_id = auth.uid()`; `UPDATE` bloqueado se `report_date < current_date` (ver regra 7.2).
- `gestora`: tudo dentro do próprio `company_id`.
- `admin`: acesso total.
- Escreva testes das políticas de RLS. Não confie na inspeção visual.

---

## 7. REGRAS DE NEGÓCIO

### 7.1 Datas e períodos
- Timezone de referência: **America/Sao_Paulo**. O "dia" do report é a data local, não UTC.
- **Semana:** segunda a domingo (ISO 8601).
- **Quinzena:** dias 1–15 e 16 até o último dia do mês.
- **Mês:** mês-calendário.
- Todo dashboard aceita também **período personalizado** (data inicial e final).

### 7.2 Preenchimento
- A consultora preenche o report **do dia atual**. Pode editar livremente até 23:59 do próprio dia.
- Após virar o dia, a consultora ainda pode preencher/editar **os 2 dias anteriores**, mas o registro fica marcado como `late = true` e entra no audit log.
- Admin e gestora editam qualquer data, sempre com registro no audit log.
- Dia sem registro = **falha de preenchimento**, e isso precisa aparecer nos relatórios (não trate ausência como zero: zero é um resultado, ausência é um problema de disciplina). Diferencie visualmente os dois.
- Dias não úteis não contam como falha.

### 7.3 Métricas derivadas (calcule, nunca peça para a consultora digitar)

**Totais**
- `followup_total_done` = frio + morno + quente (done)
- `followup_total_replied` = frio + morno + quente (replied)

**Taxas de conversão** (sempre `null` quando o denominador é 0 — nunca exiba 0% nesse caso, exiba "—")
- Taxa de contato de leads novos = `new_leads_contacted / new_leads_received`
- Taxa de resposta de leads antigos = `old_leads_replied / old_leads_contacted`
- Taxa de resposta de follow-up (geral e por temperatura) = `replied / done`
- Taxa de atendimento de ligações = `calls_answered / calls_made`
- Ligação → reunião = `meetings_scheduled / calls_answered`
- Comparecimento (no-show invertido) = `meetings_held / meetings_scheduled`
- Reunião → proposta = `proposals_submitted / meetings_held`
- Proposta → venda = `sales_closed / proposals_submitted`
- Cotação → venda = `sales_closed / quotes_sent`
- **Ticket médio** = `sales_amount_cents / sales_closed`
- **Taxa de preenchimento** = dias com report / dias úteis do período

**Atingimento de meta** por indicador = realizado acumulado / meta do período.

**Ritmo esperado (pacing)** = `meta × (dias úteis decorridos / dias úteis totais do período)`. É a partir daqui que se define se a meta está "em risco" no meio do período — comparar realizado apenas contra a meta cheia no dia 5 do mês não diz nada.

Status por indicador:
- **Atingido** (verde): realizado ≥ meta
- **No ritmo** (verde claro): realizado ≥ 95% do ritmo esperado
- **Em risco** (âmbar): entre 80% e 95% do ritmo esperado
- **Fora da meta** (vermelho): abaixo de 80% do ritmo esperado

Implemente todo o cálculo em `src/lib/metrics/` como funções puras e **cubra com testes Vitest**. Casos de teste obrigatórios: divisão por zero, período sem dias úteis, meta nula, dias faltantes, valores monetários em centavos.

### 7.4 Diagnóstico automático — "o que não está sendo cumprido"

Esta é a funcionalidade mais importante do sistema. Em cada relatório (individual e de time), gere uma seção **DIAGNÓSTICO** com achados priorizados por severidade. Regras a implementar em `src/lib/diagnostics/`:

1. **Meta fora do ritmo** — qualquer indicador em status "em risco" ou "fora da meta". Mostre o gap absoluto e quanto precisa fazer por dia útil restante para recuperar.
2. **Gargalo do funil** — a etapa cuja taxa de conversão está mais abaixo da **mediana do time no mesmo período**. Reporte a etapa, a taxa da consultora, a mediana do time e o impacto estimado (quantas vendas a mais sairiam se ela chegasse na mediana).
3. **Queda relativa** — indicador que caiu mais de 25% versus o período anterior equivalente.
4. **Falha de disciplina** — dias úteis sem report, e reports lançados em atraso.
5. **Esforço sem retorno** — volume alto de atividade (ligações/follow-ups acima da mediana) com conversão abaixo da mediana. Sinaliza problema de abordagem, não de esforço.
6. **Retorno sem esforço** — conversão acima da mediana com volume abaixo da meta. Sinaliza capacidade ociosa.
7. **Follow-up desequilibrado** — mais de 70% dos follow-ups concentrados em uma única temperatura.
8. **Funil parado** — `negotiations_open` alto e estável há mais de 7 dias sem vendas correspondentes.

Cada achado deve ter: **título curto**, **severidade** (crítico / atenção / observação), **número que comprova**, e **uma frase de ação recomendada**. Sem texto genérico — todo achado é ancorado em um número do período.

Ordene por severidade e limite a 5 achados por relatório: um diagnóstico com 20 itens não é lido.

---

## 8. TELAS

### 8.1 Autenticação
- `/login` — e-mail e senha, logo LAKS centralizada sobre fundo `#0D0900`.
- `/primeiro-acesso` — definição de senha via link de convite.
- Recuperação de senha.

### 8.2 Área da consultora

**`/meu-report` (tela principal dela)**
- Cabeçalho: data de hoje por extenso, nome da consultora, status do preenchimento.
- Formulário em 5 blocos (seção 6), em cards, um por bloco, com os rótulos em português exatamente como no report original.
- Inputs numéricos grandes, otimizados para celular: teclado numérico, botões `+`/`−`, sem spinner minúsculo. **A consultora vai preencher isso pelo celular todo dia** — a experiência mobile é prioridade, não adaptação.
- Campo de valor de venda com máscara de moeda BRL.
- Campo de observações (opcional, texto livre).
- Ao lado ou abaixo, um painel ao vivo com os totais e taxas calculados enquanto ela digita.
- Salvamento automático de rascunho (localStorage) + botão explícito de envio.
- Após enviar: confirmação com resumo do dia e comparação com a média dela nos últimos 7 dias.
- Se houver dias anteriores em aberto (dentro da janela de 2 dias), mostrar aviso e atalho para preencher.

**`/meu-desempenho`**
- Seletor de período: semana / quinzena / mês / personalizado.
- Cards de KPI com realizado, meta, % de atingimento e status colorido.
- Gráfico de evolução diária dos principais indicadores.
- Funil visual com as taxas de conversão de cada etapa.
- Seção DIAGNÓSTICO com os achados dela.
- Histórico de reports em tabela, com destaque para dias faltantes.

### 8.3 Área do gestor

**`/dashboard` — visão do time**
- Seletor de período (dia / semana / quinzena / mês / personalizado) presente em todas as telas.
- Faixa de KPIs consolidados do time: total vendido, vendas, ticket médio, propostas, reuniões realizadas, ligações, taxa de preenchimento do time.
- **Tabela-matriz**: consultoras nas linhas, indicadores nas colunas, célula mostrando realizado / meta com cor de status. É aqui que o gestor bate o olho e vê onde está o problema.
- **Funil do time** com as taxas médias e a variação entre a melhor e a pior consultora em cada etapa.
- **Ranking** por indicador selecionável (não só por venda — permitir ranquear por ligação, reunião, conversão).
- Gráfico de evolução do time no período.
- Seção DIAGNÓSTICO DO TIME: achados agregados + as 3 consultoras que mais precisam de atenção e o porquê, em uma linha cada.
- Alerta de preenchimento: quem não preencheu hoje / no período.

**`/consultoras/[id]`**
- Mesmo conteúdo de `/meu-desempenho`, com o acréscimo de: comparação lado a lado com a média do time, histórico completo, e botão para editar o report de qualquer data.

**`/comparativo`**
- Comparação de 2 a N consultoras no mesmo período, mesmos indicadores, gráfico de barras agrupadas e tabela.

**`/metas`**
- Cadastro manual das metas. Tela em grade: linhas = consultoras, colunas = os 9 indicadores de meta, edição inline.
- Seletor de tipo de período e período.
- Botão "aplicar meta padrão da empresa a todas" e "copiar metas do período anterior".
- Aviso quando alguma consultora ativa está sem meta no período.

**`/consultoras`**
- CRUD de consultoras: nome, e-mail, data de início, status ativo/inativo, envio de convite.
- Desativar consultora **não apaga histórico** — ela sai dos relatórios correntes mas permanece nos períodos passados.

**`/configuracoes`**
- Dias úteis da semana, cadastro de feriados, dados da empresa, tema claro/escuro.

**`/relatorios`**
- Geração de relatório individual ou de time nos recortes semanal, quinzenal e mensal.
- Exportação em **CSV** e **PDF** (PDF com a identidade LAKS: logo, tipografia, paleta).
- Texto-resumo copiável em formato de mensagem, para o gestor colar no WhatsApp do time — mantendo o espírito do formato atual, mas agora com meta e diagnóstico junto.

---

## 9. REQUISITOS DE UX QUE NÃO SÃO NEGOCIÁVEIS

- **Mobile-first no formulário da consultora.** Preencher o report no celular em menos de 90 segundos.
- Ausência de dado ≠ zero. Em toda visualização, dia sem report aparece como lacuna, não como valor zero.
- Taxa com denominador zero exibe "—", nunca "0%".
- Valores monetários sempre formatados em pt-BR: `R$ 1.879,36`.
- Estados de vazio explicando o que fazer, não telas em branco.
- Loading states com skeleton, nunca spinner de página inteira.
- Toda cor de status também tem ícone ou rótulo — não comunique nada só por cor.
- Navegação por teclado funcional no formulário: `Tab` entre campos, `Enter` para enviar.

---

## 10. SEED / DADOS DE DEMONSTRAÇÃO

Crie um script `npm run seed` que popule:
- 1 empresa ("Corretora Demo"), 1 admin, 1 gestora, **5 consultoras** (uma delas chamada Andressa).
- 8 semanas de reports diários com variação realista: uma consultora consistentemente acima, uma abaixo, uma com volume alto e conversão ruim, uma com conversão boa e volume baixo, uma com falhas de preenchimento. Isso serve para validar **todas as regras de diagnóstico da seção 7.4**.
- Metas mensais e semanais para todas.
- O report da Andressa citado na seção 1 deve estar entre os dados, no formato expandido.

---

## 11. QUALIDADE E TESTES

- **Vitest** cobrindo `src/lib/metrics/` e `src/lib/diagnostics/` — mínimo 90% de cobertura nesses dois diretórios. São o coração do sistema; se o cálculo estiver errado, o sistema mente para o gestor.
- Testes de política RLS (uma consultora não pode, em hipótese alguma, ler o report de outra).
- Testes de fronteira de data: virada de dia no fuso de São Paulo, primeiro e último dia do mês, semana que cruza mês, quinzena em fevereiro.
- TypeScript em modo `strict`. Zero `any`.
- ESLint + Prettier configurados, rodando no pre-commit.

---

## 12. FASES DE IMPLEMENTAÇÃO

Entregue nesta ordem, validando cada fase antes de seguir:

**Fase 1 — Fundação.** Projeto Next.js, Tailwind com os tokens LAKS, fontes carregadas, shadcn/ui tematizado, layout base com o logo, tema escuro/claro. Entregável: uma página de exemplo que já pareça a LAKS.

**Fase 2 — Banco e Auth.** Migrations completas, RLS, Supabase Auth, perfis, convite de consultora, telas de login e primeiro acesso.

**Fase 3 — Report diário.** Formulário da consultora completo, mobile-first, com validação, rascunho, janela de edição e regra de atraso. Tela de histórico dela.

**Fase 4 — Métricas.** Camada de cálculo com testes, agregações por período (dia/semana/quinzena/mês/custom), tela `/meu-desempenho`.

**Fase 5 — Metas.** CRUD de metas, meta padrão da empresa, cálculo de atingimento e de ritmo esperado.

**Fase 6 — Dashboards do gestor.** Visão do time, matriz consultora × indicador, funil, ranking, comparativo, página individual.

**Fase 7 — Diagnóstico.** Todas as 8 regras da seção 7.4, com testes, exibidas nas telas individual e de time.

**Fase 8 — Relatórios e exportação.** CSV, PDF com identidade LAKS, texto-resumo para WhatsApp.

**Fase 9 — Polimento.** Acessibilidade, performance, estados vazios, responsividade, seed final, README com instruções de deploy.

---

## 13. FORA DE ESCOPO NESTA VERSÃO

Não implemente (mas deixe o código preparado para receber depois): integração com CRM, importação automática de mensagens do WhatsApp, notificações por push/e-mail, app nativo, IA generativa para redação de insights. O diagnóstico da seção 7.4 é **determinístico, baseado em regras** — não use LLM para isso.

---

## 14. CRITÉRIOS DE ACEITE

O projeto está pronto quando:

1. Uma consultora consegue preencher o report do dia pelo celular em menos de 90 segundos, e o registro fica salvo com a data correta no fuso de São Paulo.
2. O gestor cadastra uma nova consultora, define metas para ela e vê essas metas refletidas no dashboard no mesmo instante.
3. Os relatórios individual e de time funcionam nos recortes semanal, quinzenal, mensal e personalizado, com números que batem quando conferidos manualmente contra os dados de seed.
4. O diagnóstico aponta corretamente cada uma das 8 situações, comprovado pelos perfis plantados no seed.
5. Uma consultora, autenticada, não consegue acessar dado de outra por nenhuma via — nem por URL direta, nem por chamada de API.
6. Dias sem preenchimento aparecem como lacuna em todas as visualizações, distintos de zero.
7. A interface segue a paleta e a tipografia da seção 4, e todo texto passa em contraste 4.5:1.
8. `npm run build`, `npm run lint` e `npm run test` passam sem erro nem warning.

---

## 15. ANEXOS QUE VOU FORNECER

- Pasta `LAKS COMPANY [IDV]/` com logos (PNG/PDF/AI), fontes (Neuething Sans e Helvetica Neue) e o Manual de Marca em PDF.
- Copie os arquivos de fonte para `/public/fonts` e os logos para `/public/brand` na Fase 1.

---

**Comece pelo `PLAN.md`. Não escreva código antes de eu aprovar o plano.**
