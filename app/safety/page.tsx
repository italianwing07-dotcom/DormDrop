export default function SafetyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black tracking-tight">Marketplace safety</h1>
      <div className="mt-6 space-y-6 text-sm leading-7 text-campus-muted">
        <section><h2 className="text-lg font-bold text-campus-ink">Meet safely</h2><p>Meet in a busy, public campus location during daylight hours. Tell someone where you are going, and do not enter a stranger’s dorm room or vehicle.</p></section>
        <section><h2 className="text-lg font-bold text-campus-ink">Inspect before paying</h2><p>Check the item in person and confirm that it matches the listing before sending money. DormDrop does not hold payments, guarantee items, or provide buyer protection.</p></section>
        <section><h2 className="text-lg font-bold text-campus-ink">Protect your information</h2><p>Never share passwords, verification codes, banking credentials, government identification numbers, or unnecessary personal information.</p></section>
        <section><h2 className="text-lg font-bold text-campus-ink">Prohibited listings</h2><p>Do not list weapons, controlled substances, alcohol, nicotine products, counterfeit or stolen goods, recalled products, explicit content, animals, academic cheating services, or anything illegal or unsafe.</p></section>
        <section><h2 className="text-lg font-bold text-campus-ink">Report concerns</h2><p>Use the report button on a listing when something appears unsafe, deceptive, prohibited, or abusive. For an immediate emergency, contact campus security or local emergency services.</p></section>
      </div>
    </main>
  );
}
