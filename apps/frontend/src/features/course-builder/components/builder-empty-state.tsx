/**
 * Empty state when no module/lesson is selected
 */

import { Button } from '@learnova/ui';
import { FolderPlus, Plus } from 'lucide-react';

interface BuilderEmptyStateProps {
  type: 'no-modules' | 'no-lesson-selected';
  onCreateModule?: () => void;
}

export function BuilderEmptyState({ type, onCreateModule }: BuilderEmptyStateProps) {
  if (type === 'no-modules') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-sm text-center">
          <FolderPlus className="mx-auto size-12 text-muted-foreground/60" />
          <h3 className="mt-4 font-display text-lg font-semibold">No modules yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first module to organize course lessons.
          </p>
          {onCreateModule ? (
            <Button onClick={onCreateModule} className="mt-4">
              <Plus className="size-4" />
              Create Module
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-sm text-center">
        <h3 className="font-display text-lg font-semibold text-muted-foreground">
          Select a lesson
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a lesson from the sidebar to edit its content and settings.
        </p>
      </div>
    </div>
  );
}
