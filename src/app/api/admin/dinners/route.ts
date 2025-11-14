import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request)

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const dinners = await executeQuery(`
      SELECT 
        e.*,
        c.name as city_name,
        r.name as restaurant_name,
        (SELECT COUNT(*) FROM dinner_assignments WHERE event_id = e.id) as assigned_count
      FROM events e
      LEFT JOIN cities c ON e.city_id = c.id
      LEFT JOIN restaurants r ON e.restaurant_id = r.id
      WHERE e.event_type = 'dinner' OR e.event_type IS NULL
      ORDER BY e.event_date DESC
    `)

    return NextResponse.json({ dinners })
  } catch (error) {
    console.error("Error fetching dinners:", error)
    return NextResponse.json({ error: "Failed to fetch dinners" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request)

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, event_date, restaurant_id, seats = 6 } = body

    const result = await executeQuery(
      `INSERT INTO events (title, description, event_date, location, created_by, restaurant_id, seats, status, event_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        title,
        description || "",
        event_date,
        "TBD",
        user.id,
        restaurant_id || null,
        seats,
        "draft",
        "dinner",
      ]
    ) as any[]

    const dinnerId = result[0]?.id

    return NextResponse.json({ success: true, id: dinnerId })
  } catch (error) {
    console.error("Error creating dinner:", error)
    return NextResponse.json({ error: "Failed to create dinner" }, { status: 500 })
  }
}
