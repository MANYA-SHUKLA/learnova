'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Badge, Button, Input, Skeleton } from '@learnova/ui';
import { Bell, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/lib/i18n/routing';
import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationCount,
} from '../hooks/use-notification-queries';

export function NotificationCenter() {
  const t = useTranslations('dashboard.notifications');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const unreadQuery = useUnreadNotificationCount();
  const listQuery = useNotificationsQuery({ q: search || undefined });
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  const unread = unreadQuery.data?.unreadCount ?? 0;
  const items = listQuery.data?.items ?? [];

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={t('title')}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        <Bell />
        {unread > 0 ? (
          <Badge
            variant="danger"
            className="absolute right-1 top-1 min-w-[1rem] px-1 text-[10px]"
          >
            {unread > 9 ? '9+' : unread}
          </Badge>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(100vw-1.5rem,24rem)] overflow-hidden rounded-xl border border-border bg-popover shadow-soft-md">
          <div className="border-b border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{t('title')}</p>
              <Button
                size="sm"
                variant="ghost"
                disabled={markAllMutation.isPending || unread === 0}
                onClick={() => {
                  void markAllMutation.mutateAsync();
                }}
              >
                {t('markAllRead')}
              </Button>
            </div>
            <Input
              className="mt-2"
              placeholder={t('search')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {listQuery.isLoading ? (
              <div className="space-y-2 p-3">
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
              </div>
            ) : items.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{t('empty')}</p>
            ) : (
              items.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className={`border-b border-border/60 px-3 py-3 text-sm last:border-0 ${item.read ? '' : 'bg-primary/5'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {!item.read ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
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
                        className="h-7 w-7 p-0"
                        aria-label={t('delete')}
                        onClick={() => {
                          void deleteMutation.mutateAsync(item.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border p-2">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link
                href={APP_ROUTES.NOTIFICATIONS}
                onClick={() => {
                  setOpen(false);
                }}
              >
                {t('viewAll')}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
