'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
} from '@learnova/ui';
import { Building2 } from 'lucide-react';
import { type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import {
  registerInstitutionFormSchema,
  type RegisterInstitutionFormValues,
  useRegisterInstitutionMutation,
} from '@/features/auth';
import { ApiClientError } from '@/lib/api/client';
import { isSaasModeEnabled } from '@/lib/saas';
import { Link, useRouter } from '@/lib/i18n/routing';

export default function RegisterInstitutionPage() {
  const router = useRouter();
  const saasMode = isSaasModeEnabled();
  const registerMutation = useRegisterInstitutionMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterInstitutionFormValues>({
    resolver: zodResolver(registerInstitutionFormSchema),
    defaultValues: {
      institutionName: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  if (!saasMode) {
    return (
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Registration unavailable</CardTitle>
            <CardDescription>
              Institution self-registration is disabled for this deployment. Contact your Learnova
              operator.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/login">Institution Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      try {
        await registerMutation.mutateAsync({
          institutionName: values.institutionName,
          email: values.adminEmail,
          password: values.password,
          firstName: values.adminFirstName,
          lastName: values.adminLastName,
        });
        router.replace('/login?registered=1');
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : 'Unable to register institution. Try again.';
        setError('root', { message });
      }
    })(event);
  };

  const field = (
    name: keyof RegisterInstitutionFormValues,
    label: string,
    opts?: { type?: string; autoComplete?: string; placeholder?: string },
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={name}
        type={opts?.type ?? 'text'}
        autoComplete={opts?.autoComplete}
        placeholder={opts?.placeholder}
        disabled={registerMutation.isPending}
        {...register(name)}
      />
      {errors[name] ? (
        <p className="text-xs text-danger">{String(errors[name]?.message ?? '')}</p>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Register your institution
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Create the Institution Admin account. After email verification, sign in to finish setup —
          logo, contact details, and branding.
        </p>
      </div>

      <Card className="border-border/80 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="text-lg">Create admin account</CardTitle>
          <CardDescription>
            Students and faculty are invited by your administrators — there is no public signup.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit} noValidate>
          <CardContent className="space-y-4">
            {errors.root?.message ? (
              <p
                role="alert"
                className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {errors.root.message}
              </p>
            ) : null}

            {field('institutionName', 'Institution name', {
              placeholder: 'Northbridge University',
            })}
            <div className="grid gap-4 sm:grid-cols-2">
              {field('adminFirstName', 'Admin first name', { autoComplete: 'given-name' })}
              {field('adminLastName', 'Admin last name', { autoComplete: 'family-name' })}
            </div>
            {field('adminEmail', 'Admin email', {
              type: 'email',
              autoComplete: 'email',
              placeholder: 'shuklamanya99@gmail.com',
            })}
            {field('password', 'Password', {
              type: 'password',
              autoComplete: 'new-password',
            })}
            {field('confirmPassword', 'Confirm password', {
              type: 'password',
              autoComplete: 'new-password',
            })}
            <p className="text-xs text-muted-foreground">
              Password must be 12+ characters with upper, lower, number, and special character.
            </p>

            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-input"
                disabled={registerMutation.isPending}
                {...register('acceptTerms')}
              />
              <span>
                I accept the{' '}
                <Link href="/terms" className="font-medium text-foreground underline-offset-2 hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-medium text-foreground underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.acceptTerms ? (
              <p className="text-xs text-danger">{errors.acceptTerms.message}</p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" size="lg" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  Creating account…
                </>
              ) : (
                'Continue'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already registered?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Institution Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
