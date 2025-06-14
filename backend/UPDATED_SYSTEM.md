# Updated Website Builder Token System

## 🚀 Major System Updates

### 💰 New Token System

#### **Free Tier**
- **10,000 tokens/month** - automatically resets on the 1st of each month
- Perfect for trying out the service
- Access to all available models

#### **Token Packages** (One-time purchase)
- **$5** → 200,000 tokens
- **$10** → 450,000 tokens  
- **$15** → 1,000,000 tokens
- **$20** → 2,000,000 tokens

#### **Premium Monthly Subscription**
- **$10/month** → 30,000 tokens/day for 30 days
- Total: 900,000 tokens/month
- Best value for daily learners
- Daily limits reset automatically

### 🤖 Available AI Models

#### **OpenRouter (Primary Service)**
**Anthropic Claude Models:**
- Claude 3 Opus (10 tokens) - Most capable
- Claude 3 Sonnet (6 tokens) - Balanced
- Claude 3 Haiku (3 tokens) - Fast & efficient

**OpenAI Models (via OpenRouter):**
- GPT-4 (8 tokens) - Most capable
- GPT-4 Turbo (6 tokens) - Faster GPT-4
- GPT-3.5 Turbo (2 tokens) - Cost-effective

**Google Gemini Models:**
- Gemini Pro (4 tokens) - Advanced reasoning
- Gemini Pro Vision (5 tokens) - With vision capabilities

**Meta Llama Models:**
- Llama 3 70B (4 tokens) - Open-source powerhouse
- Llama 3 8B (2 tokens) - Efficient open-source

**Mistral Models:**
- Mixtral 8x7B (3 tokens) - Mixture of experts
- Mistral 7B (2 tokens) - Efficient European AI

**DeepSeek Models:**
- DeepSeek Chat (2 tokens) - General conversation
- DeepSeek Coder (3 tokens) - Code-specialized

**Microsoft Models:**
- WizardLM 2 8x22B (5 tokens) - Advanced reasoning

#### **Qwen (Chinese AI)**
- Qwen Turbo (1 token) - Ultra-efficient
- Qwen VL Plus (2 tokens) - Vision capabilities  
- Qwen VL Max (3 tokens) - Advanced vision
- Qwen 32B Chat (2 tokens) - Large context

#### **Temporarily Disabled**
- Direct OpenAI API (use via OpenRouter instead)
- Direct Claude API (use via OpenRouter instead)

### 🔧 Backend API Updates

#### **New Endpoints:**
- `GET /api/tokens/packages` - Get all token packages and subscriptions
- `POST /api/subscription/subscribe` - Subscribe to monthly plan
- `GET /api/me` - Enhanced user info with token breakdown

#### **Enhanced User Info Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "subscriptionStatus": "free", // free, premium_monthly, paid_tokens
    "availableTokens": 8500,
    "tokenSource": "free_monthly",
    "resetInfo": {
      "nextReset": "2024-02-01T00:00:00Z",
      "tokensUsedThisMonth": 1500,
      "monthlyLimit": 10000
    }
  }
}
```

#### **Smart Token Management:**
- **Free users**: 10K tokens/month, auto-reset
- **Premium subscribers**: 30K tokens/day, daily reset
- **Token purchasers**: Use purchased tokens until exhausted
- **Automatic fallback**: Free → Paid tokens → Subscription

### 🎯 Usage Examples

#### **Free Tier User:**
- Gets 10,000 tokens on the 1st of each month
- Can use any available model
- When tokens run out, prompted to upgrade

#### **Premium Monthly Subscriber:**
- Gets 30,000 tokens every day
- Perfect for daily learning and experimentation
- Best value at $10/month for 900K tokens

#### **Token Package Buyer:**
- Buy tokens once, use until exhausted
- Great for burst usage or specific projects
- No recurring charges

### 🔐 Environment Variables Required

```bash
# Database
DATABASE_URL=./database.sqlite

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key

# AI API Keys
QWEN_API_KEY=your-qwen-api-key
OPENROUTER_API_KEY=your-openrouter-api-key

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Proxy for China users
PROXY_HOST=127.0.0.1
PROXY_PORT=7890
```

### 🚀 Next Steps

1. **Frontend Integration**: Update UI to show new token system
2. **Payment Pages**: Build Stripe checkout integration
3. **User Dashboard**: Display token usage and subscription status
4. **Model Selector**: Enhanced UI showing all available models
5. **Usage Analytics**: Track token consumption patterns

### 📊 Key Benefits

- **Flexible Pricing**: Free tier, one-time purchases, and subscriptions
- **Model Variety**: 20+ AI models from 7 different providers
- **Smart Routing**: Automatic failover when APIs are unavailable
- **Usage Transparency**: Clear token costs and usage tracking
- **Global Access**: Works in China with proxy support 