"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Users, DollarSign, Star, MapPin } from "lucide-react"
import { format } from "date-fns"

export default function AnalyticsPage() {
  const [cohortData, setCohortData] = useState<any[]>([])
  const [cityData, setCityData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllAnalytics()
  }, [])

  const fetchAllAnalytics = async () => {
    try {
      const [cohortRes, cityRes, revenueRes, performanceRes] = await Promise.all([
        fetch("/api/admin/analytics?type=cohort"),
        fetch("/api/admin/analytics?type=city_demand"),
        fetch("/api/admin/analytics?type=revenue"),
        fetch("/api/admin/analytics?type=performance"),
      ])

      if (cohortRes.ok) {
        const data = await cohortRes.json()
        setCohortData(data.cohortData || [])
      }

      if (cityRes.ok) {
        const data = await cityRes.json()
        setCityData(data.cityData || [])
      }

      if (revenueRes.ok) {
        const data = await revenueRes.json()
        setRevenueData(data.revenueData || [])
      }

      if (performanceRes.ok) {
        const data = await performanceRes.json()
        setPerformanceData(data.performanceData || [])
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics on member retention, city demand, revenue, and performance
        </p>
      </div>

      <Tabs defaultValue="cohort" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cohort">
            <Users className="h-4 w-4 mr-2" />
            Cohort Analysis
          </TabsTrigger>
          <TabsTrigger value="city">
            <MapPin className="h-4 w-4 mr-2" />
            City Demand
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Star className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Cohort Analysis Tab */}
        <TabsContent value="cohort" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Retention by Signup Cohort</CardTitle>
              <CardDescription>
                Track how many members return for additional dinners after signing up
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : cohortData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No cohort data available yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Signup Month</TableHead>
                      <TableHead className="text-right">Total Signups</TableHead>
                      <TableHead className="text-right">Month 1 Retention</TableHead>
                      <TableHead className="text-right">Month 2 Retention</TableHead>
                      <TableHead className="text-right">Month 3 Retention</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cohortData.map((cohort, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {format(new Date(cohort.signup_month), "MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">{cohort.total_signups}</TableCell>
                        <TableCell className="text-right">{cohort.retention_month_1}%</TableCell>
                        <TableCell className="text-right">{cohort.retention_month_2}%</TableCell>
                        <TableCell className="text-right">{cohort.retention_month_3}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* City Demand Tab */}
        <TabsContent value="city" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cityData.map((city) => (
              <Card key={city.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {city.city_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Members</span>
                    <span className="font-medium">{city.total_members}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Dinners</span>
                    <span className="font-medium">{city.total_dinners}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Upcoming Dinners</span>
                    <span className="font-medium">{city.upcoming_dinners}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Assignments</span>
                    <span className="font-medium">{city.total_assignments}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Seats/Dinner</span>
                    <span className="font-medium">
                      {parseFloat(city.avg_seats_per_dinner).toFixed(1)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {cityData.length === 0 && !loading && (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                No city data available
              </div>
            )}
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Breakdown</CardTitle>
              <CardDescription>
                Track revenue from subscriptions and credit purchases over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : revenueData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No revenue data available yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Credit Revenue</TableHead>
                      <TableHead className="text-right">Subscription Revenue</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Credit Buyers</TableHead>
                      <TableHead className="text-right">Subscribers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueData.map((revenue, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {format(new Date(revenue.month), "MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          ${parseFloat(revenue.credit_revenue).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${parseFloat(revenue.subscription_revenue).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${parseFloat(revenue.total_revenue).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">{revenue.credit_buyers}</TableCell>
                        <TableCell className="text-right">{revenue.subscribers}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Restaurants</CardTitle>
              <CardDescription>
                Restaurants ranked by number of dinners hosted and member ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : performanceData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No restaurant performance data available yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Dinners Hosted</TableHead>
                      <TableHead className="text-right">Total Guests</TableHead>
                      <TableHead className="text-right">Avg Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.map((restaurant, index) => (
                      <TableRow key={restaurant.id}>
                        <TableCell className="font-medium">
                          #{index + 1} {restaurant.restaurant_name}
                        </TableCell>
                        <TableCell>{restaurant.city_name}</TableCell>
                        <TableCell className="text-right">{restaurant.dinners_hosted}</TableCell>
                        <TableCell className="text-right">{restaurant.total_guests}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {parseFloat(restaurant.avg_rating).toFixed(1)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
