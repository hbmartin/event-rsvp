/* eslint-disable @typescript-eslint/no-explicit-any */
import { executeQuery } from "./database"

export interface DashboardStats {
  totalEvents: number
  totalRSVPs: number
  totalGuests: number
  totalAttending: number
  upcomingEvents: number
  pastEvents: number
  responseRate: number
}

export interface EventAnalytics {
  eventId: number
  eventTitle: string
  eventDate: string
  totalResponses: number
  yesCount: number
  noCount: number
  maybeCount: number
  guestCount: number
  responseRate: number
}

export interface MonthlyStats {
  month: string
  events: number
  rsvps: number
  guests: number
}

export async function getDashboardStats(userId: number): Promise<DashboardStats> {
  try {
    // Get total events for user
    const eventResults = (await executeQuery(
      "SELECT COUNT(*) as total, COUNT(CASE WHEN event_date >= CURRENT_DATE THEN 1 END) as upcoming, COUNT(CASE WHEN event_date < CURRENT_DATE THEN 1 END) as past FROM events WHERE created_by = $1",
      [userId],
    )) as any[]

    const eventStats = eventResults[0] || { total: 0, upcoming: 0, past: 0 }

    // Get RSVP stats for user's events
    const rsvpResults = (await executeQuery(
      `SELECT 
       COUNT(r.id) as total_rsvps,
       COUNT(CASE WHEN r.status = 'yes' THEN 1 END) as attending
       FROM rsvp r 
       JOIN events e ON r.event_id = e.id 
       WHERE e.created_by = $1`,
      [userId],
    )) as any[]

    const rsvpStats = rsvpResults[0] || { total_rsvps: 0, attending: 0 }

    // Get guest stats for user's events
    const guestResults = (await executeQuery(
      `SELECT 
       COUNT(g.id) as total_guests,
       COUNT(CASE WHEN g.status = 'yes' THEN 1 END) as guests_attending
       FROM guests g 
       JOIN events e ON g.event_id = e.id 
       WHERE e.created_by = $1`,
      [userId],
    )) as any[]

    const guestStats = guestResults[0] || { total_guests: 0, guests_attending: 0 }

    const totalResponses = Number.parseInt(rsvpStats.total_rsvps) + Number.parseInt(guestStats.total_guests)
    const totalAttending = Number.parseInt(rsvpStats.attending) + Number.parseInt(guestStats.guests_attending)

    return {
      totalEvents: Number.parseInt(eventStats.total) || 0,
      totalRSVPs: Number.parseInt(rsvpStats.total_rsvps) || 0,
      totalGuests: Number.parseInt(guestStats.total_guests) || 0,
      totalAttending,
      upcomingEvents: Number.parseInt(eventStats.upcoming) || 0,
      pastEvents: Number.parseInt(eventStats.past) || 0,
      responseRate: totalResponses > 0 ? Math.round((totalAttending / totalResponses) * 100) : 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalEvents: 0,
      totalRSVPs: 0,
      totalGuests: 0,
      totalAttending: 0,
      upcomingEvents: 0,
      pastEvents: 0,
      responseRate: 0,
    }
  }
}

export async function getEventAnalytics(userId: number): Promise<EventAnalytics[]> {
  try {
    const results = (await executeQuery(
      `SELECT 
       e.id as eventId,
       e.title as eventTitle,
       e.event_date as eventDate,
       COUNT(r.id) as rsvp_count,
       COUNT(CASE WHEN r.status = 'yes' THEN 1 END) as rsvp_yes,
       COUNT(CASE WHEN r.status = 'no' THEN 1 END) as rsvp_no,
       COUNT(CASE WHEN r.status = 'maybe' THEN 1 END) as rsvp_maybe,
       COUNT(g.id) as guest_count,
       COUNT(CASE WHEN g.status = 'yes' THEN 1 END) as guest_yes
       FROM events e
       LEFT JOIN rsvp r ON e.id = r.event_id
       LEFT JOIN guests g ON e.id = g.event_id
       WHERE e.created_by = $1
       GROUP BY e.id, e.title, e.event_date
       ORDER BY e.event_date DESC`,
      [userId],
    )) as any[]

    return results.map((row) => {
      const totalResponses = Number.parseInt(row.rsvp_count) + Number.parseInt(row.guest_count)
      const totalAttending = Number.parseInt(row.rsvp_yes) + Number.parseInt(row.guest_yes)

      return {
        eventId: row.eventId,
        eventTitle: row.eventTitle,
        eventDate: row.eventDate,
        totalResponses,
        yesCount: Number.parseInt(row.rsvp_yes) + Number.parseInt(row.guest_yes),
        noCount: Number.parseInt(row.rsvp_no),
        maybeCount: Number.parseInt(row.rsvp_maybe),
        guestCount: Number.parseInt(row.guest_count),
        responseRate: totalResponses > 0 ? Math.round((totalAttending / totalResponses) * 100) : 0,
      }
    })
  } catch (error) {
    console.error("Error fetching event analytics:", error)
    return []
  }
}

export async function getMonthlyStats(userId: number): Promise<MonthlyStats[]> {
  try {
    const results = (await executeQuery(
      `SELECT 
       TO_CHAR(e.created_at, 'YYYY-MM') as month,
       COUNT(e.id) as events,
       COUNT(r.id) as rsvps,
       COUNT(g.id) as guests
       FROM events e
       LEFT JOIN rsvp r ON e.id = r.event_id
       LEFT JOIN guests g ON e.id = g.event_id
       WHERE e.created_by = $1 AND e.created_at >= CURRENT_TIMESTAMP - INTERVAL '12 months'
       GROUP BY TO_CHAR(e.created_at, 'YYYY-MM')
       ORDER BY month DESC
       LIMIT 12`,
      [userId],
    )) as any[]

    return results.map((row) => ({
      month: row.month,
      events: Number.parseInt(row.events) || 0,
      rsvps: Number.parseInt(row.rsvps) || 0,
      guests: Number.parseInt(row.guests) || 0,
    }))
  } catch (error) {
    console.error("Error fetching monthly stats:", error)
    return []
  }
}
