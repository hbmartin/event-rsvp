import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"
import { withAdminAuth } from "@/lib/middleware"

export const GET = withAdminAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get("cityId")

    let query = `
      SELECT 
        r.*,
        c.name as city_name,
        COUNT(DISTINCT e.id) as dinners_hosted,
        COALESCE(AVG(sr.rating), 0) as avg_rating
      FROM restaurants r
      LEFT JOIN cities c ON r.city_id = c.id
      LEFT JOIN events e ON e.restaurant_id = r.id
      LEFT JOIN survey_responses sr ON sr.dinner_id = e.id AND sr.question = 'restaurant_rating'
      WHERE 1=1
    `

    const params: any[] = []

    if (cityId && cityId !== "all") {
      params.push(cityId)
      query += ` AND r.city_id = $${params.length}`
    }

    query += `
      GROUP BY r.id, c.name
      ORDER BY r.name ASC
    `

    const restaurants = await executeQuery(query, params)

    return NextResponse.json({ restaurants })
  } catch (error) {
    console.error("Error fetching restaurants:", error)
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    )
  }
})

export const POST = withAdminAuth(async (request: Request) => {
  try {
    const body = await request.json()
    const { name, address, city_id, contact_name, contact_phone, contact_email, capacity, neighborhood, notes } = body

    const result = await executeQuery(
      `INSERT INTO restaurants 
        (name, address, city_id, contact_name, contact_phone, contact_email, capacity, neighborhood, notes, booking_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'available')
      RETURNING *`,
      [name, address, city_id, contact_name, contact_phone, contact_email, capacity, neighborhood, notes]
    ) as any[]

    return NextResponse.json({ restaurant: result[0] })
  } catch (error) {
    console.error("Error creating restaurant:", error)
    return NextResponse.json(
      { error: "Failed to create restaurant" },
      { status: 500 }
    )
  }
})

export const PUT = withAdminAuth(async (request: Request) => {
  try {
    const body = await request.json()
    const { id, name, address, city_id, contact_name, contact_phone, contact_email, capacity, neighborhood, notes, booking_status } = body

    const result = await executeQuery(
      `UPDATE restaurants 
      SET name = $1, address = $2, city_id = $3, contact_name = $4, 
          contact_phone = $5, contact_email = $6, capacity = $7, 
          neighborhood = $8, notes = $9, booking_status = $10,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
      [name, address, city_id, contact_name, contact_phone, contact_email, capacity, neighborhood, notes, booking_status, id]
    ) as any[]

    return NextResponse.json({ restaurant: result[0] })
  } catch (error) {
    console.error("Error updating restaurant:", error)
    return NextResponse.json(
      { error: "Failed to update restaurant" },
      { status: 500 }
    )
  }
})

export const DELETE = withAdminAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      )
    }

    await executeQuery(
      "DELETE FROM restaurants WHERE id = $1",
      [id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting restaurant:", error)
    return NextResponse.json(
      { error: "Failed to delete restaurant" },
      { status: 500 }
    )
  }
})
