# Guia de Implementação de Banco de Dados - NutrIA

## 1. Opções de Banco de Dados Recomendadas

### PostgreSQL (Recomendado)
- **Vantagens**: Robusto, ACID compliant, suporte a JSON, excelente para dados relacionais
- **Ideal para**: Aplicações de produção com múltiplos usuários
- **Custo**: Gratuito (open source)

### MySQL
- **Vantagens**: Popular, bem documentado, boa performance
- **Ideal para**: Aplicações web tradicionais
- **Custo**: Gratuito (Community Edition)

### SQLite
- **Vantagens**: Zero configuração, arquivo único
- **Ideal para**: Desenvolvimento local, aplicações pequenas
- **Limitações**: Não adequado para múltiplos usuários simultâneos

## 2. Configuração PostgreSQL (Produção)

### 2.1 Instalação Local
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Windows
# Baixe o instalador oficial do PostgreSQL
```

### 2.2 Configuração Inicial
```sql
-- Criar usuário e banco
sudo -u postgres psql
CREATE DATABASE nutria_db;
CREATE USER nutria_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE nutria_db TO nutria_user;
\q
```

### 2.3 Variáveis de Ambiente
```bash
# .env
DATABASE_URL="postgresql://nutria_user:sua_senha_segura@localhost:5432/nutria_db"
PGHOST=localhost
PGPORT=5432
PGDATABASE=nutria_db
PGUSER=nutria_user
PGPASSWORD=sua_senha_segura
```

## 3. Provedores de Nuvem

### 3.1 Neon (Recomendado para início)
- **Características**: PostgreSQL serverless, tier gratuito generoso
- **Setup**: 
  1. Acesse neon.tech
  2. Crie conta e projeto
  3. Copie a connection string
- **Custo**: Gratuito até 0.5GB, depois $19/mês

### 3.2 Supabase
- **Características**: PostgreSQL + APIs automáticas
- **Setup**:
  1. Acesse supabase.com
  2. Crie projeto
  3. Configure autenticação se necessário
- **Custo**: Gratuito até 500MB, depois $25/mês

### 3.3 Railway
- **Características**: Deploy simples, PostgreSQL incluído
- **Setup**:
  1. Conecte seu GitHub
  2. Deploy automático
  3. Adicione PostgreSQL plugin
- **Custo**: $5/mês por serviço

### 3.4 PlanetScale (MySQL)
- **Características**: MySQL serverless com branching
- **Custo**: Gratuito até 5GB, depois $29/mês

## 4. Migração do Sistema Atual

### 4.1 Estrutura Atual vs Nova
```typescript
// ATUAL (File Storage)
// - Dados em memória/arquivos
// - Sem transações ACID
// - Limitado para um usuário

// NOVO (PostgreSQL)
// - Dados persistentes
// - Transações seguras
// - Múltiplos usuários
// - Backup automático
```

### 4.2 Processo de Migração

#### Passo 1: Configurar Drizzle com PostgreSQL
```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

#### Passo 2: Instalar Dependências
```bash
npm install @neondatabase/serverless
npm install drizzle-orm
npm install -D drizzle-kit
```

#### Passo 3: Configurar Conexão
```typescript
// server/db.ts (já implementado)
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

#### Passo 4: Executar Migrações
```bash
# Gerar migrações
npm run db:generate

# Aplicar migrações
npm run db:push
```

#### Passo 5: Substituir Storage
```typescript
// server/storage.ts
// Trocar MemStorage por DatabaseStorage (já implementado)
export const storage = new DatabaseStorage();
```

## 5. Comandos Úteis

### 5.1 Desenvolvimento
```bash
# Ver schema atual
npm run db:studio

# Reset completo do banco
npm run db:reset

# Backup local
pg_dump nutria_db > backup.sql

# Restore local
psql nutria_db < backup.sql
```

### 5.2 Produção
```bash
# Aplicar mudanças sem perder dados
npm run db:push

# Verificar status das migrações
npm run db:check

# Gerar SQL das mudanças
npm run db:generate
```

## 6. Monitoramento e Manutenção

### 6.1 Métricas Importantes
- Conexões ativas
- Tamanho do banco
- Performance das queries
- Uso de índices

### 6.2 Backup Strategy
```sql
-- Backup diário automático (cron)
0 2 * * * pg_dump nutria_db > /backups/nutria_$(date +\%Y\%m\%d).sql

-- Retention de 30 dias
find /backups -name "nutria_*.sql" -mtime +30 -delete
```

### 6.3 Índices Recomendados
```sql
-- Usuários por email (login)
CREATE INDEX idx_users_email ON users(email);

-- Refeições por usuário e data
CREATE INDEX idx_meals_user_date ON meals(user_id, date);

-- Alimentos por usuário
CREATE INDEX idx_foods_user ON foods(user_id) WHERE user_id IS NOT NULL;

-- Nutrição diária por usuário e data
CREATE INDEX idx_daily_nutrition_user_date ON daily_nutrition(user_id, date);
```

## 7. Segurança

### 7.1 Configurações Essenciais
```sql
-- Limitar conexões por usuário
ALTER ROLE nutria_user CONNECTION LIMIT 10;

-- SSL obrigatório (produção)
ALTER DATABASE nutria_db SET ssl = on;

-- Timeout de queries longas
ALTER DATABASE nutria_db SET statement_timeout = '30s';
```

### 7.2 Variáveis Secretas
```bash
# Nunca commitar essas informações
DATABASE_URL=postgresql://user:password@host:port/database
DB_SSL_MODE=require
DB_POOL_SIZE=10
```

## 8. Custos Estimados

### Desenvolvimento/Teste
- **Neon Free**: R$ 0/mês (até 0.5GB)
- **Local PostgreSQL**: R$ 0/mês

### Pequena Produção (< 1000 usuários)
- **Neon Pro**: R$ 95/mês (8GB)
- **Supabase Pro**: R$ 125/mês
- **Railway**: R$ 25/mês + usage

### Média Produção (< 10.000 usuários)
- **AWS RDS**: R$ 150-400/mês
- **Google Cloud SQL**: R$ 180-450/mês
- **Digital Ocean**: R$ 75-250/mês

## 9. Próximos Passos Recomendados

1. **Escolher provedor** (Recomendo Neon para início)
2. **Configurar ambiente de staging**
3. **Migrar dados de teste**
4. **Implementar monitoring**
5. **Configurar backups**
6. **Deploy gradual para produção**

## 10. Troubleshooting Comum

### Problema: Conexão recusada
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar portas
netstat -an | grep 5432
```

### Problema: Permissões
```sql
-- Dar todas as permissões necessárias
GRANT ALL ON ALL TABLES IN SCHEMA public TO nutria_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO nutria_user;
```

### Problema: Performance lenta
```sql
-- Analisar queries lentas
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

Este guia cobre todos os aspectos necessários para implementar um banco de dados robusto para o NutrIA. Recomendo começar com Neon para simplicidade, depois migrar para uma solução mais robusta conforme o crescimento.