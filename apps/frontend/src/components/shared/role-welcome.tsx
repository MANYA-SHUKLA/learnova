'use client';

import { Card, CardContent } from '@learnova/ui';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/auth-provider';

interface RoleWelcomeProps {
  roleLabel: string;
  title: string;
  modules: string[];
  preparingLine: string;
  modulesIntro: string;
  welcome: string;
  welcomeNamed: (name: string) => string;
  contactAdmin: string;
}

function displayName(firstName?: string | null, lastName?: string | null) {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

export function RoleWelcome({
  roleLabel,
  title,
  modules,
  preparingLine,
  modulesIntro,
  welcome,
  welcomeNamed,
  contactAdmin,
}: RoleWelcomeProps) {
  const { user } = useAuth();
  const name = displayName(user?.firstName, user?.lastName);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-sm font-medium text-primary">{roleLabel}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
      >
        <Card className="overflow-hidden border-border/80 shadow-soft-md">
          <div className="border-b border-border bg-hero px-6 py-6 sm:px-8">
            <p className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {name ? welcomeNamed(name) : welcome}
            </p>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{preparingLine}</p>
          </div>
          <CardContent className="space-y-6 px-6 py-6 sm:px-8">
            <p className="text-sm leading-relaxed text-muted-foreground">{modulesIntro}</p>
            <ul className="space-y-3">
              {modules.map((module, index) => (
                <motion.li
                  key={module}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 + index * 0.04 }}
                  className="flex items-center gap-3 text-sm font-medium text-foreground"
                >
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                  {module}
                </motion.li>
              ))}
            </ul>
            <p className="border-t border-border pt-5 text-sm text-muted-foreground">
              {contactAdmin}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
