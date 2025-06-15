import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import OpenAI from 'openai'
import { HttpsProxyAgent } from 'https-proxy-agent'
import cookieParser from 'cookie-parser'
import { db } from './database'
import { 
  authenticateUser, 
  optionalAuth, 
  generateToken, 
  hashPassword, 
  comparePassword, 
  calculateTokenCost, 
  deductTokens,
  FREE_TIER,
  AuthRequest 
} from './auth'
import { 
  createCheckoutSession, 
  createSubscriptionSession,
  createPortalSession, 
  processWebhookEvent, 
  verifyWebhookSignature, 
  TOKEN_PACKAGES,
  SUBSCRIPTION_PLANS,
  TokenPackageId 
} from './stripe'



// Initialize database
db.initialize().catch(console.error)

const app = express()
const port = process.env.PORT || 3000

// Proxy configuration for mainland China users
const proxyConfig = process.env.PROXY_HOST && process.env.PROXY_PORT ? {
  httpAgent: new HttpsProxyAgent(`http://${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`),
  httpsAgent: new HttpsProxyAgent(`http://${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`)
} : {}

// Initialize OpenAI with proxy support
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  ...proxyConfig
})

// Initialize OpenRouter client with proxy support
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  ...proxyConfig
})

// Initialize Qwen client with proxy support
const qwen = new OpenAI({
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: process.env.QWEN_API_KEY,
  ...proxyConfig
})

// CORS configuration to support your domain
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://yumi77965.online',
    'http://yumi77965.online',
    `http://192.168.40.100:5173`,
    `http://192.168.40.100:3000`
  ],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json())

// Raw body parsing for Stripe webhooks
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }))

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  message?: string // Keep for backward compatibility
  messages?: ChatMessage[] // New messages array support
  mode: 'agent' | 'assistant'
  provider?: 'openai' | 'openrouter' | 'qwen' | 'claude'
  model?: string
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    proxy: process.env.PROXY_HOST ? `${process.env.PROXY_HOST}:${process.env.PROXY_PORT}` : 'disabled',
    domain: 'yumi77965.online'
  })
})

// Auth endpoints
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const user = await db.createUser(email, username, passwordHash)

    // Generate token
    const token = generateToken(user.id)

    // Set cookie and return user info
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tokensRemaining: user.tokensRemaining,
        subscriptionStatus: user.subscriptionStatus
      },
      token
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user and verify password
    const user = await db.getUserByEmail(email)
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate token
    const token = generateToken(user.id)

    // Set cookie and return user info
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tokensRemaining: user.tokensRemaining,
        subscriptionStatus: user.subscriptionStatus
      },
      token
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('authToken')
  res.json({ message: 'Logged out successfully' })
})

// Get current user info
app.get('/api/me', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!
    const transactions = await db.getUserTokenTransactions(user.id, 10)
    
    // Calculate available tokens based on subscription type
    let availableTokens = 0
    let tokenSource = 'none'
    let resetInfo = null

    if (user.subscriptionStatus === 'free') {
      const freeTokensLeft = FREE_TIER.MONTHLY_TOKENS - user.freeTokensUsedThisMonth
      availableTokens = Math.max(0, freeTokensLeft)
      tokenSource = 'free_monthly'
      resetInfo = {
        nextReset: user.freeTokensResetDate,
        tokensUsedThisMonth: user.freeTokensUsedThisMonth,
        monthlyLimit: FREE_TIER.MONTHLY_TOKENS
      }
    } else if (user.subscriptionStatus === 'premium_monthly') {
      availableTokens = user.dailyTokenLimit || 0
      tokenSource = 'premium_daily'
      resetInfo = {
        nextReset: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        dailyLimit: 30000,
        tokensLeftToday: user.dailyTokenLimit || 0
      }
    } else if (user.subscriptionStatus === 'paid_tokens') {
      availableTokens = user.tokensRemaining
      tokenSource = 'purchased'
    }
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tokensRemaining: user.tokensRemaining,
        totalTokensUsed: user.totalTokensUsed,
        subscriptionStatus: user.subscriptionStatus,
        availableTokens,
        tokenSource,
        resetInfo
      },
      recentTransactions: transactions
    })
  } catch (error: any) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user info' })
  }
})

// Payment endpoints
app.get('/api/tokens/packages', (req: Request, res: Response) => {
  res.json({
    packages: TOKEN_PACKAGES,
    subscriptions: SUBSCRIPTION_PLANS,
    freeTier: {
      monthlyTokens: FREE_TIER.MONTHLY_TOKENS,
      description: `${FREE_TIER.MONTHLY_TOKENS.toLocaleString()} free tokens per month`
    }
  })
})

app.post('/api/tokens/purchase', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const { packageId } = req.body
    const user = req.user!

    if (!TOKEN_PACKAGES[packageId as TokenPackageId]) {
      return res.status(400).json({ error: 'Invalid package' })
    }

    const successUrl = `${req.headers.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${req.headers.origin}/payment/cancel`

    const checkout = await createCheckoutSession(
      user.id,
      packageId,
      successUrl,
      cancelUrl
    )

    res.json(checkout)
  } catch (error: any) {
    console.error('Purchase error:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

app.post('/api/subscription/subscribe', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.body
    const user = req.user!

    if (!SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
      return res.status(400).json({ error: 'Invalid subscription plan' })
    }

    const successUrl = `${req.headers.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${req.headers.origin}/payment/cancel`

    const checkout = await createSubscriptionSession(
      user.id,
      planId,
      successUrl,
      cancelUrl
    )

    res.json(checkout)
  } catch (error: any) {
    console.error('Subscription error:', error)
    res.status(500).json({ error: 'Failed to create subscription session' })
  }
})

app.post('/api/tokens/portal', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!
    const returnUrl = `${req.headers.origin}/settings`

    const portal = await createPortalSession(user.id, returnUrl)
    res.json(portal)
  } catch (error: any) {
    console.error('Portal error:', error)
    res.status(500).json({ error: 'Failed to create portal session' })
  }
})

// Stripe webhook endpoint
app.post('/api/webhooks/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string
  const body = req.body.toString()

  if (!verifyWebhookSignature(body, signature)) {
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    const event = JSON.parse(body)
    await processWebhookEvent(event)
    res.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

// Get available models endpoint
app.get('/api/models', (req: Request, res: Response) => {
  const models = {
    // Available models (via OpenRouter and Qwen)
    openrouter: {
      enabled: true,
      models: [
        // Anthropic Claude models
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', cost: 10, category: 'Claude' },
        { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', cost: 6, category: 'Claude' },
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', cost: 3, category: 'Claude' },
        
        // OpenAI models (via OpenRouter)
        { id: 'openai/gpt-4', name: 'GPT-4', cost: 8, category: 'OpenAI' },
        { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', cost: 6, category: 'OpenAI' },
        { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', cost: 2, category: 'OpenAI' },
        
        // Google Gemini models
        { id: 'google/gemini-pro', name: 'Gemini Pro', cost: 4, category: 'Google' },
        { id: 'google/gemini-pro-vision', name: 'Gemini Pro Vision', cost: 5, category: 'Google' },
        
        // Meta Llama models
        { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', cost: 4, category: 'Meta' },
        { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B', cost: 2, category: 'Meta' },
        
        // Mistral models
        { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B', cost: 3, category: 'Mistral' },
        { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', cost: 2, category: 'Mistral' },
        
        // DeepSeek models (if available on OpenRouter)
        { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', cost: 2, category: 'DeepSeek' },
        { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', cost: 3, category: 'DeepSeek' },
        
        // Microsoft models
        { id: 'microsoft/wizardlm-2-8x22b', name: 'WizardLM 2 8x22B', cost: 5, category: 'Microsoft' }
      ]
    },
    qwen: {
      enabled: true,
      models: [
        { id: 'qwen-turbo', name: 'Qwen Turbo', cost: 1, category: 'Qwen' },
        { id: 'qwen-vl-plus', name: 'Qwen VL Plus', cost: 2, category: 'Qwen' },
        { id: 'qwen-vl-max', name: 'Qwen VL Max', cost: 3, category: 'Qwen' },
        { id: 'qwen-32b-chat', name: 'Qwen 32B Chat', cost: 2, category: 'Qwen' }
      ]
    },
    
    // Locked services (show but disabled)
    openai: {
      enabled: false,
      locked: true,
      reason: 'Direct OpenAI API temporarily disabled. Use OpenAI models via OpenRouter instead.',
      models: [
        { id: 'gpt-4', name: 'GPT-4', cost: 8, category: 'OpenAI' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', cost: 6, category: 'OpenAI' },
        { id: 'gpt-4o', name: 'GPT-4o', cost: 5, category: 'OpenAI' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', cost: 2, category: 'OpenAI' }
      ]
    },
    claude: {
      enabled: false,
      locked: true,
      reason: 'Direct Claude API temporarily disabled. Use Claude models via OpenRouter instead.',
      models: [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', cost: 10, category: 'Claude' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', cost: 6, category: 'Claude' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', cost: 3, category: 'Claude' },
        { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', cost: 7, category: 'Claude' }
      ]
    }
  }
  res.json(models)
})

// Chat endpoint (with optional authentication)
app.post('/api/chat', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { message, messages, mode, provider = 'qwen', model }: ChatRequest = req.body
    const user = req.user

    // Support both single message and messages array
    if (!message && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'Message or messages array is required' })
    }

    // Calculate token cost
    const inputText = messages ? messages.map(m => m.content).join(' ') : message
    const tokenCost = calculateTokenCost(model || 'qwen-turbo', inputText?.length || 100)

    // If user is authenticated, check and deduct tokens
    if (user) {
      const deductionResult = await deductTokens(
        user.id,
        tokenCost,
        model || 'qwen-turbo',
        `Chat message - ${provider} ${model}`
      )

      if (!deductionResult.success) {
        return res.status(402).json({ 
          error: deductionResult.error,
          tokensRequired: tokenCost,
          tokensRemaining: user.tokensRemaining
        })
      }
    }

    let client: OpenAI
    let selectedModel: string

    // Select client and model based on provider
    switch (provider) {
      case 'openai':
        return res.status(400).json({ 
          error: 'Direct OpenAI API temporarily disabled',
          suggestion: 'Use OpenAI models via OpenRouter instead',
          alternatives: ['openai/gpt-4', 'openai/gpt-4-turbo', 'openai/gpt-3.5-turbo']
        })
      case 'claude':
        return res.status(400).json({ 
          error: 'Direct Claude API temporarily disabled',
          suggestion: 'Use Claude models via OpenRouter instead',
          alternatives: ['anthropic/claude-3-opus', 'anthropic/claude-3-sonnet', 'anthropic/claude-3-haiku']
        })
      case 'openrouter':
        client = openrouter
        selectedModel = model || 'anthropic/claude-3-sonnet'
        if (!process.env.OPENROUTER_API_KEY) {
          return res.status(400).json({ error: 'OpenRouter API key not configured' })
        }
        break
      case 'qwen':
      default:
        client = qwen
        selectedModel = model || 'qwen-turbo'
        if (!process.env.QWEN_API_KEY) {
          return res.status(400).json({ error: 'Qwen API key not configured' })
        }
        break
    }

    const systemPrompt = mode === 'agent' 
      ? `You are Yumi, a helpful website building assistant with a cute anime-style personality. Guide users through creating their website step by step. Ask one question at a time and provide clear, actionable guidance. Focus on:
        1. Understanding their website purpose and goals
        2. Choosing appropriate design style and colors (suggest cute, modern themes)
        3. Planning website structure and pages
        4. Selecting content and features
        5. Recommending integrations and functionality
        
        Be friendly, encouraging, and break down complex tasks into simple steps. Use emojis occasionally to make the conversation more engaging! 🌟`
      : `You are Yumi, a technical assistant that helps users build websites through natural language commands. You have a cute anime-style personality but are also highly skilled technically. You can:
        1. Generate HTML, CSS, and JavaScript code
        2. Create React components
        3. Modify existing code based on user requests
        4. Provide code explanations and best practices
        5. Help with responsive design and modern web standards
        
        Always provide clean, modern, and functional code. Include comments when helpful and suggest cute, anime-inspired design elements when appropriate! ✨`

    // Build the conversation messages
    const conversationMessages: any[] = [
      {
        role: "system",
        content: systemPrompt
      }
    ]

    // Add conversation history if messages array is provided
    if (messages && messages.length > 0) {
      conversationMessages.push(...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })))
    } else if (message) {
      // Fallback to single message for backward compatibility
      conversationMessages.push({
        role: "user",
        content: message
      })
    }

    const completion = await client.chat.completions.create({
      model: selectedModel,
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 2000,
    })

    const response = {
      response: completion.choices[0].message.content,
      provider,
      model: selectedModel,
      tokensUsed: user ? tokenCost : undefined,
      tokensRemaining: user ? (await db.getUserById(user.id))?.tokensRemaining : undefined
    }

    // Save chat history for authenticated users
    if (user && messages) {
      try {
        await db.saveChatHistory(
          user.id,
          `session-${Date.now()}`, // Simple session ID
          messages,
          provider,
          selectedModel,
          mode,
          tokenCost
        )
      } catch (error) {
        console.error('Failed to save chat history:', error)
        // Don't fail the request if history saving fails
      }
    }

    res.json(response)
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    })
  }
})

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`🌟 Yumi's Website Builder Backend running at:`)
  console.log(`   Local:    http://localhost:${port}`)
  console.log(`   Network:  http://${process.env.LOCAL_IP || '192.168.40.100'}:${port}`)
  console.log(`   Domain:   https://yumi77965.online`)
  console.log(`   Proxy:    ${process.env.PROXY_HOST ? `${process.env.PROXY_HOST}:${process.env.PROXY_PORT}` : 'Disabled'}`)
  console.log('Available providers: OpenAI, OpenRouter, Qwen')
}) 