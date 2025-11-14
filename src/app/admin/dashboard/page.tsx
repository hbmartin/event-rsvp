"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  CalendarDays,
  DollarSign,
  TrendingUp,
  UtensilsCrossed,
  UserCheck,
  Clock,
  AlertCircle,
} from "lucide-react"

interface DashboardStats {
  totalMembers: number
  activeSubscribers: number
  upcomingDinners: number
  totalRevenue: number
  seatFillRate: number
  repeatAttendance: number
  avgCreditsPerMember: number
  waitlistCount: number
  upcomingDinnerGuests: number
  filledTables: number
  seatAssignments: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Members",
      value: stats?.totalMembers || 0,
      subtitle: `${stats?.activeSubscribers || 0} active subscribers`,
      icon: Users,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Upcoming Dinners",
      value: stats?.upcomingDinners || 0,
      subtitle: `${stats?.upcomingDinnerGuests || 0} guests`,
      icon: CalendarDays,
      trend: "Next: Wed, Dec 10",
      trendUp: null,
    },
    {
      title: "All Time Revenue",
      value: `$${((stats?.totalRevenue || 0) / 100).toFixed(2)}`,
      subtitle: "From subscriptions & credits",
      icon: DollarSign,
      trend: "+8.2%",
      trendUp: true,
    },
    {
      title: "Seat Fill Rate",
      value: `${(stats?.seatFillRate || 0).toFixed(1)}%`,
      subtitle: "Average across all dinners",
      icon: TrendingUp,
      trend: "+5.3%",
      trendUp: true,
    },
    {
      title: "Repeat Attendance",
      value: `${(stats?.repeatAttendance || 0).toFixed(1)}%`,
      subtitle: "Members attending multiple times",
      icon: UserCheck,
      trend: "+3.1%",
      trendUp: true,
    },
    {
      title: "Avg Credits/Member",
      value: (stats?.avgCreditsPerMember || 0).toFixed(1),
      subtitle: "Credit wallet average",
      icon: DollarSign,
      trend: "2.3 avg",
      trendUp: null,
    },
    {
      title: "Waitlist",
      value: stats?.waitlistCount || 0,
      subtitle: "Members waiting for spots",
      icon: Clock,
      trend: stats?.waitlistCount ? "Action needed" : "None",
      trendUp: false,
    },
    {
      title: "Filled Tables",
      value: `${stats?.filledTables || 0} of ${stats?.seatAssignments || 0}`,
      subtitle: "Table assignments",
      icon: UtensilsCrossed,
      trend: "0% pending",
      trendUp: null,
    },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">SVRN Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Track bookings, attendance & performance
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Badge variant="secondary" className="bg-green-600 text-white">
              Dinner price: $100
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Dinners Campaign Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Next dinner at</div>
                  <div className="text-xs text-muted-foreground">Wednesday, December 10 at 7:00 PM</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Reservations</div>
                  <div className="text-xs text-muted-foreground">07:00 PM, December 6</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Signups Closed</div>
                  <div className="text-xs text-muted-foreground">07:00 PM, December 8</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground mb-2">{stat.subtitle}</p>
                {stat.trend && (
                  <div className={`text-xs flex items-center gap-1 ${
                    stat.trendUp === true ? "text-green-600" :
                    stat.trendUp === false ? "text-orange-600" :
                    "text-muted-foreground"
                  }`}>
                    {stat.trendUp === true && <TrendingUp className="h-3 w-3" />}
                    {stat.trendUp === false && <AlertCircle className="h-3 w-3" />}
                    {stat.trend}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Revenue and Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Revenue</CardTitle>
            <CardDescription>Dec 10, 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">$0.00</div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>0 booked seats</span>
                <span>$0 per seat</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Historical Revenue</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              ${((stats?.totalRevenue || 0) / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audience Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Experience Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">0.0</div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Restaurants</span>
                <span className="font-medium">0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bars</span>
                <span className="font-medium">0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">People</span>
                <span className="font-medium">0.0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audience Gender</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Male</span>
                  <span>0%</span>
                </div>
                <div className="h-2 bg-muted rounded-full"></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Female</span>
                  <span>0%</span>
                </div>
                <div className="h-2 bg-muted rounded-full"></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Other</span>
                  <span>0%</span>
                </div>
                <div className="h-2 bg-muted rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audience Age</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["<20s", "30s", "40s", "50s", "60s+"].map((age) => (
                <div key={age}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{age}</span>
                    <span>0%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
