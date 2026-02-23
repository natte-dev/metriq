"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { HybridSelect } from "@/components/shared/HybridSelect";
import { toast } from "@/hooks/use-toast";
import { createErro, updateErro, deleteErro } from "@/server/actions/erros";
import { Plus, Pencil, Trash2, Loader2, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Dept = { id: number; name: string };
type MonthItem = { id: number; value: string };
type TipoErro = { id: number; name: string; penalty_points: number };
type Responsavel = { id: number; nome: string; setor: string | null };
type Cliente = { id: number; nome: string; empresa: string | null };

interface ErroRecord {
  id: number;
  department: Dept;
  month: string;
  responsavel_id: number | null;
  responsavel_text: string | null;
  responsavel: string | null;
  cliente_id: number | null;
  cliente_text: string | null;
  cliente: string | null;
  data: Date | null;
  tipo_erro: TipoErro;
  penalty_points_override: number | null;
  descricao: string | null;
}

interface Props {
  data: {
    records: ErroRecord[];
    total: number;
    page: number;
    limit: number;
  };
  departments: Dept[];
  months: MonthItem[];
  tipoErros: TipoErro[];
  responsaveis: Responsavel[];
  clientes: Cliente[];
  filters: {
    month?: string;
    department_id?: number;
    page: number;
    limit: number;
  };
}

const emptyForm = {
  department_id: "",
  month: "",
  responsavel_id: null as number | null,
  responsavel_text: "",
  cliente_id: null as number | null,
  cliente_text: "",
  data: "",
  tipo_erro_id: "",
  penalty_points_override: "",
  descricao: "",
};

export function ErrosClientPage({
  data,
  departments,
  months,
  tipoErros,
  responsaveis,
  clientes,
  filters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm, month: filters.month ?? "" });
    setDialogOpen(true);
  }

  function openEdit(e: ErroRecord) {
    setEditId(e.id);
    setForm({
      department_id: String(e.department.id),
      month: e.month,
      responsavel_id: e.responsavel_id,
      responsavel_text: e.responsavel_text ?? e.responsavel ?? "",
      cliente_id: e.cliente_id,
      cliente_text: e.cliente_text ?? e.cliente ?? "",
      data: e.data ? new Date(e.data).toISOString().slice(0, 10) : "",
      tipo_erro_id: String(e.tipo_erro.id),
      penalty_points_override:
        e.penalty_points_override != null
          ? String(e.penalty_points_override)
          : "",
      descricao: e.descricao ?? "",
    });
    setDialogOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      const payload = {
        ...form,
        department_id: Number(form.department_id),
        tipo_erro_id: Number(form.tipo_erro_id),
        responsavel_id: form.responsavel_id ?? null,
        responsavel_text: form.responsavel_text || null,
        cliente_id: form.cliente_id ?? null,
        cliente_text: form.cliente_text || null,
        data: form.data || null,
        penalty_points_override: form.penalty_points_override
          ? Number(form.penalty_points_override)
          : null,
        descricao: form.descricao || null,
        ...(editId ? { id: editId } : {}),
      };
      const result = editId
        ? await updateErro(payload)
        : await createErro(payload);
      if (result.success) {
        toast({ title: editId ? "Erro atualizado!" : "Erro criado!" });
        setDialogOpen(false);
        router.refresh();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  }

  async function handleDelete() {
    if (deleteId === null) return;
    const result = await deleteErro(deleteId);
    if (result.success) {
      toast({ title: "Registro excluido!" });
      router.refresh();
    } else {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
    }
  }

  const responsaveisOptions = responsaveis.map((r) => ({
    id: r.id,
    label: r.setor ? `${r.nome} (${r.setor})` : r.nome,
  }));

  const clientesOptions = clientes.map((c) => ({
    id: c.id,
    label: c.empresa ? `${c.nome} - ${c.empresa}` : c.nome,
  }));
  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-md border p-4">
        <Filter className="h-4 w-4 text-muted-foreground mt-5" />
        <div className="space-y-1">
          <Label className="text-xs">Mes</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={filters.month ?? ""}
            onChange={(e) => setFilter("month", e.target.value)}
          >
            <option value="">Todos</option>
            {months.map((m) => (
              <option key={m.id} value={m.value}>
                {m.value}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Departamento</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={filters.department_id ?? ""}
            onChange={(e) => setFilter("department_id", e.target.value)}
          >
            <option value="">Todos</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={openCreate} className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Erro
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Departamento</th>
              <th className="px-3 py-2 text-left font-medium">Mes</th>
              <th className="px-3 py-2 text-left font-medium">Tipo</th>
              <th className="px-3 py-2 text-left font-medium">Cliente</th>
              <th className="px-3 py-2 text-left font-medium">Responsavel</th>
              <th className="px-3 py-2 text-left font-medium">Data</th>
              <th className="px-3 py-2 text-center font-medium">Penalidade</th>
              <th className="px-3 py-2 text-right font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {data.records.map((e) => {
              const clienteLabel = e.cliente_id
                ? (clientes.find((c) => c.id === e.cliente_id)?.nome ?? e.cliente_text ?? e.cliente ?? "-")
                : (e.cliente_text || e.cliente || "-");
              const responsavelLabel = e.responsavel_id
                ? (responsaveis.find((r) => r.id === e.responsavel_id)?.nome ?? e.responsavel_text ?? e.responsavel ?? "-")
                : (e.responsavel_text || e.responsavel || "-");
              const penalidade =
                e.penalty_points_override != null
                  ? e.penalty_points_override
                  : e.tipo_erro.penalty_points;
              return (
                <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">{e.department.name}</td>
                  <td className="px-3 py-2">{e.month}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs">
                      {e.tipo_erro.name}
                    </span>
                  </td>
                  <td className="px-3 py-2">{clienteLabel}</td>
                  <td className="px-3 py-2">{responsavelLabel}</td>
                  <td className="px-3 py-2">{formatDate(e.data)}</td>
                  <td className="px-3 py-2 text-center font-semibold">
                    -{penalidade} pts
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(e)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteId(e.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {data.records.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                  Nenhum erro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        total={data.total}
        page={data.page}
        limit={data.limit}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Erro" : "Novo Erro"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Departamento *</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.department_id}
                onChange={(e) =>
                  setForm({ ...form, department_id: e.target.value })
                }
              >
                <option value="">Selecione...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Mes *</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
              >
                <option value="">Selecione...</option>
                {months.map((m) => (
                  <option key={m.id} value={m.value}>
                    {m.value}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Tipo de Erro *</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.tipo_erro_id}
                onChange={(e) =>
                  setForm({ ...form, tipo_erro_id: e.target.value })
                }
              >
                <option value="">Selecione...</option>
                {tipoErros.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.penalty_points} pts)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Responsavel</Label>
              <HybridSelect
                options={responsaveisOptions}
                selectedId={form.responsavel_id}
                textValue={form.responsavel_text}
                onSelectId={(id) => setForm({ ...form, responsavel_id: id })}
                onTextChange={(t) =>
                  setForm({ ...form, responsavel_text: t })
                }
                placeholder="Nome do responsavel..."
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Cliente</Label>
              <HybridSelect
                options={clientesOptions}
                selectedId={form.cliente_id}
                textValue={form.cliente_text}
                onSelectId={(id) => setForm({ ...form, cliente_id: id })}
                onTextChange={(t) => setForm({ ...form, cliente_text: t })}
                placeholder="Nome do cliente..."
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>
                Penalidade Override{" "}
                <span className="text-muted-foreground text-xs">
                  (deixe vazio para usar o padrao do tipo)
                </span>
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="Pontos customizados..."
                value={form.penalty_points_override}
                onChange={(e) =>
                  setForm({ ...form, penalty_points_override: e.target.value })
                }
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Descricao</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        description="Deseja excluir este registro de erro?"
      />
    </>
  );
}