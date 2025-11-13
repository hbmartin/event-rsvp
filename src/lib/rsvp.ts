/* eslint-disable @typescript-eslint/no-explicit-any */
import { executeQuery } from "./database"
import type { RSVP } from "./types"

export async function createOrUpdateRSVP(
  eventId: number,
  userId: number,
  status: "yes" | "no" | "maybe",
): Promise<RSVP | null> {
  try {
    // Check if RSVP already exists
    const existingRSVP = (await executeQuery("SELECT id FROM rsvp WHERE event_id = $1 AND user_id = $2", [
      eventId,
      userId,
    ])) as any[]

    if (existingRSVP.length > 0) {
      // Update existing RSVP
      await executeQuery(
        "UPDATE rsvp SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE event_id = $2 AND user_id = $3",
        [status, eventId, userId],
      )
    } else {
      // Create new RSVP
      await executeQuery("INSERT INTO rsvp (event_id, user_id, status) VALUES ($1, $2, $3)", [eventId, userId, status])
    }

    return getRSVPByEventAndUser(eventId, userId)
  } catch (error) {
    console.error("Error creating/updating RSVP:", error)
    return null
  }
}

export async function getRSVPByEventAndUser(eventId: number, userId: number): Promise<RSVP | null> {
  try {
    const results = (await executeQuery(
      `SELECT r.*, u.name as user_name, u.email as user_email 
       FROM rsvp r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.event_id = $1 AND r.user_id = $2`,
      [eventId, userId],
    )) as any[]

    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error("Error fetching RSVP:", error)
    return null
  }
}

export async function getRSVPsByEvent(eventId: number): Promise<RSVP[]> {
  try {
    const results = (await executeQuery(
      `SELECT r.*, u.name as user_name, u.email as user_email 
       FROM rsvp r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.event_id = $1 
       ORDER BY r.responded_at DESC`,
      [eventId],
    )) as any[]

    return results
  } catch (error) {
    console.error("Error fetching RSVPs:", error)
    return []
  }
}

export async function deleteRSVP(eventId: number, userId: number): Promise<boolean> {
  try {
    await executeQuery("DELETE FROM rsvp WHERE event_id = $1 AND user_id = $2", [eventId, userId])
    return true
  } catch (error) {
    console.error("Error deleting RSVP:", error)
    return false
  }
}

export async function getRSVPStats(eventId: number): Promise<{
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
       FROM rsvp WHERE event_id = $1`,
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
    console.error("Error fetching RSVP stats:", error)
    return { yes: 0, no: 0, maybe: 0, total: 0 }
  }
}
