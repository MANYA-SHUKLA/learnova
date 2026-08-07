'use client';

import { APP_ROUTES, PERMISSIONS } from '@learnova/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@learnova/ui';
import { useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { useCreatePracticeLabMutation } from '@/features/practice-lab';
import { Link, useRouter } from '@/lib/i18n/routing';

export default function CreatePracticeLabPage() {
  const router = useRouter();
  const createMutation = useCreatePracticeLabMutation();
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <PermissionGate permission={PERMISSIONS.LAB_WRITE} enforce>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">Practice Labs</p>
          <h1 className="mt-1 font-display text-2xl font-semibold">Create practice lab</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Attach a coding lab to a course, then add problems and test cases.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lab details</CardTitle>
            <CardDescription>Draft labs stay private until published.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Course ID</label>
              <Input value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Mongo ObjectId" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Intro to Python" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button
                disabled={createMutation.isPending || !courseId || !title}
                onClick={async () => {
                  setError(null);
                  try {
                    const lab = await createMutation.mutateAsync({
                      courseId,
                      title,
                      description: description || null,
                      languages: ['python', 'javascript', 'cpp', 'java'],
                    });
                    router.push(`/institution/practice-labs/${lab.id}/problems`);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to create lab');
                  }
                }}
              >
                Create lab
              </Button>
              <Button variant="outline" asChild>
                <Link href={APP_ROUTES.INSTITUTION_PRACTICE_LABS}>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}
