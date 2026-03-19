'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ExternalLink, CreditCard } from 'lucide-react';

interface CreateIssueFormProps {
  onSubmit: (issue: IssueData) => void;
  onCancel: () => void;
}

interface IssueData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  labels: string[];
}

const CreateIssueForm: React.FC<CreateIssueFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [labels, setLabels] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const issueData: IssueData = {
      title,
      description,
      priority,
      labels: labels.split(',').map(label => label.trim()).filter(label => label.length > 0)
    };

    try {
      await onSubmit(issueData);
      // Simulate getting issue URL after creation
      const mockIssueUrl = `https://github.com/example/repo/issues/${Math.floor(Math.random() * 1000)}`;
      setIssueUrl(mockIssueUrl);
    } catch (error) {
      console.error('Error creating issue:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFundViaUbounty = () => {
    if (issueUrl) {
      const ubountyUrl = `https://ubounty.com/fund?issue_url=${encodeURIComponent(issueUrl)}`;
      window.open(ubountyUrl, '_blank');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Issue</CardTitle>
        <CardDescription>
          Create a new issue and optionally fund it via Ubounty to incentivize contributors
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the issue, including steps to reproduce, expected behavior, etc."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <Badge className={getPriorityColor(priority)}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="labels">Labels</Label>
            <Input
              id="labels"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="Enter labels separated by commas (e.g., bug, frontend, urgent)"
            />
            <p className="text-sm text-gray-500">
              Separate multiple labels with commas
            </p>
          </div>

          {issueUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Issue Created Successfully!</h3>
              <p className="text-sm text-green-700 mb-3">
                Your issue has been created. You can now fund it via Ubounty to attract contributors.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleFundViaUbounty}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Fund via Ubounty
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <CreditCard className="w-3 h-3 mr-1" />
                  Crypto & Fiat Payments
                </Badge>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !description.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Issue'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateIssueForm;