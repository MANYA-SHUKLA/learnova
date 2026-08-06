import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Auth route shell — UI placeholder only.
 * Login is NOT implemented.
 */
export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display">Sign in</CardTitle>
          <CardDescription>
            Authentication is prepared but not implemented. This route is a structural
            placeholder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AuthProvider, RoleProvider, JWT utilities, ProtectedRoute, and middleware
            gates are ready for implementation.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
