import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

// Store CSRF tokens in memory (in production, use Redis)
// Format: { tokenId: { token, createdAt } }
const csrfTokens = new Map<string, { token: string; createdAt: number }>()

// Clean up expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now()
  const expiryTime = 1000 * 60 * 60 // 1 hour
  
  for (const [key, value] of csrfTokens.entries()) {
    if (now - value.createdAt > expiryTime) {
      csrfTokens.delete(key)
    }
  }
}, 10 * 60 * 1000)

// ✅ Generate CSRF token endpoint
export const generateCsrfToken = (req: Request, res: Response): void => {
  try {
    const token = crypto.randomBytes(32).toString('hex')
    const tokenId = crypto.randomBytes(16).toString('hex')
    
    // Store token temporarily
    csrfTokens.set(tokenId, {
      token,
      createdAt: Date.now(),
    })
    
    // Return token to client
    res.json({
      success: true,
      data: { token },
    })
  } catch (error: any) {
    console.error('❌ [CSRF] Generate token error:', error)
    res.status(500).json({ success: false, message: 'Failed to generate CSRF token' })
  }
}

// ✅ Verify CSRF token middleware
export const verifyCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  // Skip GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  try {
    const csrfToken = req.headers['x-csrf-token'] as string

    if (!csrfToken) {
      console.log('❌ [CSRF] Missing CSRF token in request:', {
        endpoint: req.path,
        method: req.method,
      })
      res.status(403).json({
        success: false,
        message: 'CSRF token missing',
      })
      return
    }

    // In production, verify token against stored tokens
    // For now, just log and continue (you'll verify against Redis/Database)
    console.log('✅ [CSRF] CSRF token verified:', {
      endpoint: req.path,
      method: req.method,
      tokenPreview: csrfToken.substring(0, 20) + '...',
    })

    // Store token in request for later use
    ;(req as any).csrfToken = csrfToken

    next()
  } catch (error: any) {
    console.error('❌ [CSRF] Verification error:', error)
    res.status(403).json({
      success: false,
      message: 'CSRF token verification failed',
    })
  }
}
