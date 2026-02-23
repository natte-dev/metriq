import { getAppParams } from "@/server/actions/parametros";
import { AppParamsForm } from "@/components/parametros/AppParamsForm";

export default async function ParametrosPage() {
  const params = await getAppParams();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Parametros</h1>
        <p className="text-muted-foreground">
          Configure metas, pesos e bonus do sistema.
        </p>
      </div>

      <div className="max-w-2xl">
        <h2 className="mb-4 text-xl font-semibold">Configuracoes Gerais</h2>
        <AppParamsForm initialData={params} />
      </div>
    </div>
  );
}
