import Stripe from 'stripe'
import { db } from './database'
import { addTokens } from './auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

// Token packages with new pricing structure
export const TOKEN_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 200000,
    price: 500, // $5.00 in cents
    description: '200,000 tokens - Perfect for getting started!'
  },
  standard: {
    id: 'standard',
    name: 'Standard Pack',
    tokens: 450000,
    price: 1000, // $10.00 in cents
    description: '450,000 tokens - Great for regular users'
  },
  premium: {
    id: 'premium',
    name: 'Premium Pack',
    tokens: 1000000,
    price: 1500, // $15.00 in cents
    description: '1,000,000 tokens - Best value for power users'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Pack',
    tokens: 2000000,
    price: 2000, // $20.00 in cents
    description: '2,000,000 tokens - For businesses and heavy usage'
  }
} as const

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  premium_monthly: {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    tokensPerDay: 30000,
    price: 1000, // $10.00 in cents per month
    description: '30,000 tokens/day for 30 days (900,000 tokens/month)',
    interval: 'month' as const
  }
} as const

export type TokenPackageId = keyof typeof TOKEN_PACKAGES

// Create Stripe checkout session
export async function createCheckoutSession(
  userId: number,
  packageId: TokenPackageId,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const user = await db.getUserById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  const package_ = TOKEN_PACKAGES[packageId]
  if (!package_) {
    throw new Error('Invalid package')
  }

  // Create or get Stripe customer
  let stripeCustomerId = user.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id.toString(),
        username: user.username
      }
    })
    stripeCustomerId = customer.id
    await db.updateUserStripeInfo(userId, stripeCustomerId)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: package_.name,
            description: package_.description,
            images: ['https://yumi77965.online/yumi-token-icon.png'], // Optional: add token icon
          },
          unit_amount: package_.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: userId.toString(),
      packageId: packageId,
      tokens: package_.tokens.toString(),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  if (!session.id || !session.url) {
    throw new Error('Failed to create checkout session')
  }

  return {
    sessionId: session.id,
    url: session.url
  }
}

// Create subscription checkout session
export async function createSubscriptionSession(
  userId: number,
  planId: keyof typeof SUBSCRIPTION_PLANS,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const user = await db.getUserById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  const plan = SUBSCRIPTION_PLANS[planId]
  if (!plan) {
    throw new Error('Invalid subscription plan')
  }

  // Create or get Stripe customer
  let stripeCustomerId = user.stripeCustomerId
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id.toString(),
        username: user.username
      }
    })
    stripeCustomerId = customer.id
    await db.updateUserStripeInfo(userId, stripeCustomerId)
  }

  // Create subscription checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.price,
          recurring: {
            interval: plan.interval,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: userId.toString(),
      planId: planId,
      type: 'subscription',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  if (!session.id || !session.url) {
    throw new Error('Failed to create subscription session')
  }

  return {
    sessionId: session.id,
    url: session.url
  }
}

// Handle successful payment webhook
export async function handleSuccessfulPayment(session: Stripe.Checkout.Session): Promise<void> {
  const userId = parseInt(session.metadata?.userId || '0')
  const type = session.metadata?.type || 'token_purchase'

  if (!userId) {
    console.error('Invalid payment metadata:', session.metadata)
    return
  }

  try {
    if (type === 'subscription') {
      // Handle subscription activation
      const planId = session.metadata?.planId
      if (planId === 'premium_monthly') {
        // Activate premium monthly subscription
        await db.runRawSQL(
          'UPDATE users SET subscriptionStatus = ?, subscriptionId = ?, dailyTokenLimit = 30000, lastDailyReset = ? WHERE id = ?',
          ['premium_monthly', session.subscription, new Date().toISOString(), userId]
        )
        
        console.log(`Successfully activated premium monthly subscription for user ${userId}`)
      }
    } else {
      // Handle one-time token purchase
      const packageId = session.metadata?.packageId as TokenPackageId
      const tokens = parseInt(session.metadata?.tokens || '0')

      if (!packageId || !tokens) {
        console.error('Invalid token purchase metadata:', session.metadata)
        return
      }

      const package_ = TOKEN_PACKAGES[packageId]
      if (!package_) {
        console.error('Invalid package ID:', packageId)
        return
      }

      // Add tokens to user account and update subscription status
      const result = await addTokens(
        userId,
        tokens,
        `Token purchase: ${package_.name}`,
        session.payment_intent as string
      )

      if (result.success) {
        // Update user to paid tokens status
        await db.runRawSQL(
          'UPDATE users SET subscriptionStatus = ? WHERE id = ?',
          ['paid_tokens', userId]
        )
        console.log(`Successfully added ${tokens} tokens to user ${userId}. New balance: ${result.newBalance}`)
      } else {
        console.error('Failed to add tokens:', result.error)
      }
    }
  } catch (error) {
    console.error('Error processing successful payment:', error)
  }
}

// Create Stripe portal session for subscription management
export async function createPortalSession(
  userId: number,
  returnUrl: string
): Promise<{ url: string }> {
  const user = await db.getUserById(userId)
  if (!user || !user.stripeCustomerId) {
    throw new Error('User not found or no Stripe customer')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  })

  return { url: session.url }
}

// Verify webhook signature
export function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured')
      return false
    }

    stripe.webhooks.constructEvent(body, signature, webhookSecret)
    return true
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return false
  }
}

// Process Stripe webhook events
export async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  console.log('Processing Stripe webhook event:', event.type)

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      await handleSuccessfulPayment(session)
      break

    case 'invoice.payment_succeeded':
      // Handle subscription renewals - simplified approach using customer email
      const invoice = event.data.object as Stripe.Invoice
      console.log('Invoice payment succeeded:', invoice.id)
      if (invoice.customer_email) {
        const user = await db.getUserByEmail(invoice.customer_email)
        if (user && user.subscriptionStatus === 'premium_monthly') {
          // Reset daily tokens for premium monthly users
          await db.runRawSQL(
            'UPDATE users SET dailyTokenLimit = 30000, lastDailyReset = ? WHERE id = ?',
            [new Date().toISOString(), user.id]
          )
          console.log(`Daily tokens reset for premium user ${user.id}`)
        }
      }
      break

    case 'customer.subscription.updated':
      // Handle subscription changes
      const updatedSub = event.data.object as Stripe.Subscription
      console.log('Subscription updated:', updatedSub.id)
      break

    case 'customer.subscription.deleted':
      // Handle subscription cancellations
      const deletedSub = event.data.object as Stripe.Subscription
      const userId = parseInt(deletedSub.metadata?.userId || '0')
      if (userId) {
        // Revert user to free tier
        await db.runRawSQL(
          'UPDATE users SET subscriptionStatus = ?, subscriptionId = NULL, dailyTokenLimit = NULL, lastDailyReset = NULL WHERE id = ?',
          ['free', userId]
        )
        console.log(`Subscription cancelled for user ${userId}, reverted to free tier`)
      }
      break

    default:
      console.log('Unhandled webhook event type:', event.type)
  }
}

export { stripe } 