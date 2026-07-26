import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export default async function RootPage() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (await verifySessionToken(token)) {
    redirect("/dashboard");
  }
  redirect("/login");
}
