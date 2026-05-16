import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/Providers";

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
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col">
          <div className="flex h-14 items-center border-b border-gray-200 px-4">
            <span className="text-lg font-bold text-indigo-600">Scrum LBC</span>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            <a
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Team Board
            </a>
            {userRole === "CTO" && (
              <>
                <a
                  href="/ideas"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Ideas
                </a>
                <a
                  href="/review"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Review
                </a>
              </>
            )}
            <a
              href="/my-work"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              My Work
            </a>
            <a
              href="/standup"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Standup
            </a>
            <a
              href="/activity"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Activity
            </a>
          </nav>
          <div className="border-t border-gray-200 p-3">
            <span className="text-xs text-gray-400">{userRole}</span>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
            <h1 className="text-sm font-semibold text-gray-900 md:hidden">
              Scrum LBC
            </h1>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-sm text-gray-600">{userName}</span>
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                {userRole}
              </span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
