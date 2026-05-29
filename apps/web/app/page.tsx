import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Playable Worlds Lab</h1>
      <p className="max-w-md text-center text-neutral-600 dark:text-neutral-400">
        Schema-first, text-first AI-directed world engine. Climb **Stonepass Spire — Floor 1** in
        the browser — choices update remembered world state through the deterministic runtime.
      </p>
      <Link
        href="/play"
        className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        Play Stonepass Spire — Floor 1
      </Link>
      <p className="text-sm text-neutral-500">
        AI proposes. Validators check. The game engine executes.
      </p>
    </main>
  );
}
