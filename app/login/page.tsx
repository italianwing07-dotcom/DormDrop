import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 px-4 py-8 sm:px-6">
      <section className="w-full space-y-6 rounded-3xl border border-campus-ink/10 bg-white p-5 shadow-soft sm:p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-campus-green">Welcome to DormDrop</p>
          <h1 className="text-3xl font-bold tracking-tight">Log in or sign up</h1>
          <p className="text-sm leading-6 text-campus-ink/70">
            Use your email and password to access your DormDrop profile.
          </p>
        </div>

        <AuthForm />
      </section>
    </main>
  );
}
