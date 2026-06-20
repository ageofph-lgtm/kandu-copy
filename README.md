# KANDU

Marketplace que liga profissionais de construção e serviços a empregadores (Base44 + React + Vite).

## Desenvolvimento

```bash
npm install
BASE44_LEGACY_SDK_IMPORTS=true npm run dev
```

## Build

```bash
BASE44_LEGACY_SDK_IMPORTS=true npm run build
```

> **Nota:** a variável `BASE44_LEGACY_SDK_IMPORTS=true` é obrigatória — o código
> importa entidades via `@/entities/*` (estilo legacy do SDK Base44), que o
> `@base44/vite-plugin` só resolve com esta flag ativa. Sem ela o build falha
> com `Could not load /src/entities/...`.

## Qualidade

```bash
npm run lint        # ESLint (inclui react-hooks/exhaustive-deps)
npm run typecheck   # tsc sobre jsconfig.json
```

## Estrutura

- `src/pages/` — páginas (auto-registadas em `pages.config.js`)
- `src/components/` — componentes (UI kit shadcn em `components/ui`)
- `base44/entities/` — schemas das entidades, incluindo regras RLS
- `base44/functions/` — funções backend (Deno) — toda a lógica sensível
  (avaliações, XP, estado das obras) deve viver aqui, nunca no cliente

## Notas de segurança

- A autorização de admin nas funções backend usa `user.role` (gerido pela
  plataforma). **Nunca** usar `user_type` para autorização — é auto-editável
  pelo utilizador via `auth.updateMe` durante o onboarding.
- Os PINs de presença/conclusão são atualmente gerados no cliente
  (`src/lib/dailyPin.js`, `src/pages/MyJobs.jsx`) e servem apenas como UX;
  não são prova anti-fraude. Migrar para geração/validação server-side antes
  de comunicar como funcionalidade de segurança.

<!-- build 2026-06-20 00:18:08 UTC -->
