import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 px-4 py-8 sm:px-6">
      <section className="w-full space-y-6 rounded-[20px] border border-campus-border bg-campus-card p-5 shadow-premium sm:p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-campus-green">Account access</p>
          <h1 className="text-3xl font-black tracking-tight">Forgot your password?</h1>
          <p className="text-sm leading-6 text-campus-muted">
            Enter the email address you use for DormDrop. We’ll send you a link to reset your password.
          </p>
        </div>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
