"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { api, parseFieldErrors, FieldErrors } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

export function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError("");
    setFieldErrors({});

    if (password.length < 8) {
      setFieldErrors({ password: "Password must be at least 8 characters" });
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setLoading(true);

    try {
      await api.register(email, password);
      router.push(callbackUrl);
    } catch (err) {
      const message = (err as Error).message;
      const { banner, fields } = parseFieldErrors(message);
      setBannerError(banner);
      setFieldErrors(fields);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup>
        {/* Header */}
        <div className="mb-2 text-center">
          <h1 className="font-display text-3xl font-medium text-[var(--foreground)]">
            Create an account
          </h1>
          <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
            Enter your email below to get started
          </p>
        </div>

        {bannerError && (
          <Alert variant="destructive">
            <AlertDescription>{bannerError}</AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
            }}
            required
            placeholder="you@example.com"
            autoComplete="email"
            spellCheck={false}
            className={fieldErrors.email ? "border-destructive" : ""}
          />
          {fieldErrors.email && (
            <p className="text-sm text-destructive">{fieldErrors.email}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
              }}
              required
              minLength={8}
              placeholder="Min 8 characters"
              autoComplete="new-password"
              className={`pr-10 ${fieldErrors.password ? "border-destructive" : ""}`}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-sm text-destructive">{fieldErrors.password}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: "" });
              }}
              required
              minLength={8}
              placeholder="Confirm your password"
              autoComplete="new-password"
              className={`pr-10 ${fieldErrors.confirmPassword ? "border-destructive" : ""}`}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
          )}
        </Field>

        <Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
            {loading ? "Creating account..." : "Create Account"}
          </Button>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-[var(--primary)] underline underline-offset-4 transition-colors hover:text-[var(--primary)]/80"
            >
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
