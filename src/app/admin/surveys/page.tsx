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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, ClipboardList } from "lucide-react"

interface Survey {
  id: number
  survey_type: string
  question: string
  question_type: string
  options?: string
  matching_weight: number
  is_required: boolean
  display_order: number
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null)
  const [formData, setFormData] = useState({
    survey_type: "onboarding",
    question: "",
    question_type: "text",
    options: "",
    matching_weight: 1,
    is_required: true,
    display_order: 0,
  })

  useEffect(() => {
    fetchSurveys()
  }, [typeFilter])

  const fetchSurveys = async () => {
    try {
      const url = `/api/admin/surveys?type=${typeFilter}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSurveys(data.surveys || [])
      }
    } catch (error) {
      console.error("Error fetching surveys:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSurveyTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      onboarding: "default",
      "post-dinner": "secondary",
    }

    return (
      <Badge variant={variants[type] as any || "outline"}>
        {type === "post-dinner" ? "Post-Dinner" : "Onboarding"}
      </Badge>
    )
  }

  const getQuestionTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      text: "Text",
      multiple_choice: "Multiple Choice",
      rating: "Rating",
      yes_no: "Yes/No",
    }

    return <Badge variant="outline">{labels[type] || type}</Badge>
  }

  const handleAddSurvey = () => {
    setEditingSurvey(null)
    setFormData({
      survey_type: "onboarding",
      question: "",
      question_type: "text",
      options: "",
      matching_weight: 1,
      is_required: true,
      display_order: surveys.length,
    })
    setDialogOpen(true)
  }

  const handleEditSurvey = (survey: Survey) => {
    setEditingSurvey(survey)
    setFormData({
      survey_type: survey.survey_type,
      question: survey.question,
      question_type: survey.question_type,
      options: survey.options || "",
      matching_weight: survey.matching_weight,
      is_required: survey.is_required,
      display_order: survey.display_order,
    })
    setDialogOpen(true)
  }

  const handleSaveSurvey = async () => {
    try {
      const method = editingSurvey ? "PUT" : "POST"
      
      // Parse options if it's a multiple choice question
      let optionsArray = null
      if (formData.question_type === "multiple_choice" && formData.options) {
        optionsArray = formData.options.split("\n").filter((opt) => opt.trim())
      }

      const payload = editingSurvey
        ? { ...formData, options: optionsArray, id: editingSurvey.id }
        : { ...formData, options: optionsArray }

      const response = await fetch("/api/admin/surveys", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setDialogOpen(false)
        fetchSurveys()
      }
    } catch (error) {
      console.error("Error saving survey:", error)
    }
  }

  const handleDeleteSurvey = async (id: number) => {
    if (!confirm("Are you sure you want to delete this survey question?")) return

    try {
      const response = await fetch(`/api/admin/surveys?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchSurveys()
      }
    } catch (error) {
      console.error("Error deleting survey:", error)
    }
  }

  const handleReorder = async (survey: Survey, direction: "up" | "down") => {
    const newOrder = direction === "up" ? survey.display_order - 1 : survey.display_order + 1
    
    try {
      const response = await fetch("/api/admin/surveys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: survey.id,
          survey_type: survey.survey_type,
          question: survey.question,
          question_type: survey.question_type,
          options: survey.options,
          matching_weight: survey.matching_weight,
          is_required: survey.is_required,
          display_order: newOrder,
        }),
      })

      if (response.ok) {
        fetchSurveys()
      }
    } catch (error) {
      console.error("Error reordering survey:", error)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Survey Configuration</h1>
          <p className="text-muted-foreground">
            Manage onboarding and post-dinner survey questions
          </p>
        </div>
        <Button onClick={handleAddSurvey}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="post-dinner">Post-Dinner</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Surveys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Questions ({surveys.length})</CardTitle>
          <CardDescription>
            Configure questions for member matching and feedback collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : surveys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No survey questions yet. Click "Add Question" to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Order</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Survey</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveys.map((survey, index) => (
                  <TableRow key={survey.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder(survey, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder(survey, "down")}
                          disabled={index === surveys.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-md">
                      <div>{survey.question}</div>
                      {survey.options && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Options: {typeof survey.options === 'string' 
                            ? (JSON.parse(survey.options) as string[]).join(", ") 
                            : (survey.options as any[]).join(", ")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getQuestionTypeBadge(survey.question_type)}</TableCell>
                    <TableCell>{getSurveyTypeBadge(survey.survey_type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{survey.matching_weight}x</Badge>
                    </TableCell>
                    <TableCell>
                      {survey.is_required ? (
                        <Badge variant="default">Required</Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSurvey(survey)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSurvey(survey.id)}
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

      {/* Add/Edit Survey Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSurvey ? "Edit Survey Question" : "Add New Survey Question"}
            </DialogTitle>
            <DialogDescription>
              {editingSurvey
                ? "Update survey question details and matching weight"
                : "Create a new survey question for onboarding or post-dinner feedback"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="survey_type">Survey Type *</Label>
                <Select
                  value={formData.survey_type}
                  onValueChange={(value) => setFormData({ ...formData, survey_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="post-dinner">Post-Dinner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="question_type">Question Type *</Label>
                <Select
                  value={formData.question_type}
                  onValueChange={(value) => setFormData({ ...formData, question_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="yes_no">Yes/No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="What brings you to our dinner events?"
                rows={2}
              />
            </div>

            {formData.question_type === "multiple_choice" && (
              <div className="space-y-2">
                <Label htmlFor="options">Options (one per line) *</Label>
                <Textarea
                  id="options"
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  rows={4}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matching_weight">Matching Weight</Label>
                <Input
                  id="matching_weight"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.matching_weight}
                  onChange={(e) => setFormData({ ...formData, matching_weight: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Higher weights prioritize this question in the matching algorithm (1-10)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_required"
                checked={formData.is_required}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_required: checked as boolean })
                }
              />
              <Label htmlFor="is_required" className="cursor-pointer">
                This question is required
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSurvey}>
              {editingSurvey ? "Update" : "Create"} Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
