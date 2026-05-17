import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as { id: string; name?: string | null; role: string };
  const userName = user.name ?? "User";
  const userRole = user.role ?? "EMPLOYEE";

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden">
        <Sidebar userRole={userRole} userName={userName} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header userName={userName} userRole={userRole} />

          <main className="flex-1 overflow-y-auto bg-background p-5">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
