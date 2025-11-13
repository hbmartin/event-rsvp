/* eslint-disable @typescript-eslint/no-explicit-any */
import { executeQuery } from "./database"
import { Event, RecurringEventSeries } from "./types"
import { addWeeks, addMonths, addYears, format, isBefore } from "date-fns"

export async function createRecurringEventSeries(
  title: string,
  description: string,
  location: string,
  startDate: string,
  endDate: string | null,
  recurrenceType: 'weekly' | 'monthly' | 'yearly',
  userId: number,
  maxCapacity?: number,
  customFormFields?: any[]
): Promise<RecurringEventSeries | null> {
  try {
    // Create parent event series record
    const seriesResult = await executeQuery(
      `INSERT INTO recurring_event_series 
       (title, description, location, recurrence_type, start_date, end_date, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [title, description, location, recurrenceType, startDate, endDate, userId]
    ) as any

    const seriesId = seriesResult.rows[0].id

    // Generate individual events based on recurrence
    const events = await generateRecurringEvents(
      seriesId,
      title,
      description,
      location,
      startDate,
      endDate,
      recurrenceType,
      userId,
      maxCapacity,
      customFormFields
    )

    return {
      id: seriesId,
      parent_event_id: seriesId,
      title,
      description,
      location,
      recurrence_type: recurrenceType,
      start_date: startDate,
      end_date: endDate || undefined,
      created_by: userId,
      created_at: new Date().toISOString(),
      events
    }
  } catch (error) {
    console.error("Error creating recurring event series:", error)
    return null
  }
}

async function generateRecurringEvents(
  seriesId: number,
  title: string,
  description: string,
  location: string,
  startDate: string,
  endDate: string | null,
  recurrenceType: 'weekly' | 'monthly' | 'yearly',
  userId: number,
  maxCapacity?: number,
  customFormFields?: any[]
): Promise<Event[]> {
  const events: Event[] = []
  let currentDate = new Date(startDate)
  const finalEndDate = endDate ? new Date(endDate) : addYears(currentDate, 2) // Default 2 years if no end date
  let eventCount = 0
  const maxEvents = 100 // Safety limit

  while (isBefore(currentDate, finalEndDate) && eventCount < maxEvents) {
    try {
      const eventResult = await executeQuery(
        `INSERT INTO events 
         (title, description, event_date, location, created_by, is_recurring, recurrence_type, parent_event_id, max_capacity, custom_form_fields) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          title,
          description,
          format(currentDate, 'yyyy-MM-dd HH:mm:ss'),
          location,
          userId,
          true,
          recurrenceType,
          seriesId,
          maxCapacity || null,
          customFormFields ? JSON.stringify(customFormFields) : null
        ]
      ) as any

      events.push({
        id: eventResult.rows[0].id,
        title,
        description,
        event_date: format(currentDate, 'yyyy-MM-dd HH:mm:ss'),
        location,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_recurring: true,
        recurrence_type: recurrenceType,
        parent_event_id: seriesId,
        max_capacity: maxCapacity,
        custom_form_fields: customFormFields
      })

      // Calculate next occurrence
      switch (recurrenceType) {
        case 'weekly':
          currentDate = addWeeks(currentDate, 1)
          break
        case 'monthly':
          currentDate = addMonths(currentDate, 1)
          break
        case 'yearly':
          currentDate = addYears(currentDate, 1)
          break
      }

      eventCount++
    } catch (error) {
      console.error("Error creating individual recurring event:", error)
      break
    }
  }

  return events
}

export async function getRecurringEventSeries(userId: number): Promise<RecurringEventSeries[]> {
  try {
    const results = await executeQuery(
      `SELECT * FROM recurring_event_series WHERE created_by = $1 ORDER BY created_at DESC`,
      [userId]
    ) as any[]

    const series: RecurringEventSeries[] = []

    for (const row of results) {
      const events = await executeQuery(
        `SELECT * FROM events WHERE parent_event_id = $1 ORDER BY event_date ASC`,
        [row.id]
      ) as any[]

      series.push({
        id: row.id,
        parent_event_id: row.id,
        title: row.title,
        description: row.description,
        location: row.location,
        recurrence_type: row.recurrence_type,
        start_date: row.start_date,
        end_date: row.end_date || undefined,
        created_by: row.created_by,
        created_at: row.created_at,
        events: events.map(event => ({
          ...event,
          custom_form_fields: event.custom_form_fields ? JSON.parse(event.custom_form_fields) : []
        }))
      })
    }

    return series
  } catch (error) {
    console.error("Error fetching recurring event series:", error)
    return []
  }
}

export async function updateRecurringEventSeries(
  seriesId: number,
  title: string,
  description: string,
  location: string,
  updateFutureEvents: boolean = true
): Promise<boolean> {
  try {
    // Update series record
    await executeQuery(
      `UPDATE recurring_event_series 
       SET title = $1, description = $2, location = $3 
       WHERE id = $4`,
      [title, description, location, seriesId]
    )

    if (updateFutureEvents) {
      // Update future events in the series
      await executeQuery(
        `UPDATE events 
         SET title = $1, description = $2, location = $3 
         WHERE parent_event_id = $4 AND event_date >= CURRENT_TIMESTAMP`,
        [title, description, location, seriesId]
      )
    }

    return true
  } catch (error) {
    console.error("Error updating recurring event series:", error)
    return false
  }
}

export async function deleteRecurringEventSeries(
  seriesId: number,
  deleteFutureEvents: boolean = true
): Promise<boolean> {
  try {
    if (deleteFutureEvents) {
      // Delete future events and their RSVPs
      await executeQuery(
        `DELETE FROM rsvp 
         WHERE event_id IN (
           SELECT id FROM events 
           WHERE parent_event_id = $1 AND event_date >= CURRENT_TIMESTAMP
         )`,
        [seriesId]
      )

      await executeQuery(
        `DELETE FROM guests 
         WHERE event_id IN (
           SELECT id FROM events 
           WHERE parent_event_id = $1 AND event_date >= CURRENT_TIMESTAMP
         )`,
        [seriesId]
      )

      await executeQuery(
        `DELETE FROM events WHERE parent_event_id = $1 AND event_date >= CURRENT_TIMESTAMP`,
        [seriesId]
      )
    }

    // Delete series record
    await executeQuery(
      `DELETE FROM recurring_event_series WHERE id = $1`,
      [seriesId]
    )

    return true
  } catch (error) {
    console.error("Error deleting recurring event series:", error)
    return false
  }
}

export async function createEventFromTemplate(
  templateId: number,
  eventData: {
    title: string
    description?: string
    eventDate: string
    location?: string
    maxCapacity?: number
  },
  userId: number
): Promise<Event | null> {
  try {
    // Get template
    const templateResults = await executeQuery(
      `SELECT * FROM form_templates WHERE id = $1`,
      [templateId]
    ) as any[]

    if (templateResults.length === 0) {
      throw new Error("Template not found")
    }

    const template = templateResults[0]
    const customFormFields = JSON.parse(template.fields)

    const result = await executeQuery(
      `INSERT INTO events 
       (title, description, event_date, location, created_by, max_capacity, custom_form_fields, form_template_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        eventData.title,
        eventData.description,
        eventData.eventDate,
        eventData.location,
        userId,
        eventData.maxCapacity || null,
        JSON.stringify(customFormFields),
        templateId
      ]
    ) as any

    return {
      id: result.rows[0].id,
      title: eventData.title,
      description: eventData.description,
      event_date: eventData.eventDate,
      location: eventData.location,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      max_capacity: eventData.maxCapacity,
      custom_form_fields: customFormFields,
      form_template_id: templateId
    }
  } catch (error) {
    console.error("Error creating event from template:", error)
    return null
  }
}