/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool } from "pg"

// Use Replit's DATABASE_URL or construct from individual variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Replit's internal database doesn't require SSL
})

export async function executeQuery(query: string, params: any[] = []) {
  try {
    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

export async function getUserById(userId: number) {
  try {
    const query = "SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1"
    const results = (await executeQuery(query, [userId])) as any[]
    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    throw error
  }
}

export async function updateUser(userId: number, userData: { name?: string; email?: string; avatar_url?: string }) {
  try {
    const fields = []
    const values = []
    let paramIndex = 1

    if (userData.name) {
      fields.push(`name = $${paramIndex}`)
      values.push(userData.name)
      paramIndex++
    }

    if (userData.email) {
      fields.push(`email = $${paramIndex}`)
      values.push(userData.email)
      paramIndex++
    }

    if (userData.avatar_url !== undefined) {
      fields.push(`avatar_url = $${paramIndex}`)
      values.push(userData.avatar_url)
      paramIndex++
    }

    if (fields.length === 0) {
      throw new Error("No fields to update")
    }

    values.push(userId)

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex}`
    await executeQuery(query, values)

    // Return updated user data
    return await getUserById(userId)
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export default pool
