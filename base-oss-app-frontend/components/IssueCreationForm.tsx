import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface IssueCreationFormProps {
  onSubmit: (issueData: IssueFormData) => void;
  onCancel: () => void;
}

export interface IssueFormData {
  title: string;
  description: string;
  labels: string[];
  assignee?: string;
  payment_method?: 'ubounty' | 'direct' | '';
  ubounty_url?: string;
}

export default function IssueCreationForm({ onSubmit, onCancel }: IssueCreationFormProps) {
  const [formData, setFormData] = useState<IssueFormData>({
    title: '',
    description: '',
    labels: [],
  });
  const [isUbountySelected, setIsUbountySelected] = useState(false);
  const [issueUrl, setIssueUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      payment_method: isUbountySelected ? 'ubounty' : '',
      ubounty_url: isUbountySelected ? `https://ubounty.io/create-bounty?issue_url=${encodeURIComponent(issueUrl)}` : '',
    });
  };

  const handleInputChange = (field: keyof IssueFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUbountyClick = () => {
    const repoUrl = window.location.origin + window.location.pathname;
    const issueTitle = encodeURIComponent(formData.title || 'New Issue');
    const issueDescription = encodeURIComponent(formData.description || '');
    
    // Construct the expected issue URL (this would be the actual URL once the issue is created)
    const expectedIssueUrl = `${repoUrl}/issues/new?title=${issueTitle}&body=${issueDescription}`;
    
    // Open Ubounty with pre-filled issue URL
    const ubountyUrl = `https://ubounty.io/create-bounty?issue_url=${encodeURIComponent(expectedIssueUrl)}&title=${issueTitle}`;
    
    window.open(ubountyUrl, '_blank');
    setIsUbountySelected(true);
    setIssueUrl(expectedIssueUrl);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Create New Issue
          {isUbountySelected && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
              Ubounty Integration Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter issue title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="labels">Labels (comma-separated)</Label>
            <Input
              id="labels"
              value={formData.labels.join(', ')}
              onChange={(e) => handleInputChange('labels', e.target.value.split(',').map(label => label.trim()).filter(Boolean))}
              placeholder="bug, enhancement, documentation..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee (optional)</Label>
            <Input
              id="assignee"
              value={formData.assignee || ''}
              onChange={(e) => handleInputChange('assignee', e.target.value)}
              placeholder="Username or email..."
            />
          </div>

          <div className="border-t pt-6">
            <div className="flex flex-col space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Bounty Integration</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUbountyClick}
                  className="flex items-center space-x-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <span>Fund via Ubounty</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {isUbountySelected && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Ubounty bounty creation initiated. The bounty will be linked to this issue once created.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Create Issue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}