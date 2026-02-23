import { listDepartments, listMonths, listStatusVisita, listSemanas } from "@/server/actions/listas";
import { listVisitas } from "@/server/actions/visitas";
import { listResponsaveis } from "@/server/actions/responsaveis";
import { listClientes } from "@/server/actions/clientes";
import { VisitasClientPage } from "@/components/visitas/VisitasClientPage";
import { cookies } from "next/headers";

export default async function VisitasPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    department_id?: string;
    status_id?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const role = (cookieStore.get("role")?.value ?? "manager") as "manager" | "coord";
  const coordDeptId = cookieStore.get("coord_department_id")?.value
    ? Number(cookieStore.get("coord_department_id")!.value)
    : null;

  const filters = {
    month: sp.month,
    // Coord: always force their department
    department_id:
      role === "coord" && coordDeptId
        ? coordDeptId
        : sp.department_id
        ? parseInt(sp.department_id)
        : undefined,
    status_id: sp.status_id ? parseInt(sp.status_id) : undefined,
    page: sp.page ? parseInt(sp.page) : 1,
    limit: 20,
  };

  let allDepartments = await listDepartments();
  // Coord only sees their department in the filter dropdown
  const departmentsForFilter =
    role === "coord" && coordDeptId
      ? allDepartments.filter((d) => d.id === coordDeptId)
      : allDepartments;

  const [visitasData, months, statusVisita, semanas, responsaveis, clientes] =
    await Promise.all([
      listVisitas(filters),
      listMonths(),
      listStatusVisita(),
      listSemanas(),
      listResponsaveis(true),
      listClientes(true),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Visitas</h1>
        <p className="text-muted-foreground">Registre e acompanhe as visitas por departamento.</p>
      </div>
      <VisitasClientPage
        visitasData={visitasData}
        departments={departmentsForFilter}
        months={months}
        statusVisita={statusVisita}
        semanas={semanas}
        responsaveis={responsaveis}
        clientes={clientes}
        filters={filters}
        role={role}
        coordDeptId={coordDeptId}
      />
    </div>
  );
}