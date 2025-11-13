/* eslint-disable @typescript-eslint/no-explicit-any */
import { executeQuery } from "./database"
import type { Guest } from "./types"

export async function createGuest(
  eventId: number,
  name: string,
  email: string,
  status: "yes" | "no" | "maybe" = "yes",
): Promise<Guest | null> {
  try {
    const result = (await executeQuery("INSERT INTO guests (event_id, name, email, status) VALUES ($1, $2, $3, $4) RETURNING id", [
      eventId,
      name,
      email,
      status,
    ])) as any

    if (result.rows && result.rows.length > 0) {
      return getGuestById(result.rows[0].id)
    }
    return null
  } catch (error) {
    console.error("Error creating guest:", error)
    return null
  }
}

export async function getGuestById(id: number): Promise<Guest | null> {
  try {
    const results = (await executeQuery("SELECT * FROM guests WHERE id = $1", [id])) as any[]
    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error("Error fetching guest:", error)
    return null
  }
}

export async function getGuestsByEvent(eventId: number): Promise<Guest[]> {
  try {
    const results = (await executeQuery("SELECT * FROM guests WHERE event_id = $1 ORDER BY responded_at DESC", [
      eventId,
    ])) as any[]
    return results
  } catch (error) {
    console.error("Error fetching guests:", error)
    return []
  }
}

export async function updateGuest(
  id: number,
  name: string,
  email: string,
  status: "yes" | "no" | "maybe",
): Promise<Guest | null> {
  try {
    await executeQuery(
      "UPDATE guests SET name = $1, email = $2, status = $3, responded_at = CURRENT_TIMESTAMP WHERE id = $4",
      [name, email, status, id],
    )
    return getGuestById(id)
  } catch (error) {
    console.error("Error updating guest:", error)
    return null
  }
}

export async function updateGuestStatus(id: number, status: "yes" | "no" | "maybe"): Promise<Guest | null> {
  try {
    await executeQuery("UPDATE guests SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE id = $2", [status, id])
    return getGuestById(id)
  } catch (error) {
    console.error("Error updating guest status:", error)
    return null
  }
}

export async function deleteGuest(id: number): Promise<boolean> {
  try {
    await executeQuery("DELETE FROM guests WHERE id = $1", [id])
    return true
  } catch (error) {
    console.error("Error deleting guest:", error)
    return false
  }
}

export async function getGuestByEventAndEmail(eventId: number, email: string): Promise<Guest | null> {
  try {
    const results = (await executeQuery("SELECT * FROM guests WHERE event_id = $1 AND email = $2", [
      eventId,
      email,
    ])) as any[]
    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error("Error fetching guest by email:", error)
    return null
  }
}

export async function getGuestStats(eventId: number): Promise<{
  yes: number
  no: number
  maybe: number
  total: number
}> {
  try {
    const results = (await executeQuery(
      `SELECT 
       COUNT(CASE WHEN status = 'yes' THEN 1 END) as yes_count,
       COUNT(CASE WHEN status = 'no' THEN 1 END) as no_count,
       COUNT(CASE WHEN status = 'maybe' THEN 1 END) as maybe_count,
       COUNT(*) as total_count
       FROM guests WHERE event_id = $1`,
      [eventId],
    )) as any[]

    const stats = results[0] || { yes_count: 0, no_count: 0, maybe_count: 0, total_count: 0 }

    return {
      yes: Number.parseInt(stats.yes_count) || 0,
      no: Number.parseInt(stats.no_count) || 0,
      maybe: Number.parseInt(stats.maybe_count) || 0,
      total: Number.parseInt(stats.total_count) || 0,
    }
  } catch (error) {
    console.error("Error fetching guest stats:", error)
    return { yes: 0, no: 0, maybe: 0, total: 0 }
  }
}
