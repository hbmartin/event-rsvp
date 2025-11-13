/* eslint-disable @typescript-eslint/no-explicit-any */
import { executeQuery } from "./database"
import type { Event } from "./types"

export async function createEvent(
  title: string,
  description: string,
  eventDate: string,
  location: string,
  createdBy: number,
): Promise<Event | null> {
  try {
    const result = (await executeQuery(
      "INSERT INTO events (title, description, event_date, location, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [title, description, eventDate, location, createdBy],
    )) as any

    if (result.rows && result.rows.length > 0) {
      return getEventById(result.rows[0].id)
    }
    return null
  } catch (error) {
    console.error("Error creating event:", error)
    return null
  }
}

export async function getEventById(id: number): Promise<Event | null> {
  try {
    const results = (await executeQuery(
      `SELECT e.*, u.name as creator_name,
       COUNT(CASE WHEN r.status = 'yes' THEN 1 END) as rsvp_yes,
       COUNT(CASE WHEN r.status = 'no' THEN 1 END) as rsvp_no,
       COUNT(CASE WHEN r.status = 'maybe' THEN 1 END) as rsvp_maybe,
       COUNT(r.id) as rsvp_total,
       COUNT(g.id) as guest_count
       FROM events e 
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN rsvp r ON e.id = r.event_id
       LEFT JOIN guests g ON e.id = g.event_id
       WHERE e.id = $1
       GROUP BY e.id, u.name`,
      [id],
    )) as any[]

    if (results.length > 0) {
      const event = results[0]
      return {
        ...event,
        rsvp_count: {
          yes: Number.parseInt(event.rsvp_yes) || 0,
          no: Number.parseInt(event.rsvp_no) || 0,
          maybe: Number.parseInt(event.rsvp_maybe) || 0,
          total: Number.parseInt(event.rsvp_total) + Number.parseInt(event.guest_count) || 0,
        },
      }
    }
    return null
  } catch (error) {
    console.error("Error fetching event:", error)
    return null
  }
}

export async function getEventsByUser(userId: number): Promise<Event[]> {
  try {
    const results = (await executeQuery(
      `SELECT e.*, u.name as creator_name,
       COUNT(CASE WHEN r.status = 'yes' THEN 1 END) as rsvp_yes,
       COUNT(CASE WHEN r.status = 'no' THEN 1 END) as rsvp_no,
       COUNT(CASE WHEN r.status = 'maybe' THEN 1 END) as rsvp_maybe,
       COUNT(r.id) as rsvp_total,
       COUNT(g.id) as guest_count
       FROM events e 
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN rsvp r ON e.id = r.event_id
       LEFT JOIN guests g ON e.id = g.event_id
       WHERE e.created_by = $1
       GROUP BY e.id, u.name
       ORDER BY e.event_date DESC`,
      [userId],
    )) as any[]

    return results.map((event) => ({
      ...event,
      rsvp_count: {
        yes: Number.parseInt(event.rsvp_yes) || 0,
        no: Number.parseInt(event.rsvp_no) || 0,
        maybe: Number.parseInt(event.rsvp_maybe) || 0,
        total: Number.parseInt(event.rsvp_total) + Number.parseInt(event.guest_count) || 0,
      },
    }))
  } catch (error) {
    console.error("Error fetching user events:", error)
    return []
  }
}

export async function getAllEvents(): Promise<Event[]> {
  try {
    const results = (await executeQuery(
      `SELECT e.*, u.name as creator_name,
       COUNT(CASE WHEN r.status = 'yes' THEN 1 END) as rsvp_yes,
       COUNT(CASE WHEN r.status = 'no' THEN 1 END) as rsvp_no,
       COUNT(CASE WHEN r.status = 'maybe' THEN 1 END) as rsvp_maybe,
       COUNT(r.id) as rsvp_total,
       COUNT(g.id) as guest_count
       FROM events e 
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN rsvp r ON e.id = r.event_id
       LEFT JOIN guests g ON e.id = g.event_id
       GROUP BY e.id, u.name
       ORDER BY e.event_date DESC`,
    )) as any[]

    return results.map((event) => ({
      ...event,
      rsvp_count: {
        yes: Number.parseInt(event.rsvp_yes) || 0,
        no: Number.parseInt(event.rsvp_no) || 0,
        maybe: Number.parseInt(event.rsvp_maybe) || 0,
        total: Number.parseInt(event.rsvp_total) + Number.parseInt(event.guest_count) || 0,
      },
    }))
  } catch (error) {
    console.error("Error fetching all events:", error)
    return []
  }
}

export async function updateEvent(
  id: number,
  title: string,
  description: string,
  eventDate: string,
  location: string,
): Promise<Event | null> {
  try {
    await executeQuery("UPDATE events SET title = $1, description = $2, event_date = $3, location = $4 WHERE id = $5", [
      title,
      description,
      eventDate,
      location,
      id,
    ])

    return getEventById(id)
  } catch (error) {
    console.error("Error updating event:", error)
    return null
  }
}

export async function deleteEvent(id: number): Promise<boolean> {
  try {
    await executeQuery("DELETE FROM events WHERE id = $1", [id])
    return true
  } catch (error) {
    console.error("Error deleting event:", error)
    return false
  }
}
