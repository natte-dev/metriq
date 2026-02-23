# Metriq

Sistema web interno para controle de metas por departamento. Substitui planilha Excel com CRUDs completos, cálculo de score mensal e ranking trimestral/semestral/anual.

## Stack

- **Next.js 14+** (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **MySQL 8** + Prisma ORM
- **Docker** (desenvolvimento local) / **EasyPanel** (produção via GitHub)
- Zod + React Hook Form
- Server Actions

## Setup Local (Desenvolvimento)

### Pré-requisitos
- Node.js 20+
- Docker + Docker Compose
- Git

### 1. Clone e configure

```bash
git clone <seu-repo>
cd metriq
cp .env.example .env
```

### 2. Suba o MySQL local

```bash
docker compose -f infra/docker-compose.dev.yml up -d
```

### 3. Instale dependências

```bash
npm install
```

### 4. Execute as migrations e seed

```bash
npx prisma migrate deploy
npm run db:seed
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Setup em Produção (EasyPanel + GitHub)

### 1. Configure o MySQL na VPS

No servidor MySQL da sua outra VPS:
```sql
CREATE DATABASE metriq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'metriq'@'%' IDENTIFIED BY 'SUA_SENHA_AQUI';
GRANT ALL PRIVILEGES ON metriq.* TO 'metriq'@'%';
FLUSH PRIVILEGES;
```

### 2. Configure no EasyPanel

No painel de configuração da aplicação:
```
DATABASE_URL=mysql://metriq:SUA_SENHA@IP_VPS_MYSQL:3306/metriq
NODE_ENV=production
```

### 3. Deploy via GitHub

O EasyPanel fará o build automático ao receber push no branch configurado.

### 4. Execute migrations após o primeiro deploy

Via terminal no container ou pelo EasyPanel Console:
```bash
npx prisma migrate deploy
npm run db:seed
```

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # Inicia servidor local
npm run db:migrate:dev         # Cria nova migration
npm run db:studio              # Abre Prisma Studio

# Produção
npm run build                  # Build de produção
npm run db:migrate             # Aplica migrations (prisma migrate deploy)
npm run db:seed                # Popula dados iniciais
npm run db:setup               # migrate + seed em sequência

# Docker (desenvolvimento)
docker compose -f infra/docker-compose.dev.yml up -d     # Sobe MySQL
docker compose -f infra/docker-compose.dev.yml down      # Para MySQL

# Docker (produção local - app completo)
docker compose -f infra/docker-compose.yml up -d         # Sobe tudo
docker compose -f infra/docker-compose.yml logs -f app   # Logs da aplicação
```

---

## Estrutura de Pastas

```
metriq/
├── docs/              # DECISIONS.md, RUNBOOK.md
├── infra/             # docker-compose.yml, Dockerfile
├── prisma/            # schema.prisma + migrations
├── scripts/           # seed.ts
├── src/
│   ├── app/           # Rotas App Router (Next.js)
│   ├── components/    # Componentes React
│   ├── hooks/         # Custom hooks
│   ├── lib/           # prisma, utils, validações Zod
│   └── server/        # Server Actions + queries SQL
└── tests/             # Testes de smoke
```

---

## Páginas do Sistema

| Página | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/` | Cards resumo + score por departamento |
| Parâmetros | `/parametros` | Metas, pesos, bônus, penalidades |
| Listas | `/listas` | CRUD de todas as listas suspensas |
| Cronograma | `/cronograma` | Grade semanal por departamento |
| Visitas | `/visitas` | Registro de visitas |
| Atendimento | `/atendimento` | Registro de atendimentos com nota |
| Erros | `/erros` | Registro de erros com penalidade |
| Score Mensal | `/score` | Tabela de score calculado |
| Ranking | `/ranking` | Ranking trimestral/semestral/anual |

---

## Fórmulas de Cálculo (Score)

```
visitacao_pct   = (concluidas / meta_visitas_mes) × 100
atendimento_pct = (media_nota / escala_atendimento_max) × 100
qualidade_pct   = MAX(0, 100 - soma_penalidades)
score_final     = ROUND(visitacao_pct × peso_v + atendimento_pct × peso_a + qualidade_pct × peso_q, 2)
```

Calculado via VIEW MySQL `v_score_mensal`.

---

## Smoke Test

Após o setup, verifique o cálculo criando:
1. Departamento: "Fiscal", Mês: "2026-02"
2. 4 visitas com status "Concluída" para Fiscal/2026-02
3. 2 atendimentos: notas 5 e 4
4. 1 erro tipo "Leve" (2 pontos)

**Resultado esperado em `/score`:**
- Visitação: 100%
- Atendimento: 90% (média 4.5 / máx 5)
- Qualidade: 98% (100 - 2)
- **Score Final: 96.00**

---

## Checklist de Setup

- [ ] MySQL rodando e acessível
- [ ] `DATABASE_URL` configurado no `.env`
- [ ] `npm install` executado
- [ ] `npx prisma migrate deploy` executado
- [ ] `npm run db:seed` executado
- [ ] Aplicação iniciada (`npm run dev` ou container)
- [ ] Acesse `/listas` e verifique dados iniciais
- [ ] Execute o smoke test acima
