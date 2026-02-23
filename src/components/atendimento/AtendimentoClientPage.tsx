"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  createAtendimento,
  updateAtendimento,
  deleteAtendimento,
} from "@/server/actions/atendimentos";
import { Plus, Pencil, Trash2, Loader2, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Dept = { id: number; name: string };
type MonthItem = { id: number; value: string };
type Nota = { id: number; value: number };
type Responsavel = { id: number; nome: string; setor: string | null };
type Cliente = { id: number; nome: string; empresa: string | null };

interface AtendimentoRecord {
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
  nota: Nota;
  sla_prazo: boolean;
  comentario: string | null;
}

interface Props {
  data: {
    records: AtendimentoRecord[];
    total: number;
    page: number;
    limit: number;
  };
  departments: Dept[];
  months: MonthItem[];
  notas: Nota[];
  responsaveis: Responsavel[];
  clientes: Cliente[];
  stats: { total: number; mediaNote: number };
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
  nota_id: "",
  sla_prazo: true,
  comentario: "",
};

export function AtendimentoClientPage({
  data,
  departments,
  months,
  notas,
  responsaveis,
  clientes,
  stats,
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

  function openEdit(a: AtendimentoRecord) {
    setEditId(a.id);
    setForm({
      department_id: String(a.department.id),
      month: a.month,
      responsavel_id: a.responsavel_id,
      responsavel_text: a.responsavel_text ?? a.responsavel ?? "",
      cliente_id: a.cliente_id,
      cliente_text: a.cliente_text ?? a.cliente ?? "",
      data: a.data ? new Date(a.data).toISOString().slice(0, 10) : "",
      nota_id: String(a.nota.id),
      sla_prazo: a.sla_prazo,
      comentario: a.comentario ?? "",
    });
    setDialogOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      const payload = {
        ...form,
        department_id: Number(form.department_id),
        nota_id: Number(form.nota_id),
        responsavel_id: form.responsavel_id ?? null,
        responsavel_text: form.responsavel_text || null,
        cliente_id: form.cliente_id ?? null,
        cliente_text: form.cliente_text || null,
        data: form.data || null,
        comentario: form.comentario || null,
        ...(editId ? { id: editId } : {}),
      };
      const result = editId
        ? await updateAtendimento(payload)
        : await createAtendimento(payload);
      if (result.success) {
        toast({
          title: editId ? "Atendimento atualizado!" : "Atendimento criado!",
        });
        setDialogOpen(false);
        router.refresh();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  }

  async function handleDelete() {
    if (deleteId === null) return;
    const result = await deleteAtendimento(deleteId);
    if (result.success) {
      toast({ title: "Atendimento excluido!" });
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
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">Total no periodo</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">Nota media</p>
          <p className="text-2xl font-bold">
            {stats.mediaNote > 0 ? stats.mediaNote.toFixed(1) : "-"}
          </p>
        </div>
      </div>

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
          Novo Atendimento
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Departamento</th>
              <th className="px-3 py-2 text-left font-medium">Mes</th>
              <th className="px-3 py-2 text-left font-medium">Cliente</th>
              <th className="px-3 py-2 text-left font-medium">Responsavel</th>
              <th className="px-3 py-2 text-left font-medium">Data</th>
              <th className="px-3 py-2 text-center font-medium">Nota</th>
              <th className="px-3 py-2 text-center font-medium">SLA</th>
              <th className="px-3 py-2 text-right font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {data.records.map((a) => {
              const clienteLabel = a.cliente_id
                ? (clientes.find((c) => c.id === a.cliente_id)?.nome ?? a.cliente_text ?? a.cliente ?? "-")
                : (a.cliente_text || a.cliente || "-");
              const responsavelLabel = a.responsavel_id
                ? (responsaveis.find((r) => r.id === a.responsavel_id)?.nome ?? a.responsavel_text ?? a.responsavel ?? "-")
                : (a.responsavel_text || a.responsavel || "-");
              return (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">{a.department.name}</td>
                  <td className="px-3 py-2">{a.month}</td>
                  <td className="px-3 py-2">{clienteLabel}</td>
                  <td className="px-3 py-2">{responsavelLabel}</td>
                  <td className="px-3 py-2">{formatDate(a.data)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-semibold">{a.nota.value}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${a.sla_prazo
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}
                    >
                      {a.sla_prazo ? "OK" : "Atrasado"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(a)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteId(a.id)}
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
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  Nenhum atendimento encontrado.
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
            <DialogTitle>
              {editId ? "Editar Atendimento" : "Novo Atendimento"}
            </DialogTitle>
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
              <Label>Nota *</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.nota_id}
                onChange={(e) =>
                  setForm({ ...form, nota_id: e.target.value })
                }
              >
                <option value="">Selecione...</option>
                {notas.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.value}
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
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox
                checked={form.sla_prazo}
                onCheckedChange={(c) =>
                  setForm({ ...form, sla_prazo: Boolean(c) })
                }
              />
              <Label>SLA no prazo</Label>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Comentario</Label>
              <Textarea
                value={form.comentario}
                onChange={(e) =>
                  setForm({ ...form, comentario: e.target.value })
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
        description="Deseja excluir este atendimento?"
      />
    </>
  );
}
