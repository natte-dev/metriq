"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import {
  createTipoErro,
  updateTipoErro,
  deleteTipoErro,
} from "@/server/actions/listas";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type TipoErro = { id: number; name: string; penalty_points: number };

interface TipoErroManagerProps {
  initialData: TipoErro[];
}

export function TipoErroManager({ initialData }: TipoErroManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<TipoErro | null>(null);
  const [name, setName] = useState("");
  const [points, setPoints] = useState("");

  function openCreate() {
    setEditing(null);
    setName("");
    setPoints("");
    setDialogOpen(true);
  }

  function openEdit(item: TipoErro) {
    setEditing(item);
    setName(item.name);
    setPoints(String(item.penalty_points));
    setDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim() || !points) return;
    startTransition(async () => {
      const data = { name: name.trim(), penalty_points: Number(points) };
      const result = editing
        ? await updateTipoErro(editing.id, data)
        : await createTipoErro(data);
      if (result.success) {
        toast({ title: editing ? "Tipo atualizado!" : "Tipo criado!" });
        setDialogOpen(false);
        router.refresh();
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  }

  async function handleDelete() {
    if (deleteId === null) return;
    const result = await deleteTipoErro(deleteId);
    if (result.success) {
      toast({ title: "Tipo excluído!" });
      router.refresh();
    } else {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
    }
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Tipo
            </Button>
          </div>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Tipo</th>
                  <th className="px-4 py-2 text-right font-medium">Pontos</th>
                  <th className="px-4 py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {initialData.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2 text-right">{item.penalty_points}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {initialData.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                      Nenhum tipo de erro cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Tipo de Erro" : "Novo Tipo de Erro"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Leve, Médio, Grave"
              />
            </div>
            <div className="space-y-1">
              <Label>Pontos de Penalidade</Label>
              <Input
                type="number"
                min="0"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="Ex.: 2"
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
        description="Tem certeza que deseja excluir este tipo de erro?"
      />
    </>
  );
}
