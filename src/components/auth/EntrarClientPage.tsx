"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart2, Lock, UserCheck, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Department = { id: number; name: string };
type Step = "choose" | "coord" | "manager";

interface Props {
  departments: Department[];
}

export function EntrarClientPage({ departments }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("choose");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [password, setPassword] = useState("");

  function handleManagerLogin() {
    startTransition(async () => {
      const res = await fetch("/api/auth/manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        toast({ title: "Bem-vindo, Gerente!" });
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        toast({
          title: "Acesso negado",
          description: data.error ?? "Senha incorreta",
          variant: "destructive",
        });
      }
    });
  }

  function handleCoordLogin() {
    if (!selectedDeptId) return;
    startTransition(async () => {
      const res = await fetch("/api/auth/coord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: Number(selectedDeptId),
          password,
        }),
      });
      if (res.ok) {
        const dept = departments.find((d) => d.id === Number(selectedDeptId));
        toast({ title: `Bem-vindo, ${dept?.name ?? "Coordenacao"}!` });
        router.push("/cronograma");
        router.refresh();
      } else {
        const data = await res.json();
        toast({
          title: "Acesso negado",
          description: data.error ?? "Senha invalida",
          variant: "destructive",
        });
      }
    });
  }

  function goBack() {
    setStep("choose");
    setPassword("");
    setSelectedDeptId("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <BarChart2 className="h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold">Metriq</h1>
          <p className="text-muted-foreground">
            Sistema de controle de metas por departamento
          </p>
        </div>

        {step === "choose" && (
          <div className="grid grid-cols-1 gap-4">
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                setPassword("");
                setSelectedDeptId("");
                setStep("coord");
              }}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <CardTitle>Coordenacao</CardTitle>
                <CardDescription>
                  Acesse cronograma e visitas do seu departamento.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button className="w-full" variant="outline">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Entrar como Coordenacao
                </Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                setPassword("");
                setStep("manager");
              }}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Lock className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                </div>
                <CardTitle>Gerencia</CardTitle>
                <CardDescription>
                  Acesso completo ao sistema. Requer senha.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  Entrar como Gerente
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "coord" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={goBack}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <CardTitle>Coordenacao</CardTitle>
                  <CardDescription>
                    Selecione seu departamento e digite a senha.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Departamento</Label>
                <Select
                  value={selectedDeptId}
                  onValueChange={setSelectedDeptId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha do departamento"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCoordLogin();
                  }}
                  autoFocus
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCoordLogin}
                disabled={isPending || !selectedDeptId || !password}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                Entrar
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "manager" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={goBack}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <CardTitle>Gerencia</CardTitle>
                  <CardDescription>Digite a senha de gerente.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha de gerente"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleManagerLogin();
                  }}
                  autoFocus
                />
              </div>
              <Button
                className="w-full"
                onClick={handleManagerLogin}
                disabled={isPending || !password}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Entrar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
