/**
 * Resources panel — upload, link, preview list
 */

'use client';

import { useState, type ChangeEvent } from 'react';
import { Button, Input, Spinner } from '@learnova/ui';
import { ExternalLink, FileUp, Plus, Trash2 } from 'lucide-react';
import type { CourseResource, CourseResourceType } from '@learnova/types';
import { useCreateResourceMutation, useDeleteResourceMutation } from '../hooks/use-builder-queries';
import { formatResourceType, RESOURCE_TYPE_OPTIONS, RESOURCE_VISIBILITY_OPTIONS } from '../lib/labels';

interface ResourcesPanelProps {
  courseId: string;
  lessonId: string;
  resources: CourseResource[];
}

const selectClass =
  'mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export function ResourcesPanel({ courseId, lessonId, resources }: ResourcesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<CourseResourceType>('pdf');
  const [newUrl, setNewUrl] = useState('');
  const [newVisibility, setNewVisibility] = useState('enrolled');

  const createMutation = useCreateResourceMutation(courseId);
  const deleteMutation = useDeleteResourceMutation(courseId);

  const handleAdd = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    try {
      await createMutation.mutateAsync({
        lessonId,
        title: newTitle.trim(),
        type: newType,
        url: newUrl.trim(),
        visibility: newVisibility,
      });
      setNewTitle('');
      setNewUrl('');
      setIsAdding(false);
    } catch {
      // handled by mutation
    }
  };

  const handleDelete = (resourceId: string) => {
    if (confirm('Delete this resource?')) {
      void deleteMutation.mutateAsync({ lessonId, resourceId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Resources</h3>
        {!isAdding ? (
          <Button type="button" variant="outline" size="sm" onClick={() => { setIsAdding(true); }}>
            <Plus className="size-4" />
            Add
          </Button>
        ) : null}
      </div>

      {isAdding ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <label className="text-sm font-medium" htmlFor="res-title">
              Title
            </label>
            <Input
              id="res-title"
              className="mt-1.5"
              value={newTitle}
              onChange={(e: ChangeEvent<HTMLInputElement>) => { setNewTitle(e.target.value); }}
              placeholder="Resource title"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="res-type">
              Type
            </label>
            <select
              id="res-type"
              className={selectClass}
              value={newType}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                { setNewType(e.target.value as CourseResourceType); }
              }
            >
              {RESOURCE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="res-url">
              URL
            </label>
            <Input
              id="res-url"
              className="mt-1.5"
              value={newUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => { setNewUrl(e.target.value); }}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="res-visibility">
              Visibility
            </label>
            <select
              id="res-visibility"
              className={selectClass}
              value={newVisibility}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => { setNewVisibility(e.target.value); }}
            >
              {RESOURCE_VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => void handleAdd()} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Spinner size="sm" /> : <FileUp className="size-4" />}
              Add
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setIsAdding(false); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {resources.length === 0 && !isAdding ? (
        <p className="text-sm text-muted-foreground">No resources yet.</p>
      ) : null}

      <div className="space-y-2">
        {resources.map((res) => (
          <div
            key={res.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{res.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatResourceType(res.type)} · {res.url ? 'External' : 'Uploaded'}
              </p>
              {res.url ? (
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="size-3" />
                  Open
                </a>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { handleDelete(res.id); }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
