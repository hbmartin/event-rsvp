"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Download, Mail, CreditCard, Users } from "lucide-react"
import { format } from "date-fns"

interface Member {
  id: number
  name: string
  email: string
  phone?: string
  credit_balance: number
  subscription_status: string
  subscription_renewal_date?: string
  attendance_count: number
  created_at: string
  city_name?: string
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [subscriptionFilter, setSubscriptionFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/admin/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSubscriptionBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "default",
      inactive: "secondary",
      paused: "outline",
    }

    return (
      <Badge variant={variants[status] as any || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSubscription =
      subscriptionFilter === "all" || member.subscription_status === subscriptionFilter

    const matchesCity =
      cityFilter === "all" || member.city_name === cityFilter

    return matchesSearch && matchesSubscription && matchesCity
  })

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Credits", "Subscription", "Attendance", "Joined"]
    const rows = filteredMembers.map((m) => [
      m.name,
      m.email,
      m.phone || "",
      m.credit_balance,
      m.subscription_status,
      m.attendance_count,
      format(new Date(m.created_at), "yyyy-MM-dd"),
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `members-export-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Member Management</h1>
          <p className="text-muted-foreground">
            Manage member profiles, credits, and subscriptions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Bulk Email
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <div className="text-2xl font-bold">{members.length}</div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Subscribers</p>
                <div className="text-2xl font-bold">
                  {members.filter((m) => m.subscription_status === "active").length}
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Attendance</p>
              <div className="text-2xl font-bold">
                {members.length > 0
                  ? (members.reduce((sum, m) => sum + m.attendance_count, 0) / members.length).toFixed(1)
                  : "0"}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
              <div className="text-2xl font-bold">
                {members.reduce((sum, m) => sum + m.credit_balance, 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No members found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || subscriptionFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No members have signed up yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                    <TableCell className="text-sm">{member.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.credit_balance} credits</Badge>
                    </TableCell>
                    <TableCell>{getSubscriptionBadge(member.subscription_status)}</TableCell>
                    <TableCell className="text-sm">{member.attendance_count} dinners</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(member.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
