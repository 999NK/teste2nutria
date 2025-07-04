# NutrIA - Aplicativo de Nutrição

Um aplicativo móvel de rastreamento nutricional que utiliza IA para simplificar o registro de refeições e análise nutricional, com capacidades avançadas de busca de alimentos internacionais.

## 🚀 Como Rodar o Projeto na Sua Máquina

### Pré-requisitos

1. **Node.js** (versão 18 ou superior)
   - Baixe em: https://nodejs.org/
   - Verifique a instalação: `node --version`

2. **PostgreSQL** (versão 12 ou superior)
   - Windows: https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt install postgresql postgresql-contrib`

3. **Git**
   - Baixe em: https://git-scm.com/

### Configuração do Banco de Dados

1. **Criar banco de dados PostgreSQL:**
   ```bash
   # Entre no PostgreSQL
   psql -U postgres
   
   # Crie o banco
   CREATE DATABASE nutria;
   
   # Crie um usuário (opcional)
   CREATE USER nutria_user WITH PASSWORD 'sua_senha';
   GRANT ALL PRIVILEGES ON DATABASE nutria TO nutria_user;
   ```

2. **Obter chave da API USDA:**
   - Acesse: https://fdc.nal.usda.gov/api-key-signup.html
   - Cadastre-se gratuitamente
   - Anote sua chave da API

### Instalação e Configuração

1. **Clone o repositório:**
   ```bash
   git clone <url-do-seu-repositorio>
   cd nutria
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   # Banco de Dados
   DATABASE_URL="postgresql://nutria_user:sua_senha@localhost:5432/nutria"
   PGHOST=localhost
   PGPORT=5432
   PGUSER=nutria_user
   PGPASSWORD=sua_senha
   PGDATABASE=nutria
   
   # API USDA (substitua pela sua chave)
   USDA_API_KEY=sua_chave_usda_aqui
   
   # Sessão (gere uma string aleatória segura)
   SESSION_SECRET=uma_string_muito_longa_e_aleatoria_aqui
   
   # Replit (para autenticação - opcional em desenvolvimento local)
   REPL_ID=desenvolvimento
   REPLIT_DOMAINS=localhost:5000
   ISSUER_URL=https://replit.com/oidc
   ```

4. **Configure o banco de dados:**
   ```bash
   # Execute as migrações
   npm run db:push
   ```

### Executando o Projeto

1. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Acesse o aplicativo:**
   - Abra seu navegador
   - Vá para: `http://localhost:5000`

### Estrutura do Projeto

```
nutria/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas do aplicativo
│   │   ├── hooks/         # React hooks customizados
│   │   └── lib/           # Utilitários e configurações
├── server/                # Backend Express
│   ├── services/          # Serviços (USDA, AI, PDF, etc.)
│   ├── routes.ts          # Rotas da API
│   ├── storage.ts         # Operações do banco de dados
│   └── db.ts              # Configuração do banco
├── shared/                # Código compartilhado
│   └── schema.ts          # Schema do banco (Drizzle)
└── package.json
```

### Funcionalidades Principais

- ✅ **Autenticação de usuários**
- ✅ **Busca de alimentos** (USDA + banco local)
- ✅ **Registro de refeições** por tipo (café, almoço, jantar, etc.)
- ✅ **Cálculo automático de metas nutricionais**
- ✅ **Rastreamento diário** (ciclo nutricional 5h-5h)
- ✅ **Dashboard com progresso** em tempo real
- ✅ **Exportação de relatórios PDF**
- ✅ **Interface responsiva** (mobile-first)

### Comandos Úteis

```bash
# Instalar nova dependência
npm install nome-do-pacote

# Atualizar schema do banco
npm run db:push

# Ver logs em tempo real
npm run dev

# Build para produção
npm run build
```

### Solução de Problemas

**Erro de conexão com banco:**
- Verifique se PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `psql -U nutria_user -d nutria`

**Erro na API USDA:**
- Verifique se a chave `USDA_API_KEY` está correta
- Teste a chave: `curl "https://api.nal.usda.gov/fdc/v1/foods/search?query=banana&api_key=SUA_CHAVE"`

**Porta em uso:**
- O projeto usa a porta 5000 por padrão
- Para mudar: `PORT=3000 npm run dev`

### Desenvolvendo

1. **Frontend** (React + TypeScript):
   - Componentes em `client/src/components/`
   - Páginas em `client/src/pages/`
   - Estilização com Tailwind CSS

2. **Backend** (Express + TypeScript):
   - Rotas da API em `server/routes.ts`
   - Lógica de negócio em `server/services/`
   - Banco de dados com Drizzle ORM

3. **Banco de dados**:
   - Schema definido em `shared/schema.ts`
   - Migrações automáticas com `npm run db:push`

### Deployment

Para colocar em produção, você pode usar:
- **Vercel** (frontend + serverless functions)
- **Railway** (aplicação completa)
- **Heroku** (aplicação completa)
- **DigitalOcean** (VPS)

Certifique-se de configurar as variáveis de ambiente na plataforma escolhida.

### Suporte

Se encontrar problemas:
1. Verifique os logs no terminal
2. Confirme todas as variáveis de ambiente
3. Teste as conexões (banco e APIs)
4. Consulte a documentação das APIs externas

---

**NutrIA** - Seu assistente inteligente para nutrição e saúde.