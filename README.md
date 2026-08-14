# LAKS Report Comercial

Report comercial diário para consultoras de corretoras de plano de saúde, com
metas, dashboards do gestor e diagnóstico automático do que não está sendo
cumprido. Ver [claude.md](./claude.md) para a especificação completa e
[PLAN.md](./PLAN.md) para o histórico de decisões e o plano por fases.

**Estado atual: todas as 9 fases concluídas** (fundação, banco/auth, report
diário, métricas, metas, dashboards, diagnóstico, relatórios/exportação e
polimento). Ver seção [Checklist de aceite](#checklist-de-aceite-seção-14)
abaixo.

## Stack

Next.js 15 (App Router, Server Components/Actions) · TypeScript (strict) ·
Supabase (Postgres + Auth + RLS) · Tailwind CSS v4 · shadcn/ui (base-ui) ·
Recharts · date-fns / date-fns-tz (`America/Sao_Paulo`) · Zod · React Hook
Form · Vitest · `@react-pdf/renderer`.

## Setup local

### 1. Pré-requisitos

- Node.js 20+
- Um projeto Supabase (criado em [supabase.com](https://supabase.com) — o
  plano free serve para desenvolvimento/demo)

### 2. Instalar dependências

```bash
npm install
```

### 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` key (**secreta** — nunca expor no client, nunca commitar) |
| `SUPABASE_DB_URL` | Project Settings → Database → Connection string → **Session pooler** (porta 5432, modo `session`). Necessária para aplicar migrations e rodar `npm run seed`. Se sua rede não tiver saída IPv6, use o pooler — a conexão direta (`db.<ref>.supabase.co`) é IPv6-only. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` em desenvolvimento; a URL do deploy em produção |

### 4. Aplicar as migrations

Sem Docker/Supabase local neste projeto — as migrations em
`supabase/migrations/` são aplicadas direto contra o projeto real:

```bash
npx supabase db push --db-url "$SUPABASE_DB_URL"
```

(ou exporte `SUPABASE_DB_URL` do `.env.local` no shell antes de rodar o
comando — ele não é lido automaticamente de `.env.local`).

Isso cria todas as tabelas, RLS policies, triggers e funções auxiliares
(`private.*`) descritas na seção 6 do `claude.md`.

### 5. Popular com dados de demonstração (opcional, recomendado)

```bash
npm run seed
```

Cria a empresa **Corretora Demo** com 1 admin, 1 gestora e 5 consultoras
(seção 10 do `claude.md`) — 8 semanas de reports diários cobrindo os 5
perfis de desempenho e as 8 regras de diagnóstico, mais metas semanais e
mensais para todas. Roda quantas vezes quiser: apaga e recria a empresa a
cada execução (idempotente), sem afetar outras empresas cadastradas no
projeto.

Ao final, o script imprime as credenciais de login (mesma senha para todos
os usuários demo — troque antes de expor publicamente).

### 6. Primeiro admin fora do seed

Para bootstrapar uma empresa real (fora do seed de demonstração):

```bash
node scripts/bootstrap-company.mjs \
  --company "Nome da Corretora" \
  --admin-email "admin@exemplo.com" \
  --admin-name "Nome do Admin"
```

Isso cria a empresa e envia um e-mail de convite (primeiro acesso) para o
admin. **Requer SMTP configurado** — ver [Pendências](#pendências-conhecidas)
abaixo.

### 7. Rodar

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev      # servidor de desenvolvimento (Turbopack)
npm run build    # build de produção
npm run start    # roda o build de produção
npm run lint     # eslint
npm run test     # vitest (suite completa)
npm run seed     # popula/reseta a empresa de demonstração
```

## Deploy (Vercel + Supabase)

1. **Supabase:** use o mesmo projeto do desenvolvimento ou crie um novo para
   produção. Aplique as migrations (`npx supabase db push --db-url ...`)
   antes do primeiro deploy.
2. **Vercel:** conecte o repositório e configure as variáveis de ambiente do
   passo 3 acima em Project Settings → Environment Variables
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` apontando para o
   domínio de produção). `SUPABASE_DB_URL` não é necessária em produção — só
   é usada localmente pelo Supabase CLI e pelo `npm run seed`.
3. **Redirect URLs no Supabase Auth** (Authentication → URL Configuration):
   adicione a URL de produção (ex.: `https://seu-dominio.vercel.app/**`) à
   lista de Redirect URLs — sem isso, os links de convite e recuperação de
   senha por e-mail quebram em produção.
4. **SMTP customizado** (Authentication → Settings → SMTP Settings): o
   serviço de e-mail padrão do Supabase é só para teste, com rate limit
   baixo. Configure um provedor próprio (Resend, Postmark etc.) antes de
   convidar consultoras de verdade pela tela `/consultoras`.

## Pendências conhecidas

- **SMTP customizado** — ver item 4 acima. Sem isso, convites reais (fora do
  seed de demonstração) esbarram no rate limit do e-mail padrão do Supabase.
- **Fontes da marca** — os arquivos reais de Neuething Sans e Helvetica Neue
  (`LAKS COMPANY [IDV]/Documents font/`) ainda não foram fornecidos. O
  sistema usa Archivo Expanded (títulos, caixa alta) + Inter (texto corrido)
  como substitutas, carregadas via `next/font/local`; troque os arquivos em
  `/public/fonts` quando disponíveis — a estrutura de tokens não muda.
- **Logo real** — mesma situação: `/public/brand` tem um placeholder até os
  arquivos oficiais (`LAKS COMPANY [IDV]/Versões da Marca/`) serem
  fornecidos.
- **PDF exportado** usa a fonte nativa Helvetica do `@react-pdf/renderer`
  (sem fetch de fonte em runtime, mais confiável em serverless) em vez de
  Archivo/Inter — mesma cor e estrutura da marca, tipografia ligeiramente
  diferente da usada na interface web.

## Testes

```bash
npm run test
```

Cobertura concentrada em `src/lib/metrics/` e `src/lib/diagnostics/` — as
camadas de cálculo puro que sustentam todo o resto do sistema (seção 11 do
`claude.md`). Inclui também testes de integração de RLS contra o projeto
Supabase real (uma consultora nunca lê/edita dado de outra, nem por chamada
direta de API).

## Checklist de aceite (seção 14)

- [x] Consultora preenche o report do dia pelo celular em menos de 90s, com
      data correta no fuso de São Paulo.
- [x] Gestor cadastra consultora, define meta, vê refletido no dashboard
      imediatamente.
- [x] Relatórios individual e de time funcionam nos recortes semanal,
      quinzenal, mensal e personalizado.
- [x] Diagnóstico aponta corretamente as 8 situações da seção 7.4 —
      comprovado pelos 5 perfis plantados em `npm run seed`.
- [x] Consultora não acessa dado de outra por nenhuma via (RLS + testes de
      integração).
- [x] Dias sem preenchimento aparecem como lacuna, nunca como zero.
- [x] Interface segue a paleta/tipografia da seção 4, contraste ≥ 4.5:1.
- [x] `npm run build`, `npm run lint` e `npm run test` passam sem erro.
