import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, ExternalLink } from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'closed';
  assignee?: string;
  labels: string[];
  createdAt: string;
  bounty?: {
    amount: number;
    currency: string;
    status: 'active' | 'claimed' | 'expired';
    ubountyId: string;
  };
}

interface IssueCreationFormProps {
  onSubmit: (issue: Omit<Issue, 'id' | 'createdAt'>) => void;
  isLoading?: boolean;
}

export default function IssueCreationForm({ onSubmit, isLoading = false }: IssueCreationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Issue['priority'],
    status: 'open' as Issue['status'],
    assignee: '',
    labels: [] as string[],
  });
  const [labelInput, setLabelInput] = useState('');
  const [showUbountyOptions, setShowUbountyOptions] = useState(false);
  const [bountyAmount, setBountyAmount] = useState('');
  const [bountyCreating, setBountyCreating] = useState(false);
  const [ubountyBadge, setUbountyBadge] = useState<{
    show: boolean;
    amount: number;
    currency: string;
    ubountyId: string;
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLabel = () => {
    if (labelInput.trim() && !formData.labels.includes(labelInput.trim())) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, labelInput.trim()]
      }));
      setLabelInput('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const issueData = {
      ...formData,
      bounty: ubountyBadge ? {
        amount: ubountyBadge.amount,
        currency: ubountyBadge.currency,
        status: 'active' as const,
        ubountyId: ubountyBadge.ubountyId
      } : undefined
    };
    onSubmit(issueData);
  };

  const handleFundViaUbounty = async () => {
    if (!bountyAmount || parseFloat(bountyAmount) <= 0) {
      return;
    }

    setBountyCreating(true);
    try {
      // Simulate Ubounty API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const ubountyId = `ubty_${Math.random().toString(36).substr(2, 9)}`;
      setUbountyBadge({
        show: true,
        amount: parseFloat(bountyAmount),
        currency: 'USD',
        ubountyId
      });
      setShowUbountyOptions(false);
      setBountyAmount('');
    } catch (error) {
      console.error('Failed to create Ubounty bounty:', error);
    } finally {
      setBountyCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Create New Issue
          {ubountyBadge && (
            <Badge variant="outline" className="flex items-center gap-2 bg-green-50 border-green-200">
              <DollarSign className="w-4 h-4" />
              ${ubountyBadge.amount} USD Bounty
              <ExternalLink className="w-3 h-3" />
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter issue title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the issue in detail"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Input
              id="assignee"
              value={formData.assignee}
              onChange={(e) => handleInputChange('assignee', e.target.value)}
              placeholder="Enter assignee username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="labels">Labels</Label>
            <div className="flex gap-2">
              <Input
                id="labels"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="Add label"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
              />
              <Button type="button" variant="outline" onClick={addLabel}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.labels.map((label) => (
                <Badge key={label} variant="secondary" className="cursor-pointer" onClick={() => removeLabel(label)}>
                  {label} ×
                </Badge>
              ))}
            </div>
          </div>

          {/* Ubounty Integration Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Bounty Funding</Label>
              {!ubountyBadge && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUbountyOptions(!showUbountyOptions)}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Fund via Ubounty
                </Button>
              )}
            </div>

            {showUbountyOptions && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bountyAmount">Bounty Amount (USD)</Label>
                    <Input
                      id="bountyAmount"
                      type="number"
                      value={bountyAmount}
                      onChange={(e) => setBountyAmount(e.target.value)}
                      placeholder="Enter amount in USD"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  
                  <Alert>
                    <AlertDescription>
                      This will create a bounty on Ubounty that will be automatically linked to this issue. 
                      The bounty will be paid out when the issue is successfully resolved.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleFundViaUbounty}
                      disabled={!bountyAmount || parseFloat(bountyAmount) <= 0 || bountyCreating}
                      className="flex items-center gap-2"
                    >
                      {bountyCreating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                      {bountyCreating ? 'Creating Bounty...' : 'Create Bounty'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUbountyOptions(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {ubountyBadge && (
              <Alert className="bg-green-50 border-green-200">
                <DollarSign className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Bounty of ${ubountyBadge.amount} USD has been created on Ubounty (ID: {ubountyBadge.ubountyId}). 
                  This will be displayed on the issue once created.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Issue...
                </>
              ) : (
                'Create Issue'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}