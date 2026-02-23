# Runbook — Metriq

## Pré-requisitos

- Node.js 20+
- Docker + Docker Compose
- MySQL 8 (local via Docker ou VPS separada)
- Git

---

## 1. Setup Inicial (Primeira Vez)

```bash
# 1. Clone o repositório
git clone <seu-repo>
cd metriq

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com sua DATABASE_URL

# 3. Instale dependências Node
npm install

# 4. Suba o banco (desenvolvimento local)
docker compose -f infra/docker-compose.dev.yml up -d

# 5. Aguarde o MySQL inicializar (30s) e aplique migrations
npx prisma migrate deploy

# 6. Popule dados iniciais
npm run db:seed

# 7. Inicie o servidor
npm run dev
# Acesse: http://localhost:3000
```

---

## 2. Desenvolvimento do Dia a Dia

```bash
# Iniciar banco de dados
docker compose -f infra/docker-compose.dev.yml up -d

# Iniciar servidor Next.js
npm run dev

# Abrir Prisma Studio (visualizar dados)
npm run db:studio
```

---

## 3. Migrations

### Criar nova migration

```bash
# Cria migration baseada em mudanças no schema.prisma
npx prisma migrate dev --name nome_da_migration

# Exemplo: ao adicionar campo
npx prisma migrate dev --name add_campo_prioridade_visitas
```

### Aplicar migrations em produção

```bash
npx prisma migrate deploy
```

### Criar migration manual (ex.: VIEW)

```bash
# Cria arquivo sem aplicar
npx prisma migrate dev --name create_view --create-only

# Edite o arquivo em prisma/migrations/<timestamp>_create_view/migration.sql
# Depois aplique:
npx prisma migrate deploy
```

---

## 4. Seed

```bash
# Executa seed (dados iniciais)
npm run db:seed

# Reset completo + seed (CUIDADO: apaga todos os dados)
npm run db:reset
```

---

## 5. Build de Produção

```bash
# Build local (gera .next/standalone)
npm run build

# Testar build de produção localmente
node .next/standalone/server.js
```

---

## 6. Docker Completo (app + mysql)

```bash
# Sobe tudo (necessário para deploy em servidor sem EasyPanel)
docker compose -f infra/docker-compose.yml up -d --build

# Ver logs
docker compose -f infra/docker-compose.yml logs -f app
docker compose -f infra/docker-compose.yml logs -f db

# Parar tudo
docker compose -f infra/docker-compose.yml down

# Parar e remover volumes (APAGA DADOS)
docker compose -f infra/docker-compose.yml down -v
```

---

## 7. Backup do MySQL

### Backup manual

```bash
# Com Docker local
docker exec metriq_db_dev mysqldump -u metriq -pmetriq metriq > backup_$(date +%Y%m%d).sql

# Com MySQL remoto
mysqldump -h IP_VPS -u metriq -p metriq > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
# Com Docker local
docker exec -i metriq_db_dev mysql -u metriq -pmetriq metriq < backup_20260219.sql

# Com MySQL remoto
mysql -h IP_VPS -u metriq -p metriq < backup_20260219.sql
```

---

## 8. EasyPanel — Deploy

1. No EasyPanel, crie um novo serviço do tipo **App**
2. Configure:
   - **Source:** GitHub repository
   - **Branch:** main (ou conforme configurado)
   - **Dockerfile path:** `infra/Dockerfile`
3. Adicione as variáveis de ambiente:
   ```
   DATABASE_URL=mysql://metriq:SENHA@IP_VPS_MYSQL:3306/metriq
   NODE_ENV=production
   ```
4. Faça o primeiro deploy
5. Após o deploy, abra o Console do EasyPanel e execute:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

---

## 9. Troubleshooting

### Problema: `Can't connect to MySQL`

```bash
# Verifique se o container está rodando
docker ps | grep metriq_db

# Verifique os logs
docker logs metriq_db_dev

# Teste a conexão
docker exec metriq_db_dev mysqladmin ping -u root -prootpassword
```

### Problema: `Prisma Client not generated`

```bash
npm run db:generate
# ou
npx prisma generate
```

### Problema: VIEW não existe

```bash
# Verifique se a migration foi aplicada
npx prisma migrate status

# Aplique migrations pendentes
npx prisma migrate deploy
```

### Problema: Score não calculado (0 para todos)

Possíveis causas:
1. VIEW `v_score_mensal` não foi criada — execute migrations
2. `app_params` não tem dados — execute seed
3. O mês dos registros não existe na tabela `months` — adicione em `/listas`

### Problema: `Module not found` após mudança no schema

```bash
npx prisma generate
npm run dev
```

### Problema: Porta 3306 já em uso

```bash
# Descubra qual processo usa a porta
netstat -tulpn | grep 3306  # Linux
# ou no Windows:
netstat -ano | findstr :3306

# Mude a porta no docker-compose.dev.yml:
# "3307:3306" em vez de "3306:3306"
# E atualize .env: DATABASE_URL="mysql://...@localhost:3307/metriq"
```

---

## 10. Variáveis de Ambiente

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `DATABASE_URL` | `mysql://metriq:senha@localhost:3306/metriq` | String de conexão MySQL |
| `NODE_ENV` | `development` ou `production` | Ambiente de execução |
