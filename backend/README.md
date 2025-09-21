# Layer Reports Backend

Node.js backend API for Layer Reports - Facebook Ads Dashboard

## 🚀 Features

- **Facebook Ads Integration** - Complete integration with Facebook Graph API
- **JWT Authentication** - Secure user authentication and session management
- **Campaign Management** - Sync and manage Facebook ad campaigns
- **Real-time Insights** - Fetch and cache campaign performance data
- **PostgreSQL Database** - Robust data storage with Prisma ORM
- **Redis Caching** - Fast data retrieval and API rate limiting
- **TypeScript** - Full type safety and better developer experience

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 6+ (optional, for caching)
- Facebook Developer Account

## 🛠️ Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/layer_reports"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key"
   
   # Facebook App
   FACEBOOK_APP_ID="your-facebook-app-id"
   FACEBOOK_APP_SECRET="your-facebook-app-secret"
   
   # Redis (optional)
   REDIS_URL="redis://localhost:6379"
   ```

4. **Set up database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/facebook` | Facebook OAuth callback |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/verify` | Verify JWT token |

### Accounts Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | Get user's Facebook ad accounts |
| POST | `/api/accounts/sync/:accountId` | Sync account to dashboard |
| GET | `/api/accounts/:accountId` | Get account details |
| PUT | `/api/accounts/:accountId` | Update account settings |
| DELETE | `/api/accounts/:accountId` | Remove account |
| GET | `/api/accounts/:accountId/permissions` | Get account permissions |

### Campaigns Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns/:accountId` | Get campaigns for account |
| GET | `/api/campaigns/:accountId/:campaignId` | Get campaign details |
| POST | `/api/campaigns/:accountId/sync` | Sync campaigns from Facebook |
| PATCH | `/api/campaigns/:accountId/:campaignId/status` | Update campaign status |

### Insights Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights/account/:accountId` | Get account-level insights |
| GET | `/api/insights/campaign/:accountId/:campaignId` | Get campaign insights |
| POST | `/api/insights/campaigns/batch` | Get insights for multiple campaigns |
| POST | `/api/insights/campaign/:accountId/:campaignId/sync` | Sync campaign insights |

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
```

### Database Schema

The database includes the following main entities:
- **Users** - User accounts and Facebook integration
- **Accounts** - Facebook ad accounts
- **Campaigns** - Facebook ad campaigns
- **Campaign Insights** - Daily performance metrics
- **Sessions** - JWT session management
- **Cache Entries** - Redis fallback caching

### Facebook App Setup

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add "Facebook Login" product
3. Add "Marketing API" product
4. Configure OAuth redirect URIs
5. Get App ID and App Secret
6. Request appropriate permissions:
   - `ads_read` - Read ad data
   - `ads_management` - Manage ads (optional)

## 🚦 API Usage Examples

### Authentication Flow

```javascript
// 1. Register/Login to get JWT token
const response = await fetch('/api/auth/facebook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: 'facebook_access_token',
    userID: 'facebook_user_id'
  })
});

const { token } = await response.json();

// 2. Use token in subsequent requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Get Campaign Data

```javascript
// Get user's ad accounts
const accounts = await fetch('/api/accounts', { headers });

// Get campaigns for an account
const campaigns = await fetch('/api/campaigns/act_123456789?status=ACTIVE', { headers });

// Get campaign insights
const insights = await fetch('/api/insights/campaign/act_123456789/123456789?startDate=2024-01-01&endDate=2024-01-31', { headers });
```

## 🔒 Security Features

- **JWT Authentication** with secure session management
- **Rate Limiting** to prevent API abuse
- **Input Validation** on all endpoints
- **CORS Configuration** for frontend integration
- **Helmet.js** for security headers
- **Facebook Token Validation** for API calls

## 📊 Caching Strategy

The backend implements a multi-layer caching strategy:

1. **Redis Cache** - Fast in-memory caching for API responses
2. **Database Cache** - Persistent storage of insights data
3. **Facebook API Rate Limiting** - Respects Facebook's rate limits

Cache TTL:
- Ad Accounts: 1 hour
- Campaigns: 5 minutes
- Insights: 10 minutes

## 🚀 Deployment

### Production Environment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up Redis instance
4. Configure Facebook app for production domain
5. Use process manager (PM2, Docker, etc.)

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://user:password@db-host:5432/layer_reports"
REDIS_URL="redis://redis-host:6379"
JWT_SECRET="production-secret-key"
FACEBOOK_APP_ID="production-app-id"
FACEBOOK_APP_SECRET="production-app-secret"
CORS_ORIGIN="https://yourdomain.com"
```

## 🐛 Error Handling

The API returns consistent error responses:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "details": { /* Additional error context */ }
  }
}
```

Common error codes:
- `AUTH_REQUIRED` - Authentication needed
- `INVALID_TOKEN` - JWT token invalid/expired
- `FACEBOOK_TOKEN_EXPIRED` - Facebook token needs refresh
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `VALIDATION_ERROR` - Input validation failed

## 📈 Performance

- **Response Times**: < 200ms for cached data
- **Rate Limits**: 100 requests per 15 minutes per IP
- **Database Queries**: Optimized with proper indexing
- **Caching**: Reduces Facebook API calls by 80%

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

MIT License