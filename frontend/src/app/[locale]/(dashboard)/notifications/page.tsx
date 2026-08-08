'use client';

import { Button, Card, Input, Skeleton } from '@learnova/ui';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationSocket,
  useNotificationsQuery,
} from '@/features/notification';

export default function NotificationsPage() {
  const t = useTranslations('dashboard.notifications');
  const [search, setSearch] = useState('');
  useNotificationSocket();
  const listQuery = useNotificationsQuery({ q: search || undefined });
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();
  const items = listQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={markAllMutation.isPending}
          onClick={() => {
            void markAllMutation.mutateAsync();
          }}
        >
          {t('markAllRead')}
        </Button>
      </div>

      <Input
        placeholder={t('search')}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
      />

      {listQuery.isLoading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : items.length === 0 ? (
        <Card className="rounded-2xl border-border/80 p-6 text-sm text-muted-foreground">
          {t('empty')}
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`rounded-2xl border-border/80 p-4 ${item.read ? '' : 'border-primary/30 bg-primary/5'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                    {item.type.replaceAll('_', ' ')}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!item.read ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void markReadMutation.mutateAsync(item.id);
                      }}
                    >
                      {t('markRead')}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t('delete')}
                    onClick={() => {
                      void deleteMutation.mutateAsync(item.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
