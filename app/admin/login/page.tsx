import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { adminRequestCode, adminVerifyCode } from "@/lib/admin/actions";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sent = sp.sent === "1";
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-2/50 p-4">
      <div className="card w-full max-w-sm p-7">
        <Logo />
        <h1 className="mt-6 text-xl font-semibold">Admin sign in</h1>
        {!sent ? (
          <form action={adminRequestCode} className="mt-5 space-y-4">
            <label className="block">
              <span className="field-label">Email</span>
              <input name="email" type="email" required autoComplete="email" className="field" />
            </label>
            <button className="btn-primary w-full">Email me a code</button>
          </form>
        ) : (
          <form action={adminVerifyCode} className="mt-5 space-y-4">
            <p className="text-sm text-muted">If {sp.email ?? "that address"} is an admin, a six-digit code is on its way. It expires in 10 minutes.</p>
            {sp.error && <p className="rounded-lg bg-danger/10 p-2 text-sm text-danger">That code didn&apos;t work. Check it or request a new one.</p>}
            <input type="hidden" name="email" value={sp.email ?? ""} />
            <label className="block">
              <span className="field-label">Code</span>
              <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" className="field text-center text-2xl tracking-[0.4em]" />
            </label>
            <button className="btn-primary w-full">Sign in</button>
            <a href="/admin/login" className="block text-center text-sm text-brand underline">Use a different email</a>
          </form>
        )}
      </div>
    </div>
  );
}
