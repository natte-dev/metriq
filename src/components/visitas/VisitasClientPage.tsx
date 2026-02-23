"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { HybridSelect } from "@/components/shared/HybridSelect";
import { toast } from "@/hooks/use-toast";
import { createVisita, updateVisita, deleteVisita, updateVisitaStatus } from "@/server/actions/visitas";
import { Plus, Pencil, Trash2, Loader2, Filter, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Dept = { id: number; name: string };
type MonthItem = { id: number; value: string };
type Status = { id: number; name: string };
type Semana = { id: number; number: number };
type Responsavel = { id: number; nome: string; setor: string | null };
type Cliente = { id: number; nome: string; empresa: string | null };

interface VisitaRecord {
  id: number;
  department: Dept;
  month: string;
  semana: Semana;
  status: Status;
  responsavel_id: number | null;
  responsavel_text: string | null;
  responsavel_nome: string | null;
  responsavel_setor: string | null;
  responsavel_tempo: string | null;
  cliente_id: number | null;
  cliente_text: string | null;
  cliente: string | null;
  data_agendada: Date | null;
  data_realizada: Date | null;
  ata_anexada: boolean;
  pendencias_criadas: boolean;
  pendencias_prazo: boolean;
  observacoes: string | null;
  generated_from_cronograma_id: number | null;
}
interface Props {
  visitasData: {
    records: VisitaRecord[];
    total: number;
    page: number;
    limit: number;
  };
  departments: Dept[];
  months: MonthItem[];
  statusVisita: Status[];
  semanas: Semana[];
  responsaveis: Responsavel[];
  clientes: Cliente[];
  filters: {
    month?: string;
    department_id?: number;
    status_id?: number;
    page: number;
    limit: number;
  };
  role: "manager" | "coord";
  coordDeptId?: number | null;
}

const emptyForm = {
  department_id: "",
  month: "",
  week_id: "",
  status_id: "",
  responsavel_id: null as number | null,
  responsavel_text: "",
  responsavel_nome: "",
  responsavel_setor: "",
  responsavel_tempo: "",
  cliente_id: null as number | null,
  cliente_text: "",
  cliente: "",
  data_agendada: "",
  data_realizada: "",
  ata_anexada: false,
  pendencias_criadas: false,
  pendencias_prazo: false,
  observacoes: "",
};

export function VisitasClientPage({
  visitasData,
  departments,
  months,
  statusVisita,
  semanas,
  responsaveis,
  clientes,
  filters,
  role,
  coordDeptId,
}: Props) {
  const isCoord = role === "coord";
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

  function openEdit(v: VisitaRecord) {
    setEditId(v.id);
    setForm({
      department_id: String(v.department.id),
      month: v.month,
      week_id: String(v.semana.id),
      status_id: String(v.status.id),
      responsavel_id: v.responsavel_id,
      responsavel_text: v.responsavel_text ?? "",
      responsavel_nome: v.responsavel_nome ?? "",
      responsavel_setor: v.responsavel_setor ?? "",
      responsavel_tempo: v.responsavel_tempo ?? "",
      cliente_id: v.cliente_id,
      cliente_text: v.cliente_text ?? "",
      cliente: v.cliente ?? "",
      data_agendada: v.data_agendada ? new Date(v.data_agendada).toISOString().slice(0, 10) : "",
      data_realizada: v.data_realizada ? new Date(v.data_realizada).toISOString().slice(0, 10) : "",
      ata_anexada: v.ata_anexada,
      pendencias_criadas: v.pendencias_criadas,
      pendencias_prazo: v.pendencias_prazo,
      observacoes: v.observacoes ?? "",
    });
    setDialogOpen(true);
  }
  function handleSave() {
    startTransition(async () => {
      const data = {
        ...form,
        department_id: Number(form.department_id),
        week_id: Number(form.week_id),
        status_id: Number(form.status_id),
        responsavel_id: form.responsavel_id ?? null,
        responsavel_text: form.responsavel_text || null,
        cliente_id: form.cliente_id ?? null,
        cliente_text: form.cliente_text || null,
        data_agendada: form.data_agendada || null,
        data_realizada: form.data_realizada || null,
        observacoes: form.observacoes || null,
        responsavel_nome: form.responsavel_nome || null,
        responsavel_setor: form.responsavel_setor || null,
        responsavel_tempo: form.responsavel_tempo || null,
        cliente: form.cliente || null,
        ...(editId ? { id: editId } : {}),
      };
      const result = editId ? await updateVisita(data) : await createVisita(data);
      if (result.success) {
        toast({ title: editId ? "Visita atualizada!" : "Visita criada!" });
        setDialogOpen(false);
        router.refresh();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  }

  async function handleDelete() {
    if (deleteId === null) return;
    const result = await deleteVisita(deleteId);
    if (result.success) {
      toast({ title: "Visita excluida!" });
      router.refresh();
    } else {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
    }
  }

  function handleQuickStatus(visitaId: number, statusName: "Concluida" | "Cancelada") {
    startTransition(async () => {
      const statusObj = statusVisita.find((s) => s.name === statusName);
      if (!statusObj) { toast({ title: "Status nao encontrado", variant: "destructive" }); return; }
      const result = await updateVisitaStatus({ id: visitaId, status_id: statusObj.id });
      if (result.success) {
        toast({ title: `Visita marcada como ${statusName}!` });
        router.refresh();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
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
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={filters.month ?? ""} onChange={(e) => setFilter("month", e.target.value)}>
            <option value="">Todos</option>
            {months.map((m) => (<option key={m.id} value={m.value}>{m.value}</option>))}
          </select>
        </div>
        {!isCoord && (
          <div className="space-y-1">
            <Label className="text-xs">Departamento</Label>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={filters.department_id ?? ""} onChange={(e) => setFilter("department_id", e.target.value)}>
              <option value="">Todos</option>
              {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={filters.status_id ?? ""} onChange={(e) => setFilter("status_id", e.target.value)}>
            <option value="">Todos</option>
            {statusVisita.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </div>
        {role === "manager" && (
          <Button onClick={openCreate} className="ml-auto"><Plus className="mr-2 h-4 w-4" />Nova Visita</Button>
        )}
      </div>
      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Departamento</th>
              <th className="px-3 py-2 text-left font-medium">Mes</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Cliente</th>
              <th className="px-3 py-2 text-left font-medium">Responsavel</th>
              <th className="px-3 py-2 text-left font-medium">Agendada</th>
              <th className="px-3 py-2 text-left font-medium">Realizada</th>
              <th className="px-3 py-2 text-left font-medium">Ata</th>
              <th className="px-3 py-2 text-right font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {visitasData.records.map((v) => {
              const clienteLabel = v.cliente_id && clientes.find((c) => c.id === v.cliente_id)?.nome
                ? clientes.find((c) => c.id === v.cliente_id)!.nome
                : v.cliente_text || v.cliente || "-";
              const responsavelLabel = v.responsavel_id && responsaveis.find((r) => r.id === v.responsavel_id)?.nome
                ? responsaveis.find((r) => r.id === v.responsavel_id)!.nome
                : v.responsavel_text || v.responsavel_nome || "-";
              return (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">{v.department.name}</td>
                  <td className="px-3 py-2">{v.month}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${v.status.name === "Concluida" || v.status.name === "Concluída" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : v.status.name === "Pendente" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>
                      {v.status.name}
                    </span>
                  </td>
                  <td className="px-3 py-2">{clienteLabel}</td>
                  <td className="px-3 py-2">{responsavelLabel}</td>
                  <td className="px-3 py-2">{formatDate(v.data_agendada)}</td>
                  <td className="px-3 py-2">{formatDate(v.data_realizada)}</td>
                  <td className="px-3 py-2">{v.ata_anexada ? "Sim" : "Nao"}</td>
                  <td className="px-3 py-2 text-right">
                    {role === "manager" ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(v.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-green-700 hover:text-green-800 hover:bg-green-50" disabled={isPending || v.status.name === "Concluida" || v.status.name === "Concluída"} onClick={() => handleQuickStatus(v.id, "Concluida")}><CheckCircle2 className="mr-1 h-3 w-3" />Concluida</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-700 hover:text-red-800 hover:bg-red-50" disabled={isPending || v.status.name === "Cancelada"} onClick={() => handleQuickStatus(v.id, "Cancelada")}><XCircle className="mr-1 h-3 w-3" />Cancelada</Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {visitasData.records.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">Nenhuma visita encontrada com os filtros aplicados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls total={visitasData.total} page={visitasData.page} limit={visitasData.limit} />

      {/* Form Dialog - Manager only */}
      {role === "manager" && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Visita" : "Nova Visita"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Departamento *</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Mes *</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                  <option value="">Selecione...</option>
                  {months.map((m) => (<option key={m.id} value={m.value}>{m.value}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Semana *</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={form.week_id} onChange={(e) => setForm({ ...form, week_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {semanas.map((s) => (<option key={s.id} value={s.id}>Semana {s.number}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Status *</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={form.status_id} onChange={(e) => setForm({ ...form, status_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {statusVisita.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Responsavel</Label>
                <HybridSelect options={responsaveisOptions} selectedId={form.responsavel_id} textValue={form.responsavel_text} onSelectId={(id) => setForm({ ...form, responsavel_id: id })} onTextChange={(t) => setForm({ ...form, responsavel_text: t })} placeholder="Nome do responsavel..." />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Cliente</Label>
                <HybridSelect options={clientesOptions} selectedId={form.cliente_id} textValue={form.cliente_text} onSelectId={(id) => setForm({ ...form, cliente_id: id })} onTextChange={(t) => setForm({ ...form, cliente_text: t })} placeholder="Nome do cliente..." />
              </div>
              <div className="space-y-1">
                <Label>Data Agendada</Label>
                <Input type="date" value={form.data_agendada} onChange={(e) => setForm({ ...form, data_agendada: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Data Realizada</Label>
                <Input type="date" value={form.data_realizada} onChange={(e) => setForm({ ...form, data_realizada: e.target.value })} />
              </div>
              <div className="col-span-2 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.ata_anexada} onCheckedChange={(c) => setForm({ ...form, ata_anexada: Boolean(c) })} /><span className="text-sm">Ata Anexada</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.pendencias_criadas} onCheckedChange={(c) => setForm({ ...form, pendencias_criadas: Boolean(c) })} /><span className="text-sm">Pendencias Criadas</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.pendencias_prazo} onCheckedChange={(c) => setForm({ ...form, pendencias_prazo: Boolean(c) })} /><span className="text-sm">Pendencias no Prazo</span></label>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Observacoes</Label>
                <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isPending}>{isPending && (<Loader2 className="mr-2 h-4 w-4 animate-spin" />)}Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <DeleteConfirmDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)} onConfirm={handleDelete} description="Deseja excluir esta visita?" />
    </>
  );
}