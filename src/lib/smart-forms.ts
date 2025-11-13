/* eslint-disable @typescript-eslint/no-explicit-any */
import { executeQuery } from "./database"
import { CustomFormField, FormTemplate } from "./types"

export async function createFormTemplate(
  name: string,
  description: string,
  fields: CustomFormField[],
  userId: number,
  isPublic: boolean = false
): Promise<FormTemplate | null> {
  try {
    const result = await executeQuery(
      `INSERT INTO form_templates (name, description, fields, created_by, is_public) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, description, JSON.stringify(fields), userId, isPublic]
    ) as any

    return {
      id: result.rows[0].id,
      name,
      description,
      fields,
      created_by: userId,
      created_at: new Date().toISOString(),
      is_public: isPublic
    }
  } catch (error) {
    console.error("Error creating form template:", error)
    return null
  }
}

export async function getFormTemplates(userId: number): Promise<FormTemplate[]> {
  try {
    const results = await executeQuery(
      `SELECT * FROM form_templates 
       WHERE created_by = $1 OR is_public = true 
       ORDER BY created_at DESC`,
      [userId]
    ) as any[]

    return results.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      fields: JSON.parse(row.fields),
      created_by: row.created_by,
      created_at: row.created_at,
      is_public: row.is_public
    }))
  } catch (error) {
    console.error("Error fetching form templates:", error)
    return []
  }
}

export async function updateFormTemplate(
  templateId: number,
  name: string,
  description: string,
  fields: CustomFormField[]
): Promise<boolean> {
  try {
    await executeQuery(
      `UPDATE form_templates 
       SET name = $1, description = $2, fields = $3 
       WHERE id = $4`,
      [name, description, JSON.stringify(fields), templateId]
    )
    return true
  } catch (error) {
    console.error("Error updating form template:", error)
    return false
  }
}

export async function deleteFormTemplate(templateId: number): Promise<boolean> {
  try {
    await executeQuery(`DELETE FROM form_templates WHERE id = $1`, [templateId])
    return true
  } catch (error) {
    console.error("Error deleting form template:", error)
    return false
  }
}

export function validateFormField(field: CustomFormField, value: any): {
  isValid: boolean
  error?: string
} {
  // Required field validation
  if (field.required && (!value || value.toString().trim() === '')) {
    return {
      isValid: false,
      error: `${field.label} is required`
    }
  }

  // Type-specific validation
  switch (field.type) {
    case 'email':
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return {
          isValid: false,
          error: `${field.label} must be a valid email address`
        }
      }
      break

    case 'select':
    case 'radio':
      if (value && field.options && !field.options.includes(value)) {
        return {
          isValid: false,
          error: `${field.label} must be one of the provided options`
        }
      }
      break

    case 'checkbox':
      if (field.required && (!Array.isArray(value) || value.length === 0)) {
        return {
          isValid: false,
          error: `${field.label} requires at least one selection`
        }
      }
      break

    case 'file':
      if (value && typeof value === 'object' && value.size > 10 * 1024 * 1024) { // 10MB limit
        return {
          isValid: false,
          error: `${field.label} file size must be less than 10MB`
        }
      }
      break
  }

  return { isValid: true }
}

export function evaluateFieldConditions(
  field: CustomFormField,
  formData: Record<string, any>
): boolean {
  if (!field.conditions || field.conditions.length === 0) {
    return true // No conditions means always show
  }

  // All conditions must be true (AND logic)
  return field.conditions.every(condition => {
    const fieldValue = formData[condition.field_id]
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'not_equals':
        return fieldValue !== condition.value
      case 'contains':
        return fieldValue && fieldValue.toString().toLowerCase().includes(condition.value.toLowerCase())
      default:
        return false
    }
  })
}

export function processConditionalForm(
  fields: CustomFormField[],
  formData: Record<string, any>
): {
  visibleFields: CustomFormField[]
  validationErrors: Record<string, string>
} {
  const visibleFields: CustomFormField[] = []
  const validationErrors: Record<string, string> = {}

  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => a.order - b.order)

  for (const field of sortedFields) {
    // Check if field should be visible based on conditions
    if (evaluateFieldConditions(field, formData)) {
      visibleFields.push(field)

      // Validate visible fields
      const validation = validateFormField(field, formData[field.id])
      if (!validation.isValid && validation.error) {
        validationErrors[field.id] = validation.error
      }
    }
  }

  return {
    visibleFields,
    validationErrors
  }
}

export async function saveFormResponse(
  eventId: number,
  userId: number | null,
  guestName: string | null,
  guestEmail: string | null,
  responses: Record<string, any>,
  rsvpStatus: 'yes' | 'no' | 'maybe'
): Promise<boolean> {
  try {
    if (userId) {
      // Save as user RSVP with custom responses
      await executeQuery(
        `INSERT INTO rsvp (event_id, user_id, status, custom_responses) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3, custom_responses = $4`,
        [eventId, userId, rsvpStatus, JSON.stringify(responses)]
      )
    } else {
      // Save as guest with custom responses
      await executeQuery(
        `INSERT INTO guests (event_id, name, email, status, custom_responses) 
         VALUES ($1, $2, $3, $4, $5)`,
        [eventId, guestName, guestEmail, rsvpStatus, JSON.stringify(responses)]
      )
    }

    return true
  } catch (error) {
    console.error("Error saving form response:", error)
    return false
  }
}

export async function getFormResponses(eventId: number): Promise<{
  userResponses: any[]
  guestResponses: any[]
}> {
  try {
    // Get user responses
    const userResponses = await executeQuery(
      `SELECT r.*, u.name, u.email 
       FROM rsvp r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.event_id = $1 AND r.custom_responses IS NOT NULL`,
      [eventId]
    ) as any[]

    // Get guest responses
    const guestResponses = await executeQuery(
      `SELECT * FROM guests 
       WHERE event_id = $1 AND custom_responses IS NOT NULL`,
      [eventId]
    ) as any[]

    return {
      userResponses: userResponses.map(row => ({
        ...row,
        custom_responses: JSON.parse(row.custom_responses || '{}')
      })),
      guestResponses: guestResponses.map(row => ({
        ...row,
        custom_responses: JSON.parse(row.custom_responses || '{}')
      }))
    }
  } catch (error) {
    console.error("Error fetching form responses:", error)
    return {
      userResponses: [],
      guestResponses: []
    }
  }
}

export function generateFieldId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function createDefaultFormFields(): CustomFormField[] {
  return [
    {
      id: generateFieldId(),
      type: 'select',
      label: 'Will you attend?',
      required: true,
      options: ['Yes', 'No', 'Maybe'],
      order: 1
    },
    {
      id: generateFieldId(),
      type: 'text',
      label: 'Dietary Restrictions',
      required: false,
      conditions: [
        {
          field_id: generateFieldId(), // This would be replaced with actual RSVP field ID
          operator: 'equals',
          value: 'Yes'
        }
      ],
      order: 2
    },
    {
      id: generateFieldId(),
      type: 'radio',
      label: 'T-Shirt Size',
      required: false,
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      conditions: [
        {
          field_id: generateFieldId(), // This would be replaced with actual RSVP field ID
          operator: 'equals',
          value: 'Yes'
        }
      ],
      order: 3
    }
  ]
}