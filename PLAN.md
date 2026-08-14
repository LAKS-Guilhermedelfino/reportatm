# PLAN.md — Sistema de Report Comercial (LAKS)

Plano de implementação fase a fase, conforme seção 12 do `claude.md`. Cada fase termina com `npm run build`, `npm run lint` e `npm run test` passando antes de avançar para a próxima.

## Decisões já confirmadas com o gestor

1. **Marca:** sem a pasta `LAKS COMPANY [IDV]/` por enquanto. Sigo com a alternativa da seção 4.2 (Archivo Expanded para títulos em caixa alta + Inter para texto corrido) e logo placeholder em `/public/brand`. Troco pelos arquivos e fontes reais assim que forem fornecidos, sem mudar a estrutura de tokens.
2. **Supabase:** sem Docker disponível neste ambiente, então trabalhando direto contra o projeto Supabase real (não local) desde a Fase 2 — `https://ftzckiliceenarubpuvy.supabase.co`, empresa "ATM Seguros" já cadastrada, migrations aplicadas via `supabase db push --db-url` (connection string do Session Pooler, ver `.env.local`). RLS testado com testes de integração reais (`tests/rls.integration.test.ts`), não pgTAP local.
3. **Git:** `git init` já na Fase 1, com primeiro commit ao final da fase.
4. **Nome do projeto:** `laks-report`, a menos que você indique outro nome depois.

## Pendências conhecidas

- **SMTP customizado no Supabase.** O serviço de e-mail padrão (Authentication → SMTP) é só para teste, com rate limit baixo por hora — já batemos nele durante os testes da Fase 2. Antes de convidar consultoras de verdade (Fase 6, tela `/consultoras`), configurar um provedor próprio (Resend, Postmark etc.) em Authentication → Settings → SMTP Settings no painel do Supabase.
- **Redirect URLs no Supabase Auth.** Além de `http://localhost:3000/**`, quando o deploy de produção existir (Vercel), adicionar a URL de produção à lista de Redirect URLs, senão login/convite/recuperação de senha quebram em produção do mesmo jeito que quebraram localmente até corrigirmos isso na Fase 2.

~~Senha temporária do admin~~ — resolvido, guilherme@lakscompany.com.br já trocou pela senha definitiva.

Ver [README.md](./README.md#pendências-conhecidas) para o checklist de deploy em produção (Fase 9).

---

## Fase 1 — Fundação

**Objetivo:** projeto Next.js rodando, já com a cara da LAKS.

- `create-next-app` (Next.js 15, App Router, TypeScript, ESLint, Tailwind).
- `src/styles/tokens.css` com as cores da seção 4.1 como CSS custom properties (dark default + light).
- `tailwind.config.ts` consumindo os tokens (sem hex solto).
- Fontes via `next/font/local`: Neuething Sans (títulos, caixa alta) e Helvetica Neue (corpo) se os arquivos existirem em `LAKS COMPANY [IDV]/Documents font/`; caso contrário, Archivo Expanded + Inter como fallback documentado.
- shadcn/ui inicializado e tematizado com os tokens.
- Logo em `/public/brand` (real ou placeholder), favicon com o símbolo isolado.
- Layout base (header, sidebar/nav colapsável) com alternância de tema claro/escuro.
- Página de exemplo (`/`) demonstrando paleta, tipografia (caixa alta em títulos), cards e botões.
- `.env.example` criado (vazio de segredos reais).

**Entregável:** página que já parece a LAKS, `npm run build` e `npm run lint` limpos.

## Fase 2 — Banco e Auth

**Objetivo:** schema completo, RLS testado, autenticação funcionando.

- Migrations SQL em `supabase/migrations/`: `companies`, `profiles`, `daily_reports`, `goals`, `business_days`, `holidays`, `audit_log`, com todos os campos, checks e constraints da seção 6 (incluindo unique `(consultant_id, report_date)` e a constraint de não sobreposição de períodos em `goals`).
- Policies de RLS para os três perfis, incluindo o bloqueio de `UPDATE` em `daily_reports` para `report_date < current_date` no caso de consultora (regra 7.2, sujeito à janela de 2 dias — tratada via Server Action, não só RLS, ver observação abaixo).
- Testes de RLS (via `pgTAP` ou script Node contra o Supabase local) garantindo que uma consultora nunca lê/edita dado de outra.
- Integração Supabase Auth (e-mail + senha), fluxo de convite (link de primeiro acesso) gerado pelo admin/gestora.
- Telas `/login`, `/primeiro-acesso`, recuperação de senha.
- Middleware de proteção de rotas por perfil.

**Observação técnica a validar com você:** a regra "consultora pode editar os 2 dias anteriores, mas fica marcada como `late`" é uma janela deslizante (depende do dia atual), o que RLS puro não expressa bem sozinho — vou implementar o limite dos 2 dias na Server Action (fonte da verdade) e uma policy de RLS mais permissiva como cinto de segurança até a Fase de auditoria. Aviso quando chegar lá.

**Entregável:** login funcional, perfis criados via seed mínimo, RLS comprovado por teste.

## Fase 3 — Report diário

**Objetivo:** consultora preenche o dia em menos de 90 segundos, no celular.

- Zod schema compartilhado para `daily_reports` (client + Server Action).
- Formulário `/meu-report` em 5 blocos/cards, mobile-first: inputs numéricos grandes, botões `+`/`−`, teclado numérico, máscara BRL para `sales_amount_cents`, campo de observações.
- Painel ao vivo com totais calculados (`followup_total_done`, `followup_total_replied`) enquanto digita.
- Rascunho em localStorage + envio explícito via Server Action.
- Regra de janela de edição (hoje livre; D-1/D-2 com `late = true` + audit log; fora da janela bloqueado para consultora).
- Confirmação pós-envio com resumo do dia e comparação com a média dos últimos 7 dias.
- Aviso de dias em aberto dentro da janela de 2 dias, com atalho.
- Tela de histórico da consultora (lista de reports, sem cálculo de período ainda — isso é Fase 4).

**Entregável:** fluxo completo de preenchimento e edição, testado manualmente no viewport mobile.

## Fase 4 — Métricas

**Objetivo:** camada de cálculo pura e testada, agregações por período.

- `src/lib/metrics/`: funções puras para totais, taxas de conversão (todas com denominador-zero → `null`), ticket médio, taxa de preenchimento.
- Utilitários de período em `src/lib/dates/` (semana ISO, quinzena, mês, custom) com `date-fns-tz` fixado em `America/Sao_Paulo`.
- Agregação por consultora e por período a partir de `daily_reports` + `business_days`/`holidays` (dias sem report ≠ zero, tratado como lacuna).
- Testes Vitest cobrindo os casos obrigatórios da seção 11 (divisão por zero, período sem dias úteis, meta nula, dias faltantes, centavos).
- Tela `/meu-desempenho`: seletor de período, cards de KPI (sem meta ainda — vem na Fase 5), gráfico de evolução diária, funil visual, histórico com lacunas destacadas.

**Entregável:** métricas batendo manualmente contra os dados de seed parcial; cobertura de teste alta em `src/lib/metrics/`.

## Fase 5 — Metas

**Objetivo:** metas manuais, ritmo esperado, atingimento.

- CRUD de `goals` via Server Actions (meta por consultora + meta padrão da empresa como fallback).
- Cálculo de pacing (`meta × dias úteis decorridos / dias úteis totais`) e status (atingido / no ritmo / em risco / fora da meta) em `src/lib/metrics/`, com testes.
- Tela `/metas`: grade consultoras × 9 indicadores, edição inline, botões "aplicar meta padrão a todas" e "copiar metas do período anterior", aviso de consultora sem meta.
- Cards de KPI em `/meu-desempenho` agora com meta, % de atingimento e status colorido.

**Entregável:** meta cadastrada pelo gestor aparece refletida no dashboard da consultora imediatamente.

## Fase 6 — Dashboards do gestor

**Objetivo:** visão do time completa.

- `/dashboard`: faixa de KPIs do time, tabela-matriz (consultoras × indicadores, realizado/meta com cor de status), funil do time com variação melhor/pior, ranking por indicador selecionável, gráfico de evolução do time, alerta de quem não preencheu.
- `/consultoras/[id]`: conteúdo de `/meu-desempenho` + comparação com média do time + histórico completo + edição de report de qualquer data (com audit log).
- `/comparativo`: 2–N consultoras, gráfico de barras agrupadas + tabela.
- `/consultoras`: CRUD (nome, e-mail, início, ativo/inativo, convite), desativação sem apagar histórico.
- `/configuracoes`: dias úteis, feriados, dados da empresa, tema.

**Entregável:** gestor cadastra consultora nova, define meta, vê tudo refletido sem reload manual de cache.

## Fase 7 — Diagnóstico

**Objetivo:** as 8 regras da seção 7.4, determinísticas e testadas.

- `src/lib/diagnostics/`: uma função por regra (meta fora do ritmo, gargalo do funil vs. mediana do time, queda relativa > 25%, falha de disciplina, esforço sem retorno, retorno sem esforço, follow-up desequilibrado, funil parado), cada achado com título, severidade, número e ação recomendada.
- Ordenação por severidade, limite de 5 achados por relatório.
- Testes Vitest por regra, incluindo os casos-limite que o seed da Fase 9 vai plantar.
- Seção DIAGNÓSTICO em `/meu-desempenho`, `/consultoras/[id]` e DIAGNÓSTICO DO TIME em `/dashboard` (achados agregados + 3 consultoras que mais precisam de atenção).

**Entregável:** cada uma das 8 situações plantadas no seed é corretamente identificada.

## Fase 8 — Relatórios e exportação

**Objetivo:** saída para fora do sistema.

- `/relatorios`: geração individual/time, recortes semanal/quinzenal/mensal.
- Exportação CSV.
- Exportação PDF com identidade LAKS (logo, tipografia, paleta).
- Texto-resumo copiável em formato de mensagem (estilo WhatsApp original), com meta e diagnóstico embutidos.

**Entregável:** PDF e CSV gerados batem com os números das telas; texto copiável pronto para colar no WhatsApp.

## Fase 9 — Polimento

**Objetivo:** fechar os critérios de aceite da seção 14.

- Auditoria de acessibilidade (contraste 4.5:1, navegação por teclado no formulário, ícone/rótulo em todo status colorido).
- Performance (loading skeletons, sem spinner de página inteira, estados vazios).
- Responsividade final em todas as telas.
- Script `npm run seed` final: empresa "Corretora Demo", admin, gestora, 5 consultoras (incluindo Andressa com o report da seção 1), 8 semanas de reports com os 5 perfis de comportamento da seção 10, metas mensais e semanais.
- README com instruções de setup e deploy (Vercel + Supabase).
- Checklist final contra a seção 14 (todos os 8 critérios).

**Entregável:** `npm run build`, `npm run lint`, `npm run test` limpos; critérios de aceite 1–8 verificados manualmente contra o seed.

---

## O que não entra nesta versão (seção 13)

Integração com CRM, importação automática de WhatsApp, notificações push/e-mail, app nativo, IA generativa para diagnóstico — código deixado preparado para receber depois, mas não implementado agora.
