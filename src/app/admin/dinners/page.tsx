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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Search, Calendar, Users, MapPin } from "lucide-react"
import { format } from "date-fns"

interface Dinner {
  id: number
  title: string
  event_date: string
  location: string
  restaurant_name?: string
  status: string
  seats: number
  assigned_count: number
  city_name?: string
}

export default function DinnersManagementPage() {
  const [dinners, setDinners] = useState<Dinner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    fetchDinners()
  }, [])

  const fetchDinners = async () => {
    try {
      const response = await fetch("/api/admin/dinners")
      if (response.ok) {
        const data = await response.json()
        setDinners(data.dinners || [])
      }
    } catch (error) {
      console.error("Error fetching dinners:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "secondary",
      confirmed: "default",
      closed: "outline",
      completed: "secondary",
    }

    return (
      <Badge variant={variants[status] as any || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredDinners = dinners.filter((dinner) => {
    const matchesSearch =
      dinner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dinner.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dinner.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || dinner.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dinner Management</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage social dining events
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Dinner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Dinner</DialogTitle>
              <DialogDescription>
                Set up a new 6-person dinner event and invite matched members
              </DialogDescription>
            </DialogHeader>
            <CreateDinnerForm onSuccess={() => {
              setCreateDialogOpen(false)
              fetchDinners()
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search dinners by title, location, or restaurant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dinners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming & Past Dinners</CardTitle>
          <CardDescription>
            {filteredDinners.length} dinner{filteredDinners.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredDinners.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No dinners found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first dinner event"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Dinner
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDinners.map((dinner) => (
                  <TableRow key={dinner.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(dinner.event_date), "MMM dd, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(dinner.event_date), "h:mm a")}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{dinner.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{dinner.city_name || dinner.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dinner.restaurant_name || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {dinner.assigned_count || 0}/{dinner.seats || 6}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(dinner.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View Details
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

function CreateDinnerForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    restaurant_id: "",
    seats: 6,
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/admin/dinners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error creating dinner:", error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Dinner Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Wednesday Night Dinner - Santa Monica"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_date">Date & Time *</Label>
          <Input
            id="event_date"
            type="datetime-local"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seats">Number of Seats *</Label>
          <Input
            id="seats"
            type="number"
            min="2"
            max="12"
            value={formData.seats}
            onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Dinner"}
        </Button>
      </div>
    </form>
  )
}
