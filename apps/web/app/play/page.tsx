import Link from "next/link";

import { loadStonepassWorld, WorldPlayScreen } from "@/features/world-play";

export default function PlayPage() {
  const worldResult = loadStonepassWorld();

  if (!worldResult.ok || !worldResult.world) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-semibold">Could not load Stonepass Spire — Floor 1</h1>
        <ul className="max-w-lg list-inside list-disc text-sm text-red-700 dark:text-red-300">
          {worldResult.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
        <Link href="/" className="text-sm text-neutral-600 underline dark:text-neutral-400">
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="mb-8 w-full max-w-2xl">
        <Link
          href="/"
          className="text-sm text-neutral-500 transition hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          ← Playable Worlds Lab
        </Link>
      </div>
      <WorldPlayScreen world={worldResult.world} />
    </main>
  );
}
