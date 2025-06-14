# 🌟 Website Builder by Yumi

A powerful AI-powered website builder with advanced token-based pricing system and support for 20+ AI models.

## ✨ Features

### 💰 Flexible Token System
- **Free Tier**: 10,000 tokens/month (auto-reset)
- **Token Packages**: One-time purchases from $5 (200K tokens) to $20 (2M tokens)
- **Premium Monthly**: $10/month for 30K daily tokens (900K/month total)

### 🤖 AI Model Support
**20+ AI Models from 7 Providers:**
- **Claude**: Opus, Sonnet, Haiku (via OpenRouter)
- **GPT**: GPT-4, GPT-4 Turbo, GPT-3.5 (via OpenRouter)
- **Gemini**: Pro, Pro Vision (via OpenRouter)
- **Llama**: 3 70B, 3 8B (via OpenRouter)
- **Others**: Mistral, DeepSeek, WizardLM, Qwen

### 🚀 Technical Features
- **Full-Stack SaaS**: Node.js/Express backend + React frontend
- **Authentication**: JWT-based with secure cookies
- **Payments**: Stripe integration for subscriptions & one-time purchases
- **Database**: SQLite with comprehensive user/transaction tracking
- **Smart Routing**: Automatic failover between AI providers
- **China Support**: Proxy configuration for mainland China users

## 🏗️ Architecture

```
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── index.ts        # Main server & API routes
│   │   ├── database.ts     # SQLite database layer
│   │   ├── auth.ts         # JWT authentication & token management
│   │   └── stripe.ts       # Payment processing
│   └── package.json
│
├── frontend/               # React/Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── store/         # State management
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- SQLite3

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Environment configuration:**
```bash
# Create .env file with:
JWT_SECRET=your-super-secret-jwt-key
QWEN_API_KEY=your-qwen-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional for China users:
PROXY_HOST=127.0.0.1
PROXY_PORT=7890
```

3. **Start the server:**
```bash
npm run dev
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/me` - Get user info & token balance

### Payments
- `GET /api/tokens/packages` - Get available packages & subscriptions
- `POST /api/tokens/purchase` - Purchase token package
- `POST /api/subscription/subscribe` - Subscribe to monthly plan
- `POST /api/tokens/portal` - Access Stripe customer portal

### AI Chat
- `POST /api/chat` - Send message to AI (supports 20+ models)
- `GET /api/models` - Get available AI models

## 💳 Token Pricing

| Plan | Price | Tokens | Best For |
|------|-------|--------|----------|
| Free | $0 | 10K/month | Trying out |
| Starter | $5 | 200K | Light usage |
| Standard | $10 | 450K | Regular users |
| Premium | $15 | 1M | Power users |
| Enterprise | $20 | 2M | Heavy usage |
| **Monthly** | **$10/month** | **30K daily** | **Daily learners** |

## 🔧 Model Costs

| Model Category | Cost (tokens) | Examples |
|----------------|---------------|----------|
| Ultra Efficient | 1-2 | Qwen Turbo, GPT-3.5, Llama 8B |
| Standard | 3-4 | Claude Haiku, Gemini Pro, Mixtral |
| Advanced | 5-7 | GPT-4 Turbo, Claude Sonnet |
| Premium | 8-10 | GPT-4, Claude Opus |

## 🌐 Deployment

### Backend Deployment
- Deploy to Railway, Render, or AWS
- Set environment variables
- Configure Stripe webhooks

### Frontend Deployment  
- Deploy to Vercel, Netlify, or Cloudflare Pages
- Update API base URL
- Configure domain

## 🔐 Security Features

- **JWT Authentication** with secure httpOnly cookies
- **Password Hashing** with bcrypt
- **Environment Variables** for sensitive data
- **CORS Protection** with whitelist
- **Stripe Webhook Verification**
- **SQL Injection Protection** with parameterized queries

## 🌍 China Support

The system includes built-in proxy support for mainland China users:

```bash
# Add to .env
PROXY_HOST=127.0.0.1
PROXY_PORT=7890
```

## 📈 Usage Analytics

Track comprehensive usage data:
- Token consumption per model
- User subscription patterns
- Revenue analytics
- Popular AI models
- Geographic usage patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙋‍♀️ Support

For questions or support:
- Open an issue on GitHub
- Contact: [Your Email]
- Documentation: [Your Docs URL]

---

**Built with ❤️ by Yumi** | Powered by 20+ AI Models | Made for Developers Worldwide 🌟