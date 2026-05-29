import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PresenceRail } from "@/components/presence/PresenceRail";

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
  const userRole = user.role ?? "ASSOCIATE";
  const userId = user.id;

  return (
    <Providers>
      <Sidebar userRole={userRole} userName={userName} />
      <PresenceRail currentUserId={userId} />

      <div className="flex h-screen flex-col overflow-hidden lg:pr-[232px]">
        <Header userName={userName} userRole={userRole} />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </Providers>
  );
}
