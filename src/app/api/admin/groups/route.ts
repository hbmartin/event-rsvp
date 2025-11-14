import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"
import { withAdminAuth } from "@/lib/middleware"

export const GET = withAdminAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      )
    }

    // Get dinner assignments with member details
    const assignments = await executeQuery(
      `SELECT 
        da.id,
        da.user_id,
        da.table_number,
        da.assigned_at,
        u.name,
        u.email,
        u.phone,
        u.credit_balance,
        sr.responses as survey_data
      FROM dinner_assignments da
      JOIN users u ON da.user_id = u.id
      LEFT JOIN survey_responses sr ON sr.user_id = u.id AND sr.dinner_id = da.event_id
      WHERE da.event_id = $1
      ORDER BY da.table_number, da.assigned_at`,
      [eventId]
    )

    // Get available members (have credits or subscription, not assigned to this dinner)
    const availableMembers = await executeQuery(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.credit_balance,
        s.status as subscription_status
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
      WHERE u.role = 'user'
        AND (u.credit_balance > 0 OR s.status = 'active')
        AND u.id NOT IN (
          SELECT user_id FROM dinner_assignments WHERE event_id = $1
        )
      ORDER BY u.name`,
      [eventId]
    )

    return NextResponse.json({ assignments, availableMembers })
  } catch (error) {
    console.error("Error fetching group assignments:", error)
    return NextResponse.json(
      { error: "Failed to fetch group assignments" },
      { status: 500 }
    )
  }
})

// Add member to dinner
export const POST = withAdminAuth(async (request: Request) => {
  try {
    const body = await request.json()
    const { event_id, user_id, table_number } = body

    // Check event capacity
    const eventInfo = await executeQuery(
      `SELECT seats, 
        (SELECT COUNT(*) FROM dinner_assignments WHERE event_id = $1) as current_assignments
      FROM events WHERE id = $1`,
      [event_id]
    ) as any[]

    if (eventInfo.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    const { seats, current_assignments } = eventInfo[0]
    if (current_assignments >= seats) {
      return NextResponse.json(
        { error: `Event is at capacity (${seats} seats)` },
        { status: 400 }
      )
    }

    // Check if user has active subscription
    const subscriptionCheck = await executeQuery(
      `SELECT 1 FROM subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [user_id]
    ) as any[]
    const hasActiveSubscription = subscriptionCheck.length > 0
    const creditDeducted = !hasActiveSubscription

    // Insert assignment with credit_deducted flag
    const result = await executeQuery(
      `INSERT INTO dinner_assignments (event_id, user_id, table_number, assigned_at, credit_deducted)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      RETURNING *`,
      [event_id, user_id, table_number || 1, creditDeducted]
    ) as any[]

    // Deduct credit if user doesn't have active subscription
    if (creditDeducted) {
      await executeQuery(
        `UPDATE users 
        SET credit_balance = credit_balance - 1
        WHERE id = $1 AND credit_balance > 0`,
        [user_id]
      )
    }

    return NextResponse.json({ assignment: result[0] })
  } catch (error) {
    console.error("Error adding member to dinner:", error)
    return NextResponse.json(
      { error: "Failed to add member to dinner" },
      { status: 500 }
    )
  }
})

// Remove member from dinner
export const DELETE = withAdminAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get("id")

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      )
    }

    // Get assignment info before deleting to refund credit if it was deducted
    const assignment = await executeQuery(
      "SELECT user_id, credit_deducted FROM dinner_assignments WHERE id = $1",
      [assignmentId]
    ) as any[]

    if (assignment.length > 0) {
      const { user_id, credit_deducted } = assignment[0]

      // Delete assignment
      await executeQuery(
        "DELETE FROM dinner_assignments WHERE id = $1",
        [assignmentId]
      )

      // Refund credit ONLY if it was actually deducted when assigned
      if (credit_deducted) {
        await executeQuery(
          `UPDATE users 
          SET credit_balance = credit_balance + 1
          WHERE id = $1`,
          [user_id]
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing member from dinner:", error)
    return NextResponse.json(
      { error: "Failed to remove member from dinner" },
      { status: 500 }
    )
  }
})

// Update table assignment (swap)
export const PUT = withAdminAuth(async (request: Request) => {
  try {
    const body = await request.json()
    const { assignment_id, table_number } = body

    const result = await executeQuery(
      `UPDATE dinner_assignments 
      SET table_number = $1
      WHERE id = $2
      RETURNING *`,
      [table_number, assignment_id]
    ) as any[]

    return NextResponse.json({ assignment: result[0] })
  } catch (error) {
    console.error("Error updating table assignment:", error)
    return NextResponse.json(
      { error: "Failed to update table assignment" },
      { status: 500 }
    )
  }
})
