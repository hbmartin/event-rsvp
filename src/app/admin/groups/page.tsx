"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { UserPlus, UserMinus, Users, Mail, Phone, CreditCard } from "lucide-react"
import { format } from "date-fns"

interface Assignment {
  id: number
  user_id: number
  table_number: number
  assigned_at: string
  name: string
  email: string
  phone?: string
  credit_balance: number
  survey_data?: any
}

interface AvailableMember {
  id: number
  name: string
  email: string
  credit_balance: number
  subscription_status?: string
}

interface Dinner {
  id: number
  title: string
  event_date: string
  restaurant_name: string
  seats: number
}

export default function GroupsPage() {
  const searchParams = useSearchParams()
  const [dinners, setDinners] = useState<Dinner[]>([])
  const [selectedDinner, setSelectedDinner] = useState<string>("")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([])
  const [loading, setLoading] = useState(true)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string>("")

  useEffect(() => {
    fetchDinners()
  }, [])

  useEffect(() => {
    if (selectedDinner) {
      fetchGroupAssignments()
    }
  }, [selectedDinner])

  const fetchDinners = async () => {
    try {
      const response = await fetch("/api/admin/dinners")
      if (response.ok) {
        const data = await response.json()
        setDinners(data.dinners || [])
        
        // Auto-select first dinner if available
        if (data.dinners && data.dinners.length > 0) {
          setSelectedDinner(data.dinners[0].id.toString())
        }
      }
    } catch (error) {
      console.error("Error fetching dinners:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupAssignments = async () => {
    if (!selectedDinner) return

    try {
      const response = await fetch(`/api/admin/groups?eventId=${selectedDinner}`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
        setAvailableMembers(data.availableMembers || [])
      }
    } catch (error) {
      console.error("Error fetching group assignments:", error)
    }
  }

  const handleAddMember = async () => {
    if (!selectedMemberId || !selectedDinner) return

    try {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: parseInt(selectedDinner),
          user_id: parseInt(selectedMemberId),
          table_number: 1,
        }),
      })

      if (response.ok) {
        setAddMemberDialogOpen(false)
        setSelectedMemberId("")
        fetchGroupAssignments()
      }
    } catch (error) {
      console.error("Error adding member:", error)
    }
  }

  const handleRemoveMember = async (assignmentId: number) => {
    if (!confirm("Remove this member from the dinner? Their credit will be refunded.")) return

    try {
      const response = await fetch(`/api/admin/groups?id=${assignmentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchGroupAssignments()
      }
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }

  const handleSwapTable = async (assignmentId: number, newTableNumber: number) => {
    try {
      const response = await fetch("/api/admin/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignmentId,
          table_number: newTableNumber,
        }),
      })

      if (response.ok) {
        fetchGroupAssignments()
      }
    } catch (error) {
      console.error("Error swapping table:", error)
    }
  }

  const currentDinner = dinners.find((d) => d.id.toString() === selectedDinner)
  const assignedCount = assignments.length
  const capacity = currentDinner?.seats || 6

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Group Management</h1>
          <p className="text-muted-foreground">
            View and manage dinner assignments, manually adjust groupings
          </p>
        </div>
      </div>

      {/* Dinner Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Dinner</CardTitle>
          <CardDescription>Choose a dinner to view and manage its group assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedDinner} onValueChange={setSelectedDinner}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a dinner..." />
            </SelectTrigger>
            <SelectContent>
              {dinners.map((dinner) => (
                <SelectItem key={dinner.id} value={dinner.id.toString()}>
                  {format(new Date(dinner.event_date), "MMM d, yyyy 'at' h:mm a")} - {dinner.title} ({dinner.restaurant_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedDinner && currentDinner && (
        <>
          {/* Dinner Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{capacity} seats</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignedCount} members</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Available Seats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{capacity - assignedCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Fill Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {capacity > 0 ? Math.round((assignedCount / capacity) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Members */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Assigned Members ({assignedCount}/{capacity})</CardTitle>
                  <CardDescription>
                    Members currently assigned to this dinner
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setAddMemberDialogOpen(true)}
                  disabled={assignedCount >= capacity}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No members assigned yet. Click "Add Member" to start building the group.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {assignment.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {assignment.email}
                            </div>
                            {assignment.phone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {assignment.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            {assignment.credit_balance}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Table {assignment.table_number}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(assignment.assigned_at), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(assignment.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Available Members */}
          <Card>
            <CardHeader>
              <CardTitle>Available Members ({availableMembers.length})</CardTitle>
              <CardDescription>
                Members with credits or active subscriptions who haven't been assigned yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No available members with credits or subscriptions
                </div>
              ) : (
                <div className="space-y-2">
                  {availableMembers.slice(0, 10).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        {member.subscription_status === "active" ? (
                          <Badge>Subscriber</Badge>
                        ) : (
                          <div className="flex items-center gap-1 text-sm">
                            <CreditCard className="h-4 w-4" />
                            {member.credit_balance} credits
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {availableMembers.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground pt-2">
                      And {availableMembers.length - 10} more available members...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to Dinner</DialogTitle>
            <DialogDescription>
              Select a member to assign to this dinner group
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Member</label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name} - {member.email}
                      {member.subscription_status === "active" 
                        ? " (Subscriber)" 
                        : ` (${member.credit_balance} credits)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedMemberId}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
