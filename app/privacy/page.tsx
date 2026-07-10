export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-campus-muted">Effective July 10, 2026</p>
      <div className="mt-6 space-y-5 text-sm leading-7 text-campus-muted">
        <p>DormDrop collects account information, listing content, messages, saved listings, reports, and basic technical information needed to operate and protect the service.</p>
        <p>Listing details and photos may be visible to other visitors. Messages and saved listings are limited to authorized accounts through database access controls. Do not post sensitive personal information.</p>
        <p>Information is used to provide accounts, display listings, enable communication, prevent abuse, investigate reports, and improve reliability. DormDrop does not sell personal information.</p>
        <p>DormDrop uses Supabase for authentication, database, and file storage, and Vercel for hosting. These providers process data to deliver the service.</p>
        <p>You may delete listings through your profile. Account deletion and privacy requests should be sent to the support contact published by DormDrop before public launch.</p>
      </div>
    </main>
  );
}
