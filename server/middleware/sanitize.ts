import { Request, Response, NextFunction } from 'express'

/**
 * Middleware to sanitize user inputs to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (value: any): any => {
    if (typeof value === 'string') {
      // Remove script tags
      let sanitized = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

      // Remove javascript: protocols
      sanitized = sanitized.replace(/javascript:/gi, '')

      // Remove event handlers (onClick, onLoad, etc.)
      sanitized = sanitized.replace(/on\w+\s*=/gi, '')

      // Remove iframe tags
      sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')

      // Remove object and embed tags
      sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')

      // Remove data: URLs that might contain scripts
      sanitized = sanitized.replace(/data:\s*text\/html/gi, '')

      return sanitized.trim()
    }

    if (Array.isArray(value)) {
      return value.map(sanitize)
    }

    if (typeof value === 'object' && value !== null) {
      const sanitizedObj: any = {}
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          sanitizedObj[key] = sanitize(value[key])
        }
      }
      return sanitizedObj
    }

    return value
  }

  // Sanitize request data
  if (req.body) req.body = sanitize(req.body)
  if (req.query) req.query = sanitize(req.query)
  if (req.params) req.params = sanitize(req.params)

  next()
}