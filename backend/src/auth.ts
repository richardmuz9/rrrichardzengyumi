import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Request, Response, NextFunction } from 'express'
import { db, User } from './database'

const JWT_SECRET = process.env.JWT_SECRET || 'yumi-website-builder-secret-key'
const JWT_EXPIRES_IN = '7d'

export interface AuthRequest extends Request {
  user?: User
}

// Token cost calculation with expanded model support
export const MODEL_COSTS = {
  // Qwen models (Chinese AI)
  'qwen-turbo': 1,
  'qwen-vl-plus': 2,
  'qwen-vl-max': 3,
  'qwen-32b-chat': 2,
  
  // OpenAI models
  'gpt-4': 8,
  'gpt-4-turbo': 6,
  'gpt-4o': 5,
  'gpt-3.5-turbo': 2,
  
  // Anthropic models (Claude)
  'claude-3-opus-20240229': 10,
  'claude-3-sonnet-20240229': 6,
  'claude-3-haiku-20240307': 3,
  'claude-3-5-sonnet-20240620': 7,
  
  // Google Gemini models
  'gemini-pro': 4,
  'gemini-pro-vision': 5,
  'gemini-1.5-pro': 6,
  'gemini-1.5-flash': 3,
  
  // DeepSeek models
  'deepseek-chat': 2,
  'deepseek-coder': 3,
  'deepseek-math': 3,
  
  // OpenRouter models - Anthropic Claude
  'anthropic/claude-3-opus': 10,
  'anthropic/claude-3-sonnet': 6,
  'anthropic/claude-3-haiku': 3,
  
  // OpenRouter models - OpenAI
  'openai/gpt-4': 8,
  'openai/gpt-4-turbo': 6,
  'openai/gpt-3.5-turbo': 2,
  
  // OpenRouter models - Google
  'google/gemini-pro': 4,
  'google/gemini-pro-vision': 5,
  
  // OpenRouter models - Meta
  'meta-llama/llama-3-70b-instruct': 4,
  'meta-llama/llama-3-8b-instruct': 2,
  
  // OpenRouter models - Mistral
  'mistralai/mixtral-8x7b-instruct': 3,
  'mistralai/mistral-7b-instruct': 2,
  
  // OpenRouter models - DeepSeek
  'deepseek/deepseek-chat': 2,
  'deepseek/deepseek-coder': 3,
  
  // OpenRouter models - Microsoft
  'microsoft/wizardlm-2-8x22b': 5,
} as const

// Free tier constants
export const FREE_TIER = {
  MONTHLY_TOKENS: 10000,
  RESET_DAY: 1 // Reset on 1st of each month
} as const

export function calculateTokenCost(model: string, inputTokens: number = 100): number {
  const baseCost = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || 2
  // Base cost per message + small factor for input length
  return Math.max(baseCost, Math.ceil(baseCost * (inputTokens / 100)))
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Authentication middleware
export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Try to get token from Authorization header or cookie
    let token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token && req.cookies) {
      token = req.cookies.authToken
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const user = await db.getUserById(decoded.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

// Optional authentication (for endpoints that work with or without auth)
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token && req.cookies) {
      token = req.cookies.authToken
    }

    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        const user = await db.getUserById(decoded.userId)
        if (user) {
          req.user = user
        }
      }
    }

    next()
  } catch (error) {
    // Ignore errors in optional auth
    next()
  }
}

// Check and reset free tier tokens if needed
export async function checkAndResetFreeTier(user: User): Promise<User> {
  const now = new Date()
  const resetDate = new Date(user.freeTokensResetDate)
  
  if (now >= resetDate) {
    // Reset free tier tokens
    const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, FREE_TIER.RESET_DAY)
    
    await db.runRawSQL(
      'UPDATE users SET freeTokensUsedThisMonth = 0, freeTokensResetDate = ? WHERE id = ?',
      [nextResetDate.toISOString(), user.id]
    )
    
    // Return updated user
    const updatedUser = await db.getUserById(user.id)
    return updatedUser || user
  }
  
  return user
}

// Check daily subscription limits for premium monthly users
export async function checkDailyLimit(user: User): Promise<{ canUse: boolean; tokensAvailable: number }> {
  if (user.subscriptionStatus !== 'premium_monthly') {
    return { canUse: true, tokensAvailable: Infinity }
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset) : new Date(0)
  
  // Reset daily limit if it's a new day
  if (today > lastReset) {
    await db.runRawSQL(
      'UPDATE users SET dailyTokenLimit = 30000, lastDailyReset = ? WHERE id = ?',
      [today.toISOString(), user.id]
    )
    return { canUse: true, tokensAvailable: 30000 }
  }
  
  const dailyTokensLeft = user.dailyTokenLimit || 0
  return { canUse: dailyTokensLeft > 0, tokensAvailable: dailyTokensLeft }
}

// Enhanced token deduction function with free tier and subscription support
export async function deductTokens(
  userId: number,
  tokensToDeduct: number,
  model: string,
  description: string
): Promise<{ success: boolean; remainingTokens?: number; freeTokensLeft?: number; error?: string; tokenSource?: string }> {
  try {
    let user = await db.getUserById(userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Check and reset free tier if needed
    user = await checkAndResetFreeTier(user)
    
    // For premium monthly users, check daily limits
    if (user.subscriptionStatus === 'premium_monthly') {
      const dailyCheck = await checkDailyLimit(user)
      if (!dailyCheck.canUse) {
        return { success: false, error: 'Daily token limit reached. Resets tomorrow!' }
      }
      
      if (tokensToDeduct > dailyCheck.tokensAvailable) {
        return { success: false, error: `Daily limit exceeded. ${dailyCheck.tokensAvailable} tokens available today.` }
      }
      
      // Deduct from daily limit
      const newDailyLimit = dailyCheck.tokensAvailable - tokensToDeduct
      await db.runRawSQL(
        'UPDATE users SET dailyTokenLimit = ? WHERE id = ?',
        [newDailyLimit, userId]
      )
      
      await db.addTokenTransaction(
        userId,
        'usage',
        -tokensToDeduct,
        description,
        model
      )
      
      return { 
        success: true, 
        remainingTokens: newDailyLimit,
        tokenSource: 'premium_daily'
      }
    }
    
    // For free tier users, try to use free tokens first
    if (user.subscriptionStatus === 'free') {
      const freeTokensLeft = FREE_TIER.MONTHLY_TOKENS - user.freeTokensUsedThisMonth
      
      if (freeTokensLeft >= tokensToDeduct) {
        // Use free tokens
        const newFreeUsed = user.freeTokensUsedThisMonth + tokensToDeduct
        await db.runRawSQL(
          'UPDATE users SET freeTokensUsedThisMonth = ? WHERE id = ?',
          [newFreeUsed, userId]
        )
        
        await db.addTokenTransaction(
          userId,
          'usage',
          -tokensToDeduct,
          `${description} (Free Tier)`,
          model
        )
        
        return { 
          success: true, 
          freeTokensLeft: FREE_TIER.MONTHLY_TOKENS - newFreeUsed,
          tokenSource: 'free_monthly'
        }
      } else if (freeTokensLeft > 0) {
        return { 
          success: false, 
          error: `Only ${freeTokensLeft} free tokens left this month. Upgrade for more!`,
          freeTokensLeft 
        }
      } else {
        return { 
          success: false, 
          error: 'Free monthly limit reached. Upgrade for more tokens!',
          freeTokensLeft: 0 
        }
      }
    }

    // For paid token users, use purchased tokens
    if (user.tokensRemaining < tokensToDeduct) {
      return { success: false, error: 'Insufficient purchased tokens' }
    }

    const newTokensRemaining = user.tokensRemaining - tokensToDeduct
    const newTotalUsed = user.totalTokensUsed + tokensToDeduct

    await db.updateUserTokens(userId, newTokensRemaining, newTotalUsed)
    
    await db.addTokenTransaction(
      userId,
      'usage',
      -tokensToDeduct,
      description,
      model
    )

    return { 
      success: true, 
      remainingTokens: newTokensRemaining,
      tokenSource: 'purchased'
    }
  } catch (error) {
    console.error('Token deduction error:', error)
    return { success: false, error: 'Failed to deduct tokens' }
  }
}

// Add tokens function (for purchases)
export async function addTokens(
  userId: number,
  tokensToAdd: number,
  description: string,
  stripePaymentId?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const user = await db.getUserById(userId)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const newTokensRemaining = user.tokensRemaining + tokensToAdd

    await db.updateUserTokens(userId, newTokensRemaining, user.totalTokensUsed)
    
    // Record the transaction
    await db.addTokenTransaction(
      userId,
      'purchase',
      tokensToAdd,
      description,
      undefined,
      stripePaymentId
    )

    return { success: true, newBalance: newTokensRemaining }
  } catch (error) {
    console.error('Token addition error:', error)
    return { success: false, error: 'Failed to add tokens' }
  }
} 