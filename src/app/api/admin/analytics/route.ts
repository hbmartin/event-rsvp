import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"
import { withAdminAuth } from "@/lib/middleware"

export const GET = withAdminAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (type === "cohort") {
      // Cohort analysis: retention by signup month
      const cohortData = await executeQuery(
        `WITH cohorts AS (
          SELECT 
            DATE_TRUNC('month', u.created_at) as signup_month,
            COUNT(DISTINCT u.id) as total_signups,
            COUNT(DISTINCT CASE 
              WHEN da.assigned_at >= u.created_at + INTERVAL '1 month'
              THEN u.id 
            END) as retained_month_1,
            COUNT(DISTINCT CASE 
              WHEN da.assigned_at >= u.created_at + INTERVAL '2 months'
              THEN u.id 
            END) as retained_month_2,
            COUNT(DISTINCT CASE 
              WHEN da.assigned_at >= u.created_at + INTERVAL '3 months'
              THEN u.id 
            END) as retained_month_3
          FROM users u
          LEFT JOIN dinner_assignments da ON u.id = da.user_id
          WHERE u.role = 'user'
          GROUP BY DATE_TRUNC('month', u.created_at)
          ORDER BY signup_month DESC
          LIMIT 12
        )
        SELECT 
          signup_month,
          total_signups,
          CASE WHEN total_signups > 0 THEN ROUND((retained_month_1::numeric / total_signups) * 100, 1) ELSE 0 END as retention_month_1,
          CASE WHEN total_signups > 0 THEN ROUND((retained_month_2::numeric / total_signups) * 100, 1) ELSE 0 END as retention_month_2,
          CASE WHEN total_signups > 0 THEN ROUND((retained_month_3::numeric / total_signups) * 100, 1) ELSE 0 END as retention_month_3
        FROM cohorts`
      )
      
      return NextResponse.json({ cohortData })
    }

    if (type === "city_demand") {
      // City demand: signups, waitlist, trending neighborhoods
      const cityData = await executeQuery(
        `SELECT 
          c.id,
          c.name as city_name,
          COUNT(DISTINCT CASE WHEN u.role = 'user' THEN u.id END) as total_members,
          COUNT(DISTINCT e.id) as total_dinners,
          COUNT(DISTINCT da.id) as total_assignments,
          COALESCE(AVG(e.seats), 0) as avg_seats_per_dinner,
          COUNT(DISTINCT CASE 
            WHEN e.event_date >= CURRENT_TIMESTAMP 
            THEN e.id 
          END) as upcoming_dinners
        FROM cities c
        LEFT JOIN users u ON u.city_id = c.id
        LEFT JOIN events e ON e.city_id = c.id
        LEFT JOIN dinner_assignments da ON da.event_id = e.id
        GROUP BY c.id, c.name
        ORDER BY total_members DESC`
      )
      
      return NextResponse.json({ cityData })
    }

    if (type === "revenue") {
      // Revenue metrics: MRR, credit sales, avg credits per member
      const revenueData = await executeQuery(
        `WITH monthly_revenue AS (
          SELECT 
            DATE_TRUNC('month', ct.created_at) as month,
            SUM(CASE WHEN ct.transaction_type = 'credit_purchase' THEN ct.amount ELSE 0 END) as credit_revenue,
            SUM(CASE WHEN ct.transaction_type = 'subscription' THEN ct.amount ELSE 0 END) as subscription_revenue,
            COUNT(DISTINCT CASE WHEN ct.transaction_type = 'credit_purchase' THEN ct.user_id END) as credit_buyers,
            COUNT(DISTINCT CASE WHEN ct.transaction_type = 'subscription' THEN ct.user_id END) as subscribers
          FROM credit_transactions ct
          WHERE ct.created_at >= CURRENT_TIMESTAMP - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', ct.created_at)
          ORDER BY month DESC
        )
        SELECT 
          month,
          COALESCE(credit_revenue, 0) as credit_revenue,
          COALESCE(subscription_revenue, 0) as subscription_revenue,
          COALESCE(credit_revenue + subscription_revenue, 0) as total_revenue,
          credit_buyers,
          subscribers
        FROM monthly_revenue`
      )
      
      return NextResponse.json({ revenueData })
    }

    if (type === "performance") {
      // Performance metrics: top restaurants, member satisfaction
      const performanceData = await executeQuery(
        `SELECT 
          r.id,
          r.name as restaurant_name,
          c.name as city_name,
          COUNT(DISTINCT e.id) as dinners_hosted,
          COUNT(DISTINCT da.id) as total_guests,
          COALESCE(AVG(
            CASE 
              WHEN sr.question = 'restaurant_rating' 
              THEN CAST(sr.response AS numeric) 
            END
          ), 0) as avg_rating
        FROM restaurants r
        LEFT JOIN cities c ON r.city_id = c.id
        LEFT JOIN events e ON e.restaurant_id = r.id
        LEFT JOIN dinner_assignments da ON da.event_id = e.id
        LEFT JOIN survey_responses sr ON sr.dinner_id = e.id
        GROUP BY r.id, r.name, c.name
        HAVING COUNT(DISTINCT e.id) > 0
        ORDER BY dinners_hosted DESC
        LIMIT 10`
      )
      
      return NextResponse.json({ performanceData })
    }

    return NextResponse.json({ error: "Invalid analytics type" }, { status: 400 })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    )
  }
})
