# Decisões de Arquitetura — Metriq

## 1. Next.js App Router (não Pages Router)

**Decisão:** Usar App Router do Next.js 14+.

**Justificativa:**
- Server Components permitem buscar dados diretamente no servidor sem API intermediária
- Server Actions simplificam mutações sem necessidade de Route Handlers separados
- `revalidatePath` permite invalidação granular de cache
- Melhor suporte a streaming e Suspense

---

## 2. Server Actions (não Route Handlers)

**Decisão:** Usar Server Actions para todas as mutações.

**Justificativa:**
- Integração direta com formulários React sem `useEffect` ou `fetch` manual
- Type-safe end-to-end: o cliente chama a função TypeScript diretamente
- `revalidatePath` dentro da action garante consistência do cache
- Reduz boilerplate de endpoints REST para operações simples de CRUD

**Padrão adotado:** Todas as actions retornam `{ success: true, data } | { success: false, error }`.

---

## 3. Prisma ORM (não Drizzle ou Knex)

**Decisão:** Usar Prisma como ORM principal.

**Justificativa:**
- Migrations automáticas com `prisma migrate dev/deploy`
- Schema como fonte única de verdade para tipos TypeScript
- `prisma studio` facilita inspeção do banco em desenvolvimento
- Melhor suporte a MySQL 8 com suporte a `$queryRawUnsafe` para consultas avançadas

---

## 4. MySQL VIEW v_score_mensal

**Decisão:** Implementar o cálculo de score como VIEW no MySQL, não como código TypeScript.

**Justificativa:**
- Garante que o cálculo seja consistente em todas as consultas (score, dashboard, ranking)
- Evita duplicação de lógica de negócio no código da aplicação
- Permite consultar a VIEW diretamente em ferramentas externas (Prisma Studio, phpMyAdmin)
- Mais performático do que calcular em múltiplas queries separadas no Node.js

**Implementação:** VIEW criada em migration separada (`20260219000002_create_view`) usando `CREATE OR REPLACE VIEW`.

**Nota:** Prisma não suporta VIEWs no schema.prisma, portanto a VIEW é gerenciada via SQL puro em migrations e consultada com `$queryRawUnsafe`.

---

## 5. Filtros via URL Search Params

**Decisão:** Estado de filtros (mês, departamento, status, paginação) vive em URL search params.

**Justificativa:**
- Server Components leem `searchParams` diretamente, sem estado no cliente
- URLs compartilháveis: abrir `/visitas?month=2026-02` mostra dados filtrados
- Botão voltar do browser funciona naturalmente
- Sem `useState` ou `useEffect` em componentes de filtro

**Padrão:** Client components usam `useRouter` e `useSearchParams` para atualizar params.

---

## 6. Raw SQL apenas para Score e Ranking

**Decisão:** Usar `prisma.$queryRawUnsafe` apenas para consultas na VIEW e ranking.

**Justificativa:**
- Prisma ORM não suporta querying de VIEWs via query builder
- Window functions MySQL 8 (`ROW_NUMBER() OVER (...)`) não são suportadas pelo Prisma query builder
- Para CRUDs simples, o Prisma é usado normalmente (type-safe)

**Segurança:** Os valores dinâmicos (month, department_id) são passados como parâmetros posicionais `?`, não interpolados diretamente na string SQL.

---

## 7. Sem Login/Autenticação

**Decisão:** Sistema sem autenticação.

**Justificativa:** Requisito explícito do cliente. Sistema interno operado por 1 usuário.

**Extensão futura:** Se necessário, adicionar NextAuth.js com middleware em `src/middleware.ts` protegendo todas as rotas.

---

## 8. Docker para Desenvolvimento, EasyPanel para Produção

**Decisão:**
- `infra/docker-compose.dev.yml`: apenas MySQL para desenvolvimento local
- `infra/docker-compose.yml`: app + MySQL (opcional, produção local completa)
- `infra/Dockerfile`: standalone Next.js, compatível com EasyPanel

**Justificativa:**
- EasyPanel usa GitHub integration e Dockerfile para build
- MySQL em VPS separada exige apenas configurar `DATABASE_URL` como env var no EasyPanel
- `next build` com `output: "standalone"` gera bundle mínimo para o container

---

## 9. Armazenamento de Mês como CHAR(7)

**Decisão:** Campo `month` armazenado como `CHAR(7)` no formato `YYYY-MM`.

**Justificativa:**
- Simplicidade: filtros com `WHERE month = '2026-02'` diretos
- Sem ambiguidade de timezone (vs. DATE/DATETIME)
- Ordenação alfabética = ordenação cronológica (YYYY-MM)
- Compatível com a lógica da planilha original

---

## 10. penalty_points_override no modelo Erro

**Decisão:** Campo opcional `penalty_points_override` no registro de erro.

**Justificativa:**
- Permite casos excepcionais onde a penalidade difere do padrão do tipo
- Na VIEW, `CASE WHEN penalty_points_override IS NOT NULL THEN override ELSE tipo_erro.penalty_points END`
- Default: usa o valor do `tipo_erro` (preenchido automaticamente no formulário)
