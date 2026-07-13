import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Landing from "@/components/Landing";

export default async function Home() {
  const user = await getSession();
  if (user) redirect("/dashboard");
  return <Landing />;
}
