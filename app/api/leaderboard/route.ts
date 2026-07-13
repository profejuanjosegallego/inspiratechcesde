import { getDb } from "@/lib/mongodb";
import { handler, json, requireUser } from "@/lib/api";
import { computeLeaderboard } from "@/lib/leaderboard";

export const GET = handler(async () => {
  await requireUser();
  const db = await getDb();
  const ranking = await computeLeaderboard(db);
  return json({ ranking });
});
