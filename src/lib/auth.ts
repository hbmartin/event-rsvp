/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"
import { executeQuery } from "./database"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret"

export interface User {
  id: number
  name: string
  email: string
  role: "user" | "admin"
  avatar_url?: string
  created_at: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const results = (await executeQuery(
      "SELECT id, name, email, role, avatar_url, created_at FROM users WHERE email = $1",
      [email],
    )) as any[]

    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const results = (await executeQuery(
      "SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1",
      [id],
    )) as any[]

    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function createUser(name: string, email: string, password: string): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(password)
    const result = (await executeQuery("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id", [
      name,
      email,
      hashedPassword,
    ])) as any

    if (result.rows && result.rows.length > 0) {
      return getUserById(result.rows[0].id)
    }
    return null
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

export async function verifyAuth(request: NextRequest): Promise<User | null> {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("auth-token")?.value

    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    const user = await getUserById(decoded.id)
    return user
  } catch (error) {
    console.error("Error verifying auth:", error)
    return null
  }
}
