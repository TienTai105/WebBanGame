import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ _id: userId, userId }, JWT_SECRET, { expiresIn: '15m' })
}

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' })
}

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (error) {
    return null
  }
}

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as any
  } catch (error) {
    return null
  }
}
