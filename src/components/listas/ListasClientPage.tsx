"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, CalendarPlus, KeyRound, X } from "lucide-react";
import {
  createDepartment, updateDepartment, deleteDepartment,
  createMonth, deleteMonth, generateNextMonths,
  createStatusVisita, updateStatusVisita, deleteStatusVisita,
  createSemana, deleteSemana,
  createNota, deleteNota,
  createTipoErro, updateTipoErro, deleteTipoErro,
  setDepartmentPassword, removeDepartmentPassword,
} from "@/server/actions/listas";
import {
  createResponsavel, updateResponsavel, deleteResponsavel,
} from "@/server/actions/responsaveis";
import {
  createCliente, updateCliente, deleteCliente,
} from "@/server/actions/clientes";

type GenericItem = { id: number; name?: string; value?: string | number; number?: number; penalty_points?: number };
type ResponsavelItem = { id: number; nome: string; setor: string | null; is_active: boolean };
type ClienteItem = { id: number; nome: string; empresa: string | null; cnpj: string | null; telefone: string | null; is_active: boolean };
type DeptPasswordItem = { id: number; name: string; hasPassword: boolean; updatedAt: Date | null };

interface ListasClientPageProps {
  departments: { id: number; name: string }[];
  months: { id: number; value: string }[];
  statusVisita: { id: number; name: string }[];
  semanas: { id: number; number: number }[];
  notas: { id: number; value: number }[];
  tipoErro: { id: number; name: string; penalty_points: number }[];
  responsaveis: ResponsavelItem[];
  clientes: ClienteItem[];
  deptPasswords: DeptPasswordItem[];
}

function GenericList({
  title,
  items,
  displayKey,
  onAdd,
  onEdit,
  onDelete,
  canEdit = true,
}: {
  title: string;
  items: GenericItem[];
  displayKey: (item: GenericItem) => string;
  onAdd: () => void;
  onEdit?: (item: GenericItem) => void;
  onDelete: (id: number) => void;
  canEdit?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="mr-1 h-3 w-3" />
            Adicionar
          </Button>
        </div>
        <div className="rounded-md border divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm">{displayKey(item)}</span>
              <div className="flex gap-1">
                {canEdit && onEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(item.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">Nenhum item cadastrado.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
export function ListasClientPage({
  departments,
  months,
  statusVisita,
  semanas,
  notas,
  tipoErro,
  responsaveis,
  clientes,
  deptPasswords,
}: ListasClientPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deptPwInputs, setDeptPwInputs] = useState<Record<number, string>>({});

  const [dialog, setDialog] = useState<{
    open: boolean;
    type: string;
    editItem?: GenericItem | ResponsavelItem | ClienteItem | null;
    fields: Record<string, string | boolean>;
  }>({ open: false, type: "", editItem: null, fields: {} });

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; type: string } | null>(null);

  function openDialog(type: string, item?: GenericItem | ResponsavelItem | ClienteItem) {
    let fields: Record<string, string | boolean> = {};
    if (type === "department") fields = { name: (item as GenericItem)?.name ?? "" };
    else if (type === "month") fields = { value: "" };
    else if (type === "statusVisita") fields = { name: (item as GenericItem)?.name ?? "" };
    else if (type === "semana") fields = { number: "" };
    else if (type === "nota") fields = { value: "" };
    else if (type === "tipoErro") fields = { name: (item as GenericItem)?.name ?? "", penalty_points: String((item as GenericItem)?.penalty_points ?? "") };
    else if (type === "responsavel") {
      const r = item as ResponsavelItem | undefined;
      fields = { nome: r?.nome ?? "", setor: r?.setor ?? "", is_active: r?.is_active ?? true };
    } else if (type === "cliente") {
      const c = item as ClienteItem | undefined;
      fields = { nome: c?.nome ?? "", empresa: c?.empresa ?? "", cnpj: c?.cnpj ?? "", telefone: c?.telefone ?? "", is_active: c?.is_active ?? true };
    }
    setDialog({ open: true, type, editItem: item ?? null, fields });
  }

  function closeDialog() {
    setDialog({ open: false, type: "", editItem: null, fields: {} });
  }

  function setField(key: string, value: string | boolean) {
    setDialog((d) => ({ ...d, fields: { ...d.fields, [key]: value } }));
  }

  function handleSave() {
    startTransition(async () => {
      const { type, editItem, fields } = dialog;
      let result: { success: boolean; error?: string };

      if (type === "department") {
        result = editItem
          ? await updateDepartment(editItem.id, { name: fields.name as string })
          : await createDepartment({ name: fields.name as string });
      } else if (type === "month") {
        result = await createMonth({ value: fields.value as string });
      } else if (type === "statusVisita") {
        result = editItem
          ? await updateStatusVisita(editItem.id, { name: fields.name as string })
          : await createStatusVisita({ name: fields.name as string });
      } else if (type === "semana") {
        result = await createSemana({ number: Number(fields.number) });
      } else if (type === "nota") {
        result = await createNota({ value: Number(fields.value) });
      } else if (type === "tipoErro") {
        const data = { name: fields.name as string, penalty_points: Number(fields.penalty_points) };
        result = editItem ? await updateTipoErro(editItem.id, data) : await createTipoErro(data);
      } else if (type === "responsavel") {
        const data = { nome: fields.nome as string, setor: (fields.setor as string) || null, is_active: fields.is_active as boolean };
        result = editItem
          ? await updateResponsavel(editItem.id, data)
          : await createResponsavel(data);
      } else if (type === "cliente") {
        const data = {
          nome: fields.nome as string,
          empresa: (fields.empresa as string) || null,
          cnpj: (fields.cnpj as string) || null,
          telefone: (fields.telefone as string) || null,
          is_active: fields.is_active as boolean,
        };
        result = editItem
          ? await updateCliente(editItem.id, data)
          : await createCliente(data);
      } else {
        return;
      }

      if (result.success) {
        toast({ title: editItem ? "Atualizado!" : "Criado!" });
        closeDialog();
        router.refresh();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    let result: { success: boolean; error?: string };

    if (type === "department") result = await deleteDepartment(id);
    else if (type === "month") result = await deleteMonth(id);
    else if (type === "statusVisita") result = await deleteStatusVisita(id);
    else if (type === "semana") result = await deleteSemana(id);
    else if (type === "nota") result = await deleteNota(id);
    else if (type === "tipoErro") result = await deleteTipoErro(id);
    else if (type === "responsavel") result = await deleteResponsavel(id);
    else if (type === "cliente") result = await deleteCliente(id);
    else return;

    if (result.success) {
      toast({ title: "Excluido!" });
      router.refresh();
    } else {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
    }
    setDeleteConfirm(null);
  }

  const { type, editItem, fields } = dialog;
  return (
    <>
      <Tabs defaultValue="departments">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="months">Meses</TabsTrigger>
          <TabsTrigger value="responsaveis">Responsaveis</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="statusVisita">Status Visita</TabsTrigger>
          <TabsTrigger value="semanas">Semanas</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
          <TabsTrigger value="tipoErro">Tipos de Erro</TabsTrigger>
          <TabsTrigger value="senhas">Senhas Coord.</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-4">
          <GenericList
            title="Departamentos"
            items={departments}
            displayKey={(i) => i.name ?? ""}
            onAdd={() => openDialog("department")}
            onEdit={(i) => openDialog("department", i)}
            onDelete={(id) => setDeleteConfirm({ id, type: "department" })}
          />
        </TabsContent>

        <TabsContent value="months" className="mt-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-muted-foreground">Meses</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openDialog("month")}>
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      startTransition(async () => {
                        const r = await generateNextMonths(6);
                        if (r.success) {
                          toast({ title: (r.data?.created ?? 0) + " meses gerados!" });
                          router.refresh();
                        }
                      });
                    }}
                    disabled={isPending}
                  >
                    <CalendarPlus className="mr-1 h-3 w-3" />
                    Gerar 6 meses
                  </Button>
                </div>
              </div>
              <div className="rounded-md border divide-y max-h-80 overflow-y-auto">
                {months.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm">{m.value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteConfirm({ id: m.id, type: "month" })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {months.length === 0 && (
                  <p className="px-3 py-4 text-sm text-muted-foreground text-center">Nenhum mes cadastrado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="responsaveis" className="mt-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-muted-foreground">Responsaveis</h3>
                <Button size="sm" variant="outline" onClick={() => openDialog("responsavel")}>
                  <Plus className="mr-1 h-3 w-3" />
                  Adicionar
                </Button>
              </div>
              <div className="rounded-md border divide-y">
                {responsaveis.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{r.nome}</p>
                      {r.setor && <p className="text-xs text-muted-foreground">{r.setor}</p>}
                      {!r.is_active && <span className="text-xs text-red-500">Inativo</span>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog("responsavel", r)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm({ id: r.id, type: "responsavel" })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {responsaveis.length === 0 && (
                  <p className="px-3 py-4 text-sm text-muted-foreground text-center">Nenhum responsavel cadastrado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes" className="mt-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-muted-foreground">Clientes</h3>
                <Button size="sm" variant="outline" onClick={() => openDialog("cliente")}>
                  <Plus className="mr-1 h-3 w-3" />
                  Adicionar
                </Button>
              </div>
              <div className="rounded-md border divide-y">
                {clientes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{c.nome}</p>
                      {c.empresa && <p className="text-xs text-muted-foreground">{c.empresa}</p>}
                      {c.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {c.cnpj}</p>}
                      {!c.is_active && <span className="text-xs text-red-500">Inativo</span>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog("cliente", c)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm({ id: c.id, type: "cliente" })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {clientes.length === 0 && (
                  <p className="px-3 py-4 text-sm text-muted-foreground text-center">Nenhum cliente cadastrado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statusVisita" className="mt-4">
          <GenericList
            title="Status de Visita"
            items={statusVisita}
            displayKey={(i) => i.name ?? ""}
            onAdd={() => openDialog("statusVisita")}
            onEdit={(i) => openDialog("statusVisita", i)}
            onDelete={(id) => setDeleteConfirm({ id, type: "statusVisita" })}
          />
        </TabsContent>

        <TabsContent value="semanas" className="mt-4">
          <GenericList
            title="Semanas"
            items={semanas}
            displayKey={(i) => "Semana " + i.number}
            onAdd={() => openDialog("semana")}
            onDelete={(id) => setDeleteConfirm({ id, type: "semana" })}
            canEdit={false}
          />
        </TabsContent>

        <TabsContent value="notas" className="mt-4">
          <GenericList
            title="Notas de Atendimento"
            items={notas}
            displayKey={(i) => String(i.value)}
            onAdd={() => openDialog("nota")}
            onDelete={(id) => setDeleteConfirm({ id, type: "nota" })}
            canEdit={false}
          />
        </TabsContent>

        <TabsContent value="tipoErro" className="mt-4">
          <GenericList
            title="Tipos de Erro"
            items={tipoErro}
            displayKey={(i) => i.name + " (" + i.penalty_points + " pts)"}
            onAdd={() => openDialog("tipoErro")}
            onEdit={(i) => openDialog("tipoErro", i)}
            onDelete={(id) => setDeleteConfirm({ id, type: "tipoErro" })}
          />
        </TabsContent>

        <TabsContent value="senhas" className="mt-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Senhas da Coordenacao por Departamento</h3>
                <p className="text-xs text-muted-foreground">Define a senha que cada coordenacao usa para entrar no sistema.</p>
              </div>
              <div className="rounded-md border divide-y">
                {deptPasswords.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-3 py-2 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.hasPassword
                          ? `Senha definida${d.updatedAt ? " em " + new Date(d.updatedAt).toLocaleDateString("pt-BR") : ""}`
                          : "Sem senha configurada"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        placeholder="Nova senha..."
                        className="w-36 h-7 text-xs"
                        value={deptPwInputs[d.id] ?? ""}
                        onChange={(e) =>
                          setDeptPwInputs((prev) => ({ ...prev, [d.id]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        disabled={isPending || !deptPwInputs[d.id]}
                        onClick={() => {
                          const pw = deptPwInputs[d.id];
                          if (!pw) return;
                          startTransition(async () => {
                            const r = await setDepartmentPassword(d.id, pw);
                            if (r.success) {
                              toast({ title: "Senha definida para " + d.name });
                              setDeptPwInputs((prev) => ({ ...prev, [d.id]: "" }));
                              router.refresh();
                            } else {
                              toast({ title: "Erro", description: r.error, variant: "destructive" });
                            }
                          });
                        }}
                      >
                        <KeyRound className="h-3 w-3 mr-1" />
                        Definir
                      </Button>
                      {d.hasPassword && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive"
                          disabled={isPending}
                          onClick={() => {
                            startTransition(async () => {
                              const r = await removeDepartmentPassword(d.id);
                              if (r.success) {
                                toast({ title: "Senha removida de " + d.name });
                                router.refresh();
                              } else {
                                toast({ title: "Erro", description: r.error, variant: "destructive" });
                              }
                            });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={dialog.open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Editar" : "Adicionar"}{" "}
              {type === "department" && "Departamento"}
              {type === "month" && "Mes"}
              {type === "statusVisita" && "Status de Visita"}
              {type === "semana" && "Semana"}
              {type === "nota" && "Nota"}
              {type === "tipoErro" && "Tipo de Erro"}
              {type === "responsavel" && "Responsavel"}
              {type === "cliente" && "Cliente"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {type === "department" && (
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={fields.name as string} onChange={(e) => setField("name", e.target.value)} />
              </div>
            )}

            {type === "month" && (
              <div className="space-y-1">
                <Label>Mes (YYYY-MM)</Label>
                <Input placeholder="2026-01" value={fields.value as string} onChange={(e) => setField("value", e.target.value)} />
              </div>
            )}

            {type === "statusVisita" && (
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={fields.name as string} onChange={(e) => setField("name", e.target.value)} />
              </div>
            )}

            {type === "semana" && (
              <div className="space-y-1">
                <Label>Numero</Label>
                <Input type="number" min="1" max="5" value={fields.number as string} onChange={(e) => setField("number", e.target.value)} />
              </div>
            )}

            {type === "nota" && (
              <div className="space-y-1">
                <Label>Valor</Label>
                <Input type="number" min="1" value={fields.value as string} onChange={(e) => setField("value", e.target.value)} />
              </div>
            )}

            {type === "tipoErro" && (
              <>
                <div className="space-y-1">
                  <Label>Nome</Label>
                  <Input value={fields.name as string} onChange={(e) => setField("name", e.target.value)} placeholder="Ex.: Leve, Medio, Grave" />
                </div>
                <div className="space-y-1">
                  <Label>Pontos de Penalidade</Label>
                  <Input type="number" min="0" value={fields.penalty_points as string} onChange={(e) => setField("penalty_points", e.target.value)} />
                </div>
              </>
            )}

            {type === "responsavel" && (
              <>
                <div className="space-y-1">
                  <Label>Nome *</Label>
                  <Input value={fields.nome as string} onChange={(e) => setField("nome", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Setor</Label>
                  <Input value={fields.setor as string} onChange={(e) => setField("setor", e.target.value)} placeholder="Ex.: Financeiro, RH..." />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={fields.is_active as boolean}
                    onCheckedChange={(c) => setField("is_active", Boolean(c))}
                  />
                  <Label>Ativo</Label>
                </div>
              </>
            )}

            {type === "cliente" && (
              <>
                <div className="space-y-1">
                  <Label>Nome *</Label>
                  <Input value={fields.nome as string} onChange={(e) => setField("nome", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Empresa</Label>
                  <Input value={fields.empresa as string} onChange={(e) => setField("empresa", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>CNPJ</Label>
                    <Input value={fields.cnpj as string} onChange={(e) => setField("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    <Input value={fields.telefone as string} onChange={(e) => setField("telefone", e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={fields.is_active as boolean}
                    onCheckedChange={(c) => setField("is_active", Boolean(c))}
                  />
                  <Label>Ativo</Label>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        onConfirm={handleDelete}
        description="Confirma a exclusao deste item?"
      />
    </>
  );
}