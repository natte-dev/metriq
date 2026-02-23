import { listDepartments } from "@/server/actions/listas";
import { EntrarClientPage } from "@/components/auth/EntrarClientPage";

export default async function EntrarPage() {
  const departments = await listDepartments();
  return <EntrarClientPage departments={departments} />;
}
