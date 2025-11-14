"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Webhook, Ticket, Plus, Trash2, Copy, Check } from "lucide-react"
import { format } from "date-fns"

interface PromoCode {
  id: number
  code: string
  credits: number
  max_uses: number
  current_uses: number
  expires_at?: string
  created_at: string
}

export default function SettingsPage() {
  const [templates, setTemplates] = useState<any>({})
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [promoDialogOpen, setPromoDialogOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [promoFormData, setPromoFormData] = useState({
    code: "",
    credits: 1,
    max_uses: 100,
    expires_at: "",
  })

  useEffect(() => {
    fetchSettings()
    fetchPromoCodes()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || {})
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch("/api/admin/settings?type=promo_codes")
      if (response.ok) {
        const data = await response.json()
        setPromoCodes(data.promoCodes || [])
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error)
    }
  }

  const handleCreatePromoCode = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promoFormData),
      })

      if (response.ok) {
        setPromoDialogOpen(false)
        setPromoFormData({
          code: "",
          credits: 1,
          max_uses: 100,
          expires_at: "",
        })
        fetchPromoCodes()
      }
    } catch (error) {
      console.error("Error creating promo code:", error)
    }
  }

  const handleDeletePromoCode = async (id: number) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return

    try {
      const response = await fetch(`/api/admin/settings?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchPromoCodes()
      }
    } catch (error) {
      console.error("Error deleting promo code:", error)
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings & Configuration</h1>
        <p className="text-muted-foreground">
          Manage notification templates, webhooks, and promo codes
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">
            <Mail className="h-4 w-4 mr-2" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="promo">
            <Ticket className="h-4 w-4 mr-2" />
            Promo Codes
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Email Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notification Templates</CardTitle>
              <CardDescription>
                Customize email templates for confirmations, reminders, and surveys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(templates).map(([key, template]: [string, any]) => (
                <div key={key} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium capitalize">
                      {key.replace(/_/g, " ")}
                    </h3>
                    <Button variant="outline" size="sm" disabled>
                      Edit Template
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Subject</Label>
                      <div className="text-sm bg-muted p-2 rounded mt-1">
                        {template.subject}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Body</Label>
                      <div className="text-sm bg-muted p-2 rounded mt-1 whitespace-pre-wrap">
                        {template.body}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Available variables: {`{name}, {date}, {time}, {restaurant}, {credits}, {survey_link}, {purchase_link}`}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promo Codes Tab */}
        <TabsContent value="promo" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Promo Codes</CardTitle>
                  <CardDescription>
                    Create and manage promotional codes for free credits
                  </CardDescription>
                </div>
                <Button onClick={() => setPromoDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Promo Code
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {promoCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No promo codes created yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead className="text-right">Uses</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell className="font-mono font-medium">
                          <div className="flex items-center gap-2">
                            {promo.code}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(promo.code)}
                            >
                              {copiedCode === promo.code ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{promo.credits}</TableCell>
                        <TableCell className="text-right">
                          {promo.current_uses || 0} / {promo.max_uses}
                        </TableCell>
                        <TableCell>
                          {promo.expires_at
                            ? format(new Date(promo.expires_at), "MMM d, yyyy")
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(promo.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePromoCode(promo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Configure webhooks for external integrations (Slack, analytics, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Dinner Confirmed</h3>
                      <p className="text-sm text-muted-foreground">
                        Triggered when a dinner is confirmed
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Configure
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    POST {"{"}webhook_url{"}"} with dinner details
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">New Member Signup</h3>
                      <p className="text-sm text-muted-foreground">
                        Triggered when a new member signs up
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Configure
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    POST {"{"}webhook_url{"}"} with member details
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Survey Completed</h3>
                      <p className="text-sm text-muted-foreground">
                        Triggered when a member completes a survey
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Configure
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    POST {"{"}webhook_url{"}"} with survey responses
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Promo Code Dialog */}
      <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>
              Generate a new promotional code for free credits
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promo Code *</Label>
              <Input
                id="code"
                placeholder="WELCOME2025"
                value={promoFormData.code}
                onChange={(e) =>
                  setPromoFormData({ ...promoFormData, code: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credits">Credits *</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  value={promoFormData.credits}
                  onChange={(e) =>
                    setPromoFormData({ ...promoFormData, credits: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_uses">Max Uses *</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={promoFormData.max_uses}
                  onChange={(e) =>
                    setPromoFormData({ ...promoFormData, max_uses: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
              <Input
                id="expires_at"
                type="date"
                value={promoFormData.expires_at}
                onChange={(e) =>
                  setPromoFormData({ ...promoFormData, expires_at: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePromoCode}>Create Promo Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
