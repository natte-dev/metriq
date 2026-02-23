import {
  listDepartments,
  listMonths,
} from "@/server/actions/listas";
import { listCronograma } from "@/server/actions/cronograma";
import { listResponsaveis } from "@/server/actions/responsaveis";
import { listClientes } from "@/server/actions/clientes";
import { CronogramaClientPage } from "@/components/cronograma/CronogramaClientPage";
import { cookies } from "next/headers";

export default async function CronogramaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const role = (cookieStore.get("role")?.value ?? "manager") as "manager" | "coord";
  const coordDeptId = cookieStore.get("coord_department_id")?.value
    ? Number(cookieStore.get("coord_department_id")!.value)
    : null;

  const months = await listMonths();
  const currentMonth =
    sp.month ?? (months[0]?.value ?? new Date().toISOString().slice(0, 7));

  // For coord: only fetch their department
  let departments = await listDepartments();
  if (role === "coord" && coordDeptId) {
    departments = departments.filter((d) => d.id === coordDeptId);
  }

  const [records, responsaveis, clientes] = await Promise.all([
    listCronograma({
      month: currentMonth,
      ...(role === "coord" && coordDeptId ? { department_id: coordDeptId } : {}),
    }),
    listResponsaveis(true),
    listClientes(true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cronograma</h1>
        <p className="text-muted-foreground">
          Planeje as visitas por departamento e semana.
        </p>
      </div>
      <CronogramaClientPage
        records={records}
        departments={departments}
        months={months}
        responsaveis={responsaveis}
        clientes={clientes}
        currentMonth={currentMonth}
        role={role}
        coordDeptId={coordDeptId}
      />
    </div>
  );
}