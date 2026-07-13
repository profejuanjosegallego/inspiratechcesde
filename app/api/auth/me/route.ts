import { getSession } from "@/lib/auth";
import { handler, json } from "@/lib/api";

export const GET = handler(async () => {
  const user = await getSession();
  return json({ user: user || null });
});
