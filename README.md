# LAKS Report Comercial

Report comercial diário para consultoras, com metas, dashboards e diagnóstico
automático para o gestor. Ver [claude.md](./claude.md) para a especificação
completa e [PLAN.md](./PLAN.md) para o plano de implementação por fases.

Estado atual: **Fase 1 — Fundação** (paleta, tipografia, tema claro/escuro,
shadcn/ui). Instruções completas de setup/deploy chegam na Fase 9.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # build de produção
npm run lint    # eslint
```

## Stack

Next.js 15 (App Router) · TypeScript · Supabase · Tailwind CSS v4 · shadcn/ui ·
Recharts · date-fns · Zod · React Hook Form · Vitest.
