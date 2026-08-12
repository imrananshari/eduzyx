import { CodeSettingsManager } from "@/components/codes/CodeSettingsManager";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { dbToAppRole } from "@/lib/auth/roles";

export default async function CodeSettingsPage() {
  const user = await getCurrentUserContext();
  const role = user ? dbToAppRole[user.role] ?? "admin" : "admin";
  return <CodeSettingsManager role={role} />;
}
