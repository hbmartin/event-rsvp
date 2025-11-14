import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

export async function GET() {
  try {
    const cities = await executeQuery(
      "SELECT id, name FROM cities ORDER BY name ASC"
    )

    return NextResponse.json({ cities })
  } catch (error) {
    console.error("Error fetching cities:", error)
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    )
  }
}
