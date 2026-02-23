"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { HybridSelect } from "@/components/shared/HybridSelect";
import { toast } from "@/hooks/use-toast";
import {
  createCronograma,
  updateCronograma,
  deleteCronograma,
} from "@/server/actions/cronograma";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatDate, formatMonth } from "@/lib/utils";

type Dept = { id: number; name: string };
type MonthItem = { id: number; value: string };
type Responsavel = { id: number; nome: string; setor: string | null };
type Cliente = { id: number; nome: string; empresa: string | null };

interface CronogramaRecord {
  id: number;
  month: string;
  department: Dept;
  week_num: number;
  cliente_id: number | null;
  cliente_text: string | null;
  data_agendada: Date | null;
  responsavel_id: number | null;
  responsavel_text: string | null;
  observacoes: string | null;
}

interface Props {
  records: CronogramaRecord[];
  departments: Dept[];
  months: MonthItem[];
  responsaveis: Responsavel[];
  clientes: Cliente[];
  currentMonth: string;
  role?: "manager" | "coord";
  coordDeptId?: number | null;
}

const WEEKS = [1, 2, 3, 4, 5];

const emptyForm = {
  department_id: "",
  month: "",
  week_num: 1,
  cliente_id: null as number | null,
  cliente_text: "",
  data_agendada: "",
  responsavel_id: null as number | null,
  responsavel_text: "",
  observacoes: "",
};

export function CronogramaClientPage({
  records,
  departments,
  months,
  responsaveis,
  clientes,
  currentMonth,
  role = "manager",
  coordDeptId,
}: Props) {
  const isCoord = role === "coord";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm, month: currentMonth });

  function changeMonth(month: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    router.push(`/cronograma?${params.toString()}`);
  }

  const recordMap = new Map<string, CronogramaRecord>();
  for (const r of records) {
    recordMap.set(`${r.department.id}-${r.week_num}`, r);
  }

  const responsaveisOptions = responsaveis.map((r) => ({
    id: r.id,
    label: r.setor ? `${r.nome} (${r.setor})` : r.nome,
  }));

  const clientesOptions = clientes.map((c) => ({
    id: c.id,
    label: c.empresa ? `${c.nome} - ${c.empresa}` : c.nome,
  }));

  function openCreate(deptId: number, weekNum: number) {
    setEditId(null);
    setForm({
      ...emptyForm,
      month: currentMonth,
      department_id: String(deptId),
      week_num: weekNum,
    });
    setDialogOpen(true);
  }

  function openEdit(r: CronogramaRecord) {
    setEditId(r.id);
    setForm({
      department_id: String(r.department.id),
      month: r.month,
      week_num: r.week_num,
      cliente_id: r.cliente_id,
      cliente_text: r.cliente_text ?? "",
      data_agendada: r.data_agendada
        ? new Date(r.data_agendada).toISOString().slice(0, 10)
        : "",
      responsavel_id: r.responsavel_id,
      responsavel_text: r.responsavel_text ?? "",
      observacoes: r.observacoes ?? "",
    });
    setDialogOpen(true);
  }

  function handleSave() {
    startTransition(async () => {
      const payload = {
        department_id: Number(form.department_id),
        month: form.month,
        week_num: Number(form.week_num),
        cliente_id: form.cliente_id ?? null,
        cliente_text: form.cliente_text || null,
        data_agendada: form.data_agendada || null,
        responsavel_id: form.responsavel_id ?? null,
        responsavel_text: form.responsavel_text || null,
        observacoes: form.observacoes || null,
        ...(editId ? { id: editId } : {}),
      };
      const result = editId
        ? await updateCronograma(payload)
        : await createCronograma(payload);
      if (result.success) {
        toast({ title: editId ? "Atualizado!" : "Criado!" });
        setDialogOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  async function handleDelete() {
    if (deleteId === null) return;
    const result = await deleteCronograma(deleteId);
    if (result.success) {
      toast({ title: "Excluido!" });
      router.refresh();
    } else {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
    }
  }

  function getDisplayLabel(rec: CronogramaRecord) {
    const clienteLabel = rec.cliente_id
      ? (clientes.find((c) => c.id === rec.cliente_id)?.nome ?? rec.cliente_text)
      : rec.cliente_text;
    const responsavelLabel = rec.responsavel_id
      ? (responsaveis.find((r) => r.id === rec.responsavel_id)?.nome ?? rec.responsavel_text)
      : rec.responsavel_text;
    return { clienteLabel, responsavelLabel };
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Mes</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={currentMonth}
            onChange={(e) => changeMonth(e.target.value)}
          >
            {months.map((m) => (
              <option key={m.id} value={m.value}>
                {m.value}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-5 text-muted-foreground text-sm">
          Cronograma de {formatMonth(currentMonth)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="border px-3 py-2 text-left font-medium w-32">
                Departamento
              </th>
              {WEEKS.map((w) => (
                <th
                  key={w}
                  className="border px-3 py-2 text-center font-medium"
                >
                  Semana {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-muted/20">
                <td className="border px-3 py-2 font-medium">{dept.name}</td>
                {WEEKS.map((w) => {
                  const rec = recordMap.get(`${dept.id}-${w}`);
                  if (rec) {
                    const { clienteLabel, responsavelLabel } = getDisplayLabel(rec);
                    return (
                      <td key={w} className="border px-2 py-2 min-w-[140px]">
                        <div className="space-y-1">
                          {clienteLabel && (
                            <p className="font-medium text-xs truncate">
                              {clienteLabel}
                            </p>
                          )}
                          {rec.data_agendada && (
                            <p className="text-xs text-muted-foreground">
                              {formatDate(rec.data_agendada)}
                            </p>
                          )}
                          {responsavelLabel && (
                            <p className="text-xs text-muted-foreground truncate">
                              {responsavelLabel}
                            </p>
                          )}
                          {!isCoord && (
                            <div className="flex gap-1 mt-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => openEdit(rec)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => setDeleteId(rec.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={w} className="border px-2 py-2 min-w-[140px]">
                      {!isCoord && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => openCreate(dept.id, w)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="border px-3 py-8 text-center text-muted-foreground"
                >
                  Nenhum departamento cadastrado. Va em Listas para adicionar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Editar Item" : "Novo Item no Cronograma"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Departamento</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  value={form.department_id}
                  disabled={isCoord}
                  onChange={(e) =>
                    setForm({ ...form, department_id: e.target.value })
                  }
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Semana</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.week_num}
                  onChange={(e) =>
                    setForm({ ...form, week_num: Number(e.target.value) })
                  }
                >
                  {WEEKS.map((w) => (
                    <option key={w} value={w}>
                      Semana {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
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
            <div className="space-y-1">
              <Label>Responsavel</Label>
              <HybridSelect
                options={responsaveisOptions}
                selectedId={form.responsavel_id}
                textValue={form.responsavel_text}
                onSelectId={(id) => setForm({ ...form, responsavel_id: id })}
                onTextChange={(t) => setForm({ ...form, responsavel_text: t })}
                placeholder="Nome do responsavel..."
              />
            </div>
            <div className="space-y-1">
              <Label>Data Agendada</Label>
              <Input
                type="date"
                value={form.data_agendada}
                onChange={(e) =>
                  setForm({ ...form, data_agendada: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Observacoes</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) =>
                  setForm({ ...form, observacoes: e.target.value })
                }
                rows={2}
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
        description="Deseja excluir este item do cronograma? A visita pendente gerada automaticamente tambem sera excluida."
      />
    </>
  );
}
