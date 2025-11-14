import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"
import { withAdminAuth } from "@/lib/middleware"

export const GET = withAdminAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    let query = "SELECT * FROM surveys WHERE 1=1"
    const params: any[] = []

    if (type && type !== "all") {
      params.push(type)
      query += ` AND survey_type = $${params.length}`
    }

    query += " ORDER BY display_order ASC, id ASC"

    const surveys = await executeQuery(query, params)

    return NextResponse.json({ surveys })
  } catch (error) {
    console.error("Error fetching surveys:", error)
    return NextResponse.json(
      { error: "Failed to fetch surveys" },
      { status: 500 }
    )
  }
})

export const POST = withAdminAuth(async (request: Request) => {
  try {
    const body = await request.json()
    const { survey_type, question, question_type, options, matching_weight, is_required, display_order } = body

    const result = await executeQuery(
      `INSERT INTO surveys 
        (survey_type, question, question_type, options, matching_weight, is_required, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        survey_type,
        question,
        question_type,
        options ? JSON.stringify(options) : null,
        matching_weight || 1,
        is_required !== false,
        display_order || 0,
      ]
    ) as any[]

    return NextResponse.json({ survey: result[0] })
  } catch (error) {
    console.error("Error creating survey:", error)
    return NextResponse.json(
      { error: "Failed to create survey" },
      { status: 500 }
    )
  }
})

export const PUT = withAdminAuth(async (request: Request) => {
  try {
    const body = await request.json()
    const { id, survey_type, question, question_type, options, matching_weight, is_required, display_order } = body

    const result = await executeQuery(
      `UPDATE surveys 
      SET survey_type = $1, question = $2, question_type = $3, 
          options = $4, matching_weight = $5, is_required = $6, 
          display_order = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [
        survey_type,
        question,
        question_type,
        options ? JSON.stringify(options) : null,
        matching_weight,
        is_required,
        display_order,
        id,
      ]
    ) as any[]

    return NextResponse.json({ survey: result[0] })
  } catch (error) {
    console.error("Error updating survey:", error)
    return NextResponse.json(
      { error: "Failed to update survey" },
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
        { error: "Survey ID is required" },
        { status: 400 }
      )
    }

    await executeQuery("DELETE FROM surveys WHERE id = $1", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting survey:", error)
    return NextResponse.json(
      { error: "Failed to delete survey" },
      { status: 500 }
    )
  }
})
