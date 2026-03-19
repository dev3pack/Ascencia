'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, DollarSign } from 'lucide-react'

interface CreateIssueFormProps {
  onSubmit: (issue: {
    title: string
    description: string
    priority: string
    assignee?: string
  }) => void
  onCancel: () => void
}

export default function CreateIssueForm({ onSubmit, onCancel }: CreateIssueFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee: ''
  })
  const [showUbountyBadge, setShowUbountyBadge] = useState(false)
  const [createdIssueUrl, setCreatedIssueUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create the issue
    onSubmit(formData)
    
    // Simulate getting the created issue URL (would come from API response)
    const mockIssueUrl = `${window.location.origin}/issues/${Date.now()}`
    setCreatedIssueUrl(mockIssueUrl)
    setShowUbountyBadge(true)
  }

  const handleFundViaUbounty = () => {
    if (!createdIssueUrl) return
    
    const ubountyUrl = new URL('https://ubounty.io/create')
    ubountyUrl.searchParams.set('issue_url', createdIssueUrl)
    ubountyUrl.searchParams.set('title', formData.title)
    ubountyUrl.searchParams.set('description', formData.description)
    
    window.open(ubountyUrl.toString(), '_blank', 'noopener,noreferrer')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Create New Issue
          {showUbountyBadge && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <DollarSign className="w-3 h-3 mr-1" />
              Ubounty Ready
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter issue title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the issue in detail"
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee (Optional)</Label>
            <Input
              id="assignee"
              value={formData.assignee}
              onChange={(e) => handleInputChange('assignee', e.target.value)}
              placeholder="Enter assignee username or email"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Create Issue
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>

          {showUbountyBadge && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                🎉 Issue Created Successfully!
              </h3>
              <p className="text-sm text-green-700 mb-3">
                Want to add a bounty to incentivize faster resolution? Fund this issue via Ubounty.
              </p>
              <Button
                type="button"
                onClick={handleFundViaUbounty}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Fund via Ubounty
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}