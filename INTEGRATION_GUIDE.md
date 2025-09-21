# Layer Reports - Guia de Integração com Meta Ads API

## 🚀 Integração Completa Implementada

O Layer Reports agora possui integração completa com a Meta Ads API através de três modos de operação:

### 📊 Modos Disponíveis

#### 1. **Dados Demo** (Padrão)
- Dados simulados para demonstração
- Ideal para desenvolvimento e testes
- Não requer configuração

#### 2. **Backend + Meta API** (Recomendado)
- API backend Node.js/TypeScript
- Autenticação segura com JWT
- Cache inteligente com Redis
- Sincronização automática com Facebook

#### 3. **Meta API Direto**
- Conexão direta com Graph API
- Para casos de uso específicos
- Requer tokens de acesso válidos

### 🔧 Como Usar

#### Alternando Modos
1. No dashboard, use o seletor "Modo API" no header
2. Escolha entre os três modos disponíveis
3. A aplicação recarregará automaticamente os dados

#### Configurando Backend Mode

**1. Configurar Variáveis de Ambiente:**
```bash
cd backend
cp .env.example .env
```

**2. Editar `.env` com suas credenciais:**
```env
# Facebook App Configuration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/layer_reports"

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key
```

**3. Instalar dependências e rodar:**
```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

**4. No frontend, selecionar "Backend + Meta API"**

### 🔐 Configuração Facebook App

Para usar a integração real, você precisa:

1. **Criar App no Facebook Developers:**
   - Acesse [developers.facebook.com](https://developers.facebook.com)
   - Crie um novo app
   - Adicione o produto "Marketing API"

2. **Configurar Permissions:**
   - `ads_read`
   - `ads_management` (opcional, para escrita)
   - `business_management`

3. **Obter Credenciais:**
   - App ID
   - App Secret
   - Access Token (via OAuth flow)

### 🎯 Funcionalidades Implementadas

#### Backend API Endpoints

**Autenticação:**
- `POST /api/auth/facebook` - Login com Facebook
- `GET /api/auth/profile` - Perfil do usuário
- `POST /api/auth/logout` - Logout

**Contas:**
- `GET /api/accounts` - Listar contas de anúncio

**Campanhas:**
- `GET /api/campaigns/:accountId` - Listar campanhas
- `POST /api/campaigns/:accountId/sync` - Sincronizar com Facebook
- `GET /api/campaigns/:accountId/:campaignId` - Detalhes da campanha

**Insights:**
- `GET /api/insights/account/:accountId` - Métricas da conta
- `GET /api/insights/campaign/:accountId/:campaignId` - Métricas da campanha
- `POST /api/insights/campaign/:accountId/:campaignId/sync` - Sincronizar insights

#### Frontend Features

**Interface Unificada:**
- Seletor de modo API no header
- Notificações de sucesso/erro
- Loading states durante operações
- Dados consistentes entre modos

**Compatibilidade:**
- Mesma interface para todos os modos
- Transição suave entre modos
- Dados persistidos no localStorage

### 📡 Fluxo de Autenticação

#### Modo Backend:
1. Usuário seleciona "Backend + Meta API"
2. Frontend envia token Facebook para `/api/auth/facebook`
3. Backend valida token com Facebook
4. Backend retorna JWT para autenticação
5. Frontend usa JWT para todas as requisições

#### Sincronização de Dados:
1. Backend busca dados do Facebook API
2. Dados são armazenados no banco (Prisma)
3. Cache implementado com Redis
4. Frontend recebe dados formatados

### 🔒 Segurança

- **JWT Authentication:** Tokens seguros para autenticação
- **Rate Limiting:** Proteção contra abuso da API
- **CORS Configuration:** Configuração segura de CORS
- **Token Validation:** Validação contínua de tokens Facebook
- **Error Handling:** Tratamento robusto de erros

### 📈 Performance

- **Redis Caching:** Cache inteligente de dados Facebook
- **Database Optimization:** Queries otimizadas com Prisma
- **Background Sync:** Sincronização assíncrona de dados
- **Pagination:** Suporte a paginação para grandes datasets

### 🛠️ Desenvolvimento

#### Estrutura do Projeto:
```
Layer/
├── frontend/              # Aplicação frontend
│   ├── index.html
│   ├── js/main.js        # Lógica principal
│   ├── js/meta-api.js    # Integração API
│   └── css/style.css
├── backend/              # API backend
│   ├── src/
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Serviços (Facebook API)
│   │   ├── middleware/   # Middleware (auth, validation)
│   │   └── utils/        # Utilitários
│   └── prisma/          # Schema do banco
└── INTEGRATION_GUIDE.md # Este arquivo
```

#### Scripts Úteis:
```bash
# Frontend
python -m http.server 8000  # ou npx http-server

# Backend
npm run dev              # Desenvolvimento
npm run build           # Build para produção
npm run db:studio       # Interface do banco
```

### 🐛 Troubleshooting

**Erro de CORS:**
- Verificar `CORS_ORIGIN` no .env
- Certificar que frontend está na porta correta

**Token Inválido:**
- Regenerar token no Facebook Developers
- Verificar permissões do app

**Conexão Backend:**
- Verificar se backend está rodando na porta 3001
- Verificar configuração do banco de dados

**Cache Issues:**
- Limpar localStorage do navegador
- Reiniciar Redis se necessário

### 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do backend
2. Verificar console do navegador
3. Conferir configurações do Facebook App
4. Verificar variáveis de ambiente

---

✅ **Integração completa implementada e funcionando!**