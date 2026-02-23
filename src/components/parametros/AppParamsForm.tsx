"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appParamsSchema, type AppParamsInput } from "@/lib/validations/app-params.schema";
import { updateAppParams } from "@/server/actions/parametros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AppParamsFormProps {
  initialData: {
    meta_visitas_mes: number;
    escala_atendimento_max: number | { toNumber(): number };
    peso_visitacao: number | { toNumber(): number };
    peso_atendimento: number | { toNumber(): number };
    peso_qualidade: number | { toNumber(): number };
    bonus_trimestral: number | { toNumber(): number };
    bonus_semestral: number | { toNumber(): number };
    bonus_anual: number | { toNumber(): number };
  } | null;
}

function toNum(v: number | { toNumber(): number } | undefined | null): number {
  if (v == null) return 0;
  if (typeof v === "object" && "toNumber" in v) return v.toNumber();
  return Number(v);
}

export function AppParamsForm({ initialData }: AppParamsFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppParamsInput>({
    resolver: zodResolver(appParamsSchema),
    defaultValues: {
      meta_visitas_mes: initialData?.meta_visitas_mes ?? 4,
      escala_atendimento_max: toNum(initialData?.escala_atendimento_max) || 5,
      peso_visitacao: toNum(initialData?.peso_visitacao) || 0.4,
      peso_atendimento: toNum(initialData?.peso_atendimento) || 0.35,
      peso_qualidade: toNum(initialData?.peso_qualidade) || 0.25,
      bonus_trimestral: toNum(initialData?.bonus_trimestral) || 150,
      bonus_semestral: toNum(initialData?.bonus_semestral) || 300,
      bonus_anual: toNum(initialData?.bonus_anual) || 300,
    },
  });

  function onSubmit(data: AppParamsInput) {
    startTransition(async () => {
      const result = await updateAppParams(data);
      if (result.success) {
        toast({ title: "Parâmetros salvos com sucesso!" });
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Meta Visitas/Mês</Label>
              <Input type="number" step="1" {...register("meta_visitas_mes")} />
              {errors.meta_visitas_mes && (
                <p className="text-xs text-destructive">{errors.meta_visitas_mes.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Escala Atendimento Máx</Label>
              <Input type="number" step="0.1" {...register("escala_atendimento_max")} />
              {errors.escala_atendimento_max && (
                <p className="text-xs text-destructive">{errors.escala_atendimento_max.message}</p>
              )}
            </div>
          </div>

          <div className="rounded-md border p-4 space-y-3">
            <p className="text-sm font-medium">Pesos (devem somar 1.0)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Visitação</Label>
                <Input type="number" step="0.01" {...register("peso_visitacao")} />
                {errors.peso_visitacao && (
                  <p className="text-xs text-destructive">{errors.peso_visitacao.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Atendimento</Label>
                <Input type="number" step="0.01" {...register("peso_atendimento")} />
              </div>
              <div className="space-y-1">
                <Label>Qualidade</Label>
                <Input type="number" step="0.01" {...register("peso_qualidade")} />
              </div>
            </div>
          </div>

          <div className="rounded-md border p-4 space-y-3">
            <p className="text-sm font-medium">Bônus</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Trimestral (R$)</Label>
                <Input type="number" step="0.01" {...register("bonus_trimestral")} />
              </div>
              <div className="space-y-1">
                <Label>Semestral (R$)</Label>
                <Input type="number" step="0.01" {...register("bonus_semestral")} />
              </div>
              <div className="space-y-1">
                <Label>Anual (R$)</Label>
                <Input type="number" step="0.01" {...register("bonus_anual")} />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Parâmetros
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
