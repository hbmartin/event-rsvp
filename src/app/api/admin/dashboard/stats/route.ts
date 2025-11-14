import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request)

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get total members
    const totalMembersResult = await executeQuery(
      "SELECT COUNT(*) as count FROM users WHERE role = 'user'"
    ) as any[]
    const totalMembers = parseInt(totalMembersResult[0]?.count || "0")

    // Get active subscribers
    const activeSubscribersResult = await executeQuery(
      "SELECT COUNT(*) as count FROM users WHERE subscription_status = 'active'"
    ) as any[]
    const activeSubscribers = parseInt(activeSubscribersResult[0]?.count || "0")

    // Get upcoming dinners
    const upcomingDinnersResult = await executeQuery(
      `SELECT COUNT(*) as count FROM events 
       WHERE event_date >= CURRENT_TIMESTAMP 
       AND status IN ('confirmed', 'draft')`
    ) as any[]
    const upcomingDinners = parseInt(upcomingDinnersResult[0]?.count || "0")

    // Get total revenue from credit transactions
    const revenueResult = await executeQuery(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM credit_transactions 
       WHERE transaction_type = 'purchase'`
    ) as any[]
    const totalRevenue = parseInt(revenueResult[0]?.total || "0")

    // Calculate seat fill rate
    const seatFillResult = await executeQuery(
      `SELECT 
        COALESCE(AVG(
          CASE 
            WHEN e.seats > 0 THEN (
              (SELECT COUNT(*) FROM dinner_assignments da WHERE da.event_id = e.id) * 100.0 / e.seats
            )
            ELSE 0
          END
        ), 0) as fill_rate
       FROM events e
       WHERE e.seats IS NOT NULL AND e.seats > 0`
    ) as any[]
    const seatFillRate = parseFloat(seatFillResult[0]?.fill_rate || "0")

    // Calculate repeat attendance - percentage of members who attended multiple times
    const repeatAttendanceResult = await executeQuery(
      `WITH user_attendance AS (
        SELECT user_id, COUNT(*) as attendance_count
        FROM dinner_assignments
        GROUP BY user_id
      ),
      repeat_users AS (
        SELECT COUNT(*) as repeat_count
        FROM user_attendance
        WHERE attendance_count > 1
      ),
      total_users AS (
        SELECT COUNT(DISTINCT user_id) as total_count
        FROM dinner_assignments
      )
      SELECT 
        CASE 
          WHEN total_users.total_count > 0 
          THEN (repeat_users.repeat_count * 100.0 / total_users.total_count)
          ELSE 0
        END as repeat_rate
      FROM repeat_users, total_users`
    ) as any[]
    const repeatAttendance = parseFloat(repeatAttendanceResult[0]?.repeat_rate || "0")

    // Average credits per member
    const avgCreditsResult = await executeQuery(
      "SELECT COALESCE(AVG(credit_balance), 0) as avg_credits FROM users WHERE role = 'user'"
    ) as any[]
    const avgCreditsPerMember = parseFloat(avgCreditsResult[0]?.avg_credits || "0")

    // Waitlist count
    const waitlistResult = await executeQuery(
      "SELECT COUNT(*) as count FROM event_waitlist WHERE status = 'waiting'"
    ) as any[]
    const waitlistCount = parseInt(waitlistResult[0]?.count || "0")

    // Upcoming dinner guests
    const upcomingGuestsResult = await executeQuery(
      `SELECT COUNT(*) as count FROM dinner_assignments da
       JOIN events e ON da.event_id = e.id
       WHERE e.event_date >= CURRENT_TIMESTAMP`
    ) as any[]
    const upcomingDinnerGuests = parseInt(upcomingGuestsResult[0]?.count || "0")

    // Filled tables
    const filledTablesResult = await executeQuery(
      `SELECT COUNT(*) as count FROM events 
       WHERE event_date >= CURRENT_TIMESTAMP
       AND seats <= (SELECT COUNT(*) FROM dinner_assignments WHERE event_id = events.id)`
    ) as any[]
    const filledTables = parseInt(filledTablesResult[0]?.count || "0")

    // Total actual seat assignments (assigned members) for upcoming dinners
    const actualAssignmentsResult = await executeQuery(
      `SELECT COUNT(*) as assignment_count
       FROM dinner_assignments da
       JOIN events e ON da.event_id = e.id
       WHERE e.event_date >= CURRENT_TIMESTAMP
       AND e.status IN ('confirmed', 'draft')`
    ) as any[]
    const actualAssignments = parseInt(actualAssignmentsResult[0]?.assignment_count || "0")

    const stats = {
      totalMembers,
      activeSubscribers,
      upcomingDinners,
      totalRevenue,
      seatFillRate,
      repeatAttendance,
      avgCreditsPerMember,
      waitlistCount,
      upcomingDinnerGuests,
      filledTables,
      seatAssignments: actualAssignments,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}
