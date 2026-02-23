import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Metriq - Controle de Metas por Departamento",
  description: "Sistema interno de controle de metas departamentais",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const role = (cookieStore.get("role")?.value ?? "manager") as "manager" | "coord";
  const coordDeptId = cookieStore.get("coord_department_id")?.value ?? null;

  let coordDeptName: string | null = null;
  if (role === "coord" && coordDeptId) {
    const dept = await prisma.department.findUnique({
      where: { id: Number(coordDeptId) },
      select: { name: true },
    });
    coordDeptName = dept?.name ?? null;
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar role={role} coordDeptName={coordDeptName} />
            <main className="ml-64 flex-1 p-8">
              {children}
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
