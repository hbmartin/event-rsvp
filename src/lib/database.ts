/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool } from "pg"

const connectionString = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("Missing SUPABASE_DB_URL/DATABASE_URL for database connection")
}

const pool = new Pool({
  connectionString,
  max: Number(process.env.SUPABASE_DB_POOL_SIZE ?? 10),
  idleTimeoutMillis: Number(process.env.SUPABASE_DB_IDLE_TIMEOUT ?? 10_000),
  connectionTimeoutMillis: Number(process.env.SUPABASE_DB_CONNECTION_TIMEOUT ?? 5_000),
  ssl: connectionString.includes("supabase.co")
    ? { rejectUnauthorized: false }
    : process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
})

pool.on("error", (error) => {
  console.error("Unexpected Supabase Postgres error", error)
})

function stripTrailingSemicolon(query: string) {
  return query.replace(/;\s*$/, "")
}

function parameterizeQuery(query: string, paramsLength: number) {
  let index = 0
  const text = query.replace(/\?/g, () => {
    index += 1
    return `$${index}`
  })

  if (index !== paramsLength) {
    throw new Error(`Query expected ${index} parameters but received ${paramsLength}`)
  }

  return text
}

function isSelectQuery(query: string) {
  return query.trimStart().toLowerCase().startsWith("select")
}

function isInsertQuery(query: string) {
  return query.trimStart().toLowerCase().startsWith("insert")
}

function hasReturningClause(query: string) {
  return /\breturning\b/i.test(query)
}

export async function executeQuery(query: string, params: any[] = []) {
  const trimmedQuery = stripTrailingSemicolon(query)
  const textWithPlaceholders = parameterizeQuery(trimmedQuery, params.length)
  const needsReturningId = isInsertQuery(trimmedQuery) && !hasReturningClause(trimmedQuery)
  const finalQuery = needsReturningId ? `${textWithPlaceholders} RETURNING id` : textWithPlaceholders

  try {
    const result = await pool.query(finalQuery, params)

    if (isSelectQuery(trimmedQuery)) {
      return result.rows
    }

    if (needsReturningId) {
      return {
        rows: result.rows,
        rowCount: result.rowCount,
        insertId: result.rows[0]?.id ?? null,
      }
    }

    if (hasReturningClause(trimmedQuery)) {
      return result.rows
    }

    return {
      rows: result.rows,
      rowCount: result.rowCount,
    }
  } catch (error) {
    console.error("Supabase query error:", error)
    throw error
  }
}

export async function getUserById(userId: number) {
  try {
    const query = "SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?"
    const results = (await executeQuery(query, [userId])) as any[]
    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    throw error
  }
}

export async function updateUser(
  userId: number,
  userData: { name?: string; email?: string; avatar_url?: string },
) {
  try {
    const fields = []
    const values = []

    if (userData.name) {
      fields.push("name = ?")
      values.push(userData.name)
    }

    if (userData.email) {
      fields.push("email = ?")
      values.push(userData.email)
    }

    if (userData.avatar_url !== undefined) {
      fields.push("avatar_url = ?")
      values.push(userData.avatar_url)
    }

    if (fields.length === 0) {
      throw new Error("No fields to update")
    }

    values.push(userId)

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`
    await executeQuery(query, values)

    return await getUserById(userId)
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export default pool
