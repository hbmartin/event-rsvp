import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { executeQuery } from "@/lib/database"

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request)

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const members = await executeQuery(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.credit_balance,
        u.subscription_status,
        u.subscription_renewal_date,
        u.attendance_count,
        u.created_at,
        c.name as city_name
      FROM users u
      LEFT JOIN cities c ON u.city_id = c.id
      WHERE u.role = 'user'
      ORDER BY u.created_at DESC
    `)

    return NextResponse.json({ members })
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}
