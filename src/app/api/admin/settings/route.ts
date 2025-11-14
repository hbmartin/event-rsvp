import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"
import { withAdminAuth } from "@/lib/middleware"

// Get email templates and promo codes
export const GET = withAdminAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (type === "promo_codes") {
      const promoCodes = await executeQuery(
        `SELECT * FROM promo_codes ORDER BY created_at DESC`
      )
      return NextResponse.json({ promoCodes })
    }

    // Return empty templates for now (stub for email template management)
    const templates = {
      dinner_confirmation: {
        subject: "You're confirmed for dinner on {{date}}!",
        body: "Hi {{name}},\n\nYou're all set for dinner at {{restaurant}} on {{date}} at {{time}}.\n\nSee you there!",
      },
      dinner_reminder: {
        subject: "Reminder: Dinner tomorrow at {{restaurant}}",
        body: "Hi {{name}},\n\nJust a friendly reminder about your dinner tomorrow at {{restaurant}} ({{time}}).\n\nLooking forward to seeing you!",
      },
      post_dinner_survey: {
        subject: "How was your dinner at {{restaurant}}?",
        body: "Hi {{name}},\n\nWe hope you enjoyed your dinner! Please take a moment to share your feedback.\n\nClick here to complete the survey: {{survey_link}}",
      },
      credit_low_balance: {
        subject: "Your credit balance is running low",
        body: "Hi {{name}},\n\nYour credit balance is {{credits}}. Purchase more credits to continue attending dinners.\n\nBuy credits: {{purchase_link}}",
      },
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
})

// Create promo code
export const POST = withAdminAuth(async (request: Request) => {
  try {
    const body = await request.json()
    const { code, credits, max_uses, expires_at } = body

    const result = await executeQuery(
      `INSERT INTO promo_codes (code, credits, max_uses, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [code, credits, max_uses, expires_at]
    ) as any[]

    return NextResponse.json({ promoCode: result[0] })
  } catch (error) {
    console.error("Error creating promo code:", error)
    return NextResponse.json(
      { error: "Failed to create promo code" },
      { status: 500 }
    )
  }
})

// Delete promo code
export const DELETE = withAdminAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Promo code ID is required" },
        { status: 400 }
      )
    }

    await executeQuery("DELETE FROM promo_codes WHERE id = $1", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting promo code:", error)
    return NextResponse.json(
      { error: "Failed to delete promo code" },
      { status: 500 }
    )
  }
})
