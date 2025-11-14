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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, MapPin, Phone, Mail, Star } from "lucide-react"

interface Restaurant {
  id: number
  name: string
  address: string
  city_id: number
  city_name: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  capacity: number
  neighborhood?: string
  notes?: string
  booking_status: string
  dinners_hosted: number
  avg_rating: number
}

interface City {
  id: number
  name: string
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city_id: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    capacity: 6,
    neighborhood: "",
    notes: "",
    booking_status: "available",
  })

  useEffect(() => {
    fetchCities()
    fetchRestaurants()
  }, [])

  const fetchCities = async () => {
    try {
      const response = await fetch("/api/cities")
      if (response.ok) {
        const data = await response.json()
        setCities(data.cities || [])
      }
    } catch (error) {
      console.error("Error fetching cities:", error)
    }
  }

  const fetchRestaurants = async () => {
    try {
      const url = cityFilter === "all" 
        ? "/api/admin/restaurants"
        : `/api/admin/restaurants?cityId=${cityFilter}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setRestaurants(data.restaurants || [])
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loading) {
      fetchRestaurants()
    }
  }, [cityFilter])

  const getBookingStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      available: "default",
      reserved: "secondary",
      confirmed: "outline",
    }

    return (
      <Badge variant={variants[status] as any || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch =
      restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const handleAddRestaurant = () => {
    setEditingRestaurant(null)
    setFormData({
      name: "",
      address: "",
      city_id: cities[0]?.id?.toString() || "",
      contact_name: "",
      contact_phone: "",
      contact_email: "",
      capacity: 6,
      neighborhood: "",
      notes: "",
      booking_status: "available",
    })
    setDialogOpen(true)
  }

  const handleEditRestaurant = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant)
    setFormData({
      name: restaurant.name,
      address: restaurant.address,
      city_id: restaurant.city_id.toString(),
      contact_name: restaurant.contact_name || "",
      contact_phone: restaurant.contact_phone || "",
      contact_email: restaurant.contact_email || "",
      capacity: restaurant.capacity,
      neighborhood: restaurant.neighborhood || "",
      notes: restaurant.notes || "",
      booking_status: restaurant.booking_status,
    })
    setDialogOpen(true)
  }

  const handleSaveRestaurant = async () => {
    try {
      const method = editingRestaurant ? "PUT" : "POST"
      const payload = editingRestaurant
        ? { ...formData, id: editingRestaurant.id }
        : formData

      const response = await fetch("/api/admin/restaurants", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setDialogOpen(false)
        fetchRestaurants()
      }
    } catch (error) {
      console.error("Error saving restaurant:", error)
    }
  }

  const handleDeleteRestaurant = async (id: number) => {
    if (!confirm("Are you sure you want to delete this restaurant?")) return

    try {
      const response = await fetch(`/api/admin/restaurants?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchRestaurants()
      }
    } catch (error) {
      console.error("Error deleting restaurant:", error)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Restaurant Management</h1>
          <p className="text-muted-foreground">
            Manage restaurant partners, booking status, and performance
          </p>
        </div>
        <Button onClick={handleAddRestaurant}>
          <Plus className="h-4 w-4 mr-2" />
          Add Restaurant
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, or neighborhood..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id.toString()}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Restaurants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Restaurants ({filteredRestaurants.length})</CardTitle>
          <CardDescription>
            View and manage restaurant partners across all cities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Neighborhood</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Booking Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{restaurant.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {restaurant.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{restaurant.city_name}</TableCell>
                    <TableCell>{restaurant.neighborhood || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {restaurant.contact_name && (
                          <div>{restaurant.contact_name}</div>
                        )}
                        {restaurant.contact_phone && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {restaurant.contact_phone}
                          </div>
                        )}
                        {restaurant.contact_email && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {restaurant.contact_email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{restaurant.capacity} seats</TableCell>
                    <TableCell>{getBookingStatusBadge(restaurant.booking_status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{restaurant.dinners_hosted} dinners</div>
                        {restaurant.avg_rating > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {parseFloat(restaurant.avg_rating.toString()).toFixed(1)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRestaurant(restaurant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRestaurant(restaurant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Restaurant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRestaurant ? "Edit Restaurant" : "Add New Restaurant"}
            </DialogTitle>
            <DialogDescription>
              {editingRestaurant
                ? "Update restaurant details and booking status"
                : "Add a new restaurant partner to the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select
                  value={formData.city_id}
                  onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Neighborhood</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Table Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking_status">Booking Status</Label>
              <Select
                value={formData.booking_status}
                onValueChange={(value) => setFormData({ ...formData, booking_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Dietary accommodations, private room availability, etc."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRestaurant}>
              {editingRestaurant ? "Update" : "Create"} Restaurant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
