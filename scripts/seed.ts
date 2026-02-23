import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Departments
  const departmentNames = ["Contabil", "Fiscal", "DP", "RH", "Comercial"];
  for (const name of departmentNames) {
    await prisma.department.upsert({
      where: { id: await getDeptIdByName(name) ?? 0 },
      update: {},
      create: { name },
    });
  }
  console.log("Departments seeded");

  // Months (last 3 + next 3)
  const now = new Date();
  const monthValues: string[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    monthValues.push(d.toISOString().slice(0, 7));
  }
  for (const value of monthValues) {
    await prisma.month.upsert({
      where: { value },
      update: {},
      create: { value },
    });
  }
  console.log("Months seeded:", monthValues);

  // Status Visita
  const statusNames = ["Pendente", "Concluida", "Cancelada"];
  for (const name of statusNames) {
    const existing = await prisma.statusVisita.findFirst({ where: { name } });
    if (!existing) {
      await prisma.statusVisita.create({ data: { name } });
    }
  }
  console.log("Status Visita seeded");

  // Semanas (1-5)
  for (let number = 1; number <= 5; number++) {
    const existing = await prisma.semana.findFirst({ where: { number } });
    if (!existing) {
      await prisma.semana.create({ data: { number } });
    }
  }
  console.log("Semanas seeded");

  // Notas (1-5)
  for (let value = 1; value <= 5; value++) {
    const existing = await prisma.nota.findFirst({ where: { value } });
    if (!existing) {
      await prisma.nota.create({ data: { value } });
    }
  }
  console.log("Notas seeded");

  // Tipo Erro
  const tipoErros = [
    { name: "Leve", penalty_points: 2 },
    { name: "Medio", penalty_points: 5 },
    { name: "Grave", penalty_points: 15 },
  ];
  for (const te of tipoErros) {
    const existing = await prisma.tipoErro.findFirst({ where: { name: te.name } });
    if (!existing) {
      await prisma.tipoErro.create({ data: te });
    }
  }
  console.log("Tipo Erro seeded");

  // App Params
  const existingParams = await prisma.appParams.findFirst();
  if (!existingParams) {
    await prisma.appParams.create({
      data: {
        meta_visitas_mes: 4,
        escala_atendimento_max: 5,
        peso_visitacao: 0.40,
        peso_atendimento: 0.35,
        peso_qualidade: 0.25,
        bonus_trimestral: 150.00,
        bonus_semestral: 300.00,
        bonus_anual: 300.00,
      },
    });
    console.log("App Params seeded");
  } else {
    console.log("App Params already exists, skipping");
  }

  // Responsaveis (sample)
  const responsaveis = [
    { nome: "Ana Silva", setor: "Contabilidade" },
    { nome: "Carlos Souza", setor: "Fiscal" },
    { nome: "Mariana Lima", setor: "RH" },
    { nome: "Roberto Costa", setor: "Comercial" },
  ];
  for (const r of responsaveis) {
    const existing = await prisma.responsavel.findFirst({ where: { nome: r.nome } });
    if (!existing) {
      await prisma.responsavel.create({ data: { nome: r.nome, setor: r.setor, is_active: true } });
    }
  }
  console.log("Responsaveis seeded");

  // Clientes (sample)
  const clientes = [
    { nome: "Empresa Alpha", empresa: "Alpha Ltda", cnpj: "00.000.001/0001-01" },
    { nome: "Empresa Beta", empresa: "Beta S.A.", cnpj: "00.000.002/0001-02" },
    { nome: "Empresa Gamma", empresa: null, cnpj: null },
  ];
  for (const c of clientes) {
    const existing = await prisma.cliente.findFirst({ where: { nome: c.nome } });
    if (!existing) {
      await prisma.cliente.create({ data: { nome: c.nome, empresa: c.empresa, cnpj: c.cnpj, is_active: true } });
    }
  }
  console.log("Clientes seeded");

  console.log("Seeding complete!");
}

async function getDeptIdByName(name: string): Promise<number | null> {
  const dept = await prisma.department.findFirst({ where: { name } });
  return dept?.id ?? null;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });