/* eslint-disable @typescript-eslint/no-explicit-any */
import { executeQuery } from "./database"
import { EventWaitlist } from "./types"

export async function addToWaitlist(
  eventId: number,
  userId?: number,
  guestName?: string,
  guestEmail?: string
): Promise<EventWaitlist | null> {
  try {
    // Get current waitlist position
    const positionResult = await executeQuery(
      `SELECT COALESCE(MAX(position), 0) + 1 as next_position 
       FROM event_waitlist WHERE event_id = ?`,
      [eventId]
    ) as any[]

    const position = positionResult[0]?.next_position || 1

    const result = await executeQuery(
      `INSERT INTO event_waitlist 
       (event_id, user_id, guest_name, guest_email, position, status) 
       VALUES (?, ?, ?, ?, ?, 'waiting')`,
      [eventId, userId || null, guestName || null, guestEmail || null, position]
    ) as any

    return {
      id: result.insertId,
      event_id: eventId,
      user_id: userId,
      guest_name: guestName,
      guest_email: guestEmail,
      position,
      joined_at: new Date().toISOString(),
      status: 'waiting'
    }
  } catch (error) {
    console.error("Error adding to waitlist:", error)
    return null
  }
}

export async function removeFromWaitlist(waitlistId: number): Promise<boolean> {
  try {
    // Get waitlist entry to reorder positions
    const waitlistEntry = await executeQuery(
      `SELECT event_id, position FROM event_waitlist WHERE id = ?`,
      [waitlistId]
    ) as any[]

    if (waitlistEntry.length === 0) {
      return false
    }

    const { event_id, position } = waitlistEntry[0]

    // Remove from waitlist
    await executeQuery(`DELETE FROM event_waitlist WHERE id = ?`, [waitlistId])

    // Reorder remaining positions
    await executeQuery(
      `UPDATE event_waitlist 
       SET position = position - 1 
       WHERE event_id = ? AND position > ?`,
      [event_id, position]
    )

    return true
  } catch (error) {
    console.error("Error removing from waitlist:", error)
    return false
  }
}

export async function getEventWaitlist(eventId: number): Promise<EventWaitlist[]> {
  try {
    const results = await executeQuery(
      `SELECT w.*, u.name as user_name, u.email as user_email 
       FROM event_waitlist w 
       LEFT JOIN users u ON w.user_id = u.id 
       WHERE w.event_id = ? 
       ORDER BY w.position ASC`,
      [eventId]
    ) as any[]

    return results.map(row => ({
      id: row.id,
      event_id: row.event_id,
      user_id: row.user_id,
      guest_name: row.guest_name || row.user_name,
      guest_email: row.guest_email || row.user_email,
      position: row.position,
      joined_at: row.joined_at,
      notified_at: row.notified_at,
      status: row.status
    }))
  } catch (error) {
    console.error("Error fetching event waitlist:", error)
    return []
  }
}

export async function checkEventCapacity(eventId: number): Promise<{
  currentAttendees: number
  maxCapacity: number | null
  isAtCapacity: boolean
  availableSpots: number
  waitlistCount: number
}> {
  try {
    // Get event capacity
    const eventResult = await executeQuery(
      `SELECT max_capacity FROM events WHERE id = ?`,
      [eventId]
    ) as any[]

    const maxCapacity = eventResult[0]?.max_capacity || null

    // Count current attendees (confirmed RSVPs + guests)
    const attendeeResult = await executeQuery(
      `SELECT 
         (SELECT COUNT(*) FROM rsvp WHERE event_id = ? AND status = 'yes') +
         (SELECT COUNT(*) FROM guests WHERE event_id = ? AND status = 'yes') as current_attendees`,
      [eventId, eventId]
    ) as any[]

    const currentAttendees = attendeeResult[0]?.current_attendees || 0

    // Count waitlist
    const waitlistResult = await executeQuery(
      `SELECT COUNT(*) as waitlist_count FROM event_waitlist WHERE event_id = ? AND status = 'waiting'`,
      [eventId]
    ) as any[]

    const waitlistCount = waitlistResult[0]?.waitlist_count || 0

    const isAtCapacity = maxCapacity ? currentAttendees >= maxCapacity : false
    const availableSpots = maxCapacity ? Math.max(0, maxCapacity - currentAttendees) : Infinity

    return {
      currentAttendees,
      maxCapacity,
      isAtCapacity,
      availableSpots: isAtCapacity ? 0 : availableSpots,
      waitlistCount
    }
  } catch (error) {
    console.error("Error checking event capacity:", error)
    return {
      currentAttendees: 0,
      maxCapacity: null,
      isAtCapacity: false,
      availableSpots: Infinity,
      waitlistCount: 0
    }
  }
}

export async function processWaitlistAfterCancellation(eventId: number): Promise<boolean> {
  try {
    // Check if there are spots available and people waiting
    const capacity = await checkEventCapacity(eventId)
    
    if (capacity.availableSpots > 0 && capacity.waitlistCount > 0) {
      // Get next person on waitlist
      const nextInLine = await executeQuery(
        `SELECT * FROM event_waitlist 
         WHERE event_id = ? AND status = 'waiting' 
         ORDER BY position ASC LIMIT 1`,
        [eventId]
      ) as any[]

      if (nextInLine.length > 0) {
        const waitlistEntry = nextInLine[0]
        
        // Mark as notified
        await executeQuery(
          `UPDATE event_waitlist 
           SET status = 'notified', notified_at = NOW() 
           WHERE id = ?`,
          [waitlistEntry.id]
        )

        // TODO: Send notification email/SMS
        console.log(`Notified waitlist entry ${waitlistEntry.id} about available spot`)
        
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error processing waitlist after cancellation:", error)
    return false
  }
}

export async function convertWaitlistToRSVP(
  waitlistId: number,
  responseStatus: 'yes' | 'no' | 'maybe' = 'yes'
): Promise<boolean> {
  try {
    // Get waitlist entry
    const waitlistEntry = await executeQuery(
      `SELECT * FROM event_waitlist WHERE id = ?`,
      [waitlistId]
    ) as any[]

    if (waitlistEntry.length === 0) {
      return false
    }

    const entry = waitlistEntry[0]

    if (entry.user_id) {
      // Convert to user RSVP
      await executeQuery(
        `INSERT INTO rsvp (event_id, user_id, status) VALUES (?, ?, ?)
         ON CONFLICT (event_id, user_id) DO UPDATE SET status = EXCLUDED.status`,
        [entry.event_id, entry.user_id, responseStatus]
      )
    } else {
      // Convert to guest RSVP
      await executeQuery(
        `INSERT INTO guests (event_id, name, email, status) VALUES (?, ?, ?, ?)`,
        [entry.event_id, entry.guest_name, entry.guest_email, responseStatus]
      )
    }

    // Mark waitlist entry as converted
    await executeQuery(
      `UPDATE event_waitlist SET status = 'converted' WHERE id = ?`,
      [waitlistId]
    )

    // Remove from waitlist and reorder
    await removeFromWaitlist(waitlistId)

    return true
  } catch (error) {
    console.error("Error converting waitlist to RSVP:", error)
    return false
  }
}

export async function getWaitlistPosition(eventId: number, userId?: number, guestEmail?: string): Promise<number | null> {
  try {
    let query: string
    let params: any[]

    if (userId) {
      query = `SELECT position FROM event_waitlist WHERE event_id = ? AND user_id = ? AND status = 'waiting'`
      params = [eventId, userId]
    } else if (guestEmail) {
      query = `SELECT position FROM event_waitlist WHERE event_id = ? AND guest_email = ? AND status = 'waiting'`
      params = [eventId, guestEmail]
    } else {
      return null
    }

    const result = await executeQuery(query, params) as any[]
    return result[0]?.position || null
  } catch (error) {
    console.error("Error getting waitlist position:", error)
    return null
  }
}
