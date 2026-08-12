import { UsersManager } from "@/components/users/UsersManager";
import { getCurrentUserContext } from "@/lib/auth/currentUser";
import { dbToAppRole } from "@/lib/auth/roles";

export default async function UsersPage() {
  const user = await getCurrentUserContext();
  const role = user ? dbToAppRole[user.role] ?? "admin" : "admin";
  return <UsersManager role={role} />;
}
