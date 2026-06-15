# Dados de teste fictícios (FAKE_TEST)

Povoamento criado para testes gerais do KANDU. **Todos os registos estão
marcados com `fake_test: true`** (e títulos/nomes com prefixo `[FAKE]`),
para poderem ser apagados em bloco.

App alvo: **KANDU (Copy)** — `698b1381b9be3b0ef4a3e9c6`.

## O que foi criado (via MCP de dados)

| Entidade     | Qtd. | Notas |
|--------------|------|-------|
| `Job`        | 150  | Anúncios variados (11 categorias, preços, urgências, estados), em Lisboa/Porto |
| `Application`| 100  | Candidaturas e propostas de workers a jobs |
| `ChatMessage`| 99   | Conversas employer↔worker |
| `Rating`     | 70   | Avaliações visíveis (reputação) em obras concluídas |
| `Notification`| 0   | Não inseridas (ver abaixo) |

Os atores são os **6 utilizadores reais existentes** (2 employers + 4 workers),
porque a plataforma não permite criar contas `User` em massa pela API de dados
(geridas pelo sistema de autenticação). Para perfis fictícios em massa, ver
`base44/functions/seedFakeUsers`.

## Scripts / funções

- `scripts/seed-fake-interactions.cjs` — gera os ficheiros JSON (jobs +
  interações) em chunks ≤100 para enviar via `create_entities`.
  - `node scripts/seed-fake-interactions.cjs phase1` → `Job_*.json`
  - popular `scripts/fakejobs.json` com os jobs criados (id, employer_id, status)
  - `node scripts/seed-fake-interactions.cjs phase2` → Application/ChatMessage/Rating/Notification
- `base44/functions/seedFakeUsers/entry.ts` — **(para o Fable integrar/deploy)**
  cria 250 workers + 150 employers como contas reais via **Supabase Auth Admin**
  (login com password `KanduFake!2026`, emails `*@kandu-fake.test`).
- `base44/functions/wipeFakeData/entry.ts` — **limpeza**: apaga todos os
  registos com `fake_test: true`.

## Como APAGAR tudo (quando der o comando)

Opção 1 — função admin `wipeFakeData` (após deploy via Fable):
```js
await base44.functions.wipeFakeData({ includeUsers: true });
```

Opção 2 — pelo builder Base44: "apaga todos os registos onde fake_test é true
em Job, Application, ChatMessage, Rating, Notification (e User @kandu-fake.test)".

> Marcador único de limpeza: **`fake_test: true`**.
