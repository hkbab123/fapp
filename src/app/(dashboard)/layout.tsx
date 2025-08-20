import Link from "next/link";
import { ReactNode } from "react";

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
    >
      <span className="opacity-70 group-hover:opacity-100">{icon}</span>
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            FApp
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/transactions" className="rounded-md px-3 py-1.5 text-sm hover:bg-gray-50">
              Transactions
            </Link>
            <Link href="/accounts" className="rounded-md px-3 py-1.5 text-sm hover:bg-gray-50">
              Manage Accounts
            </Link>
            <Link href="/categories" className="rounded-md px-3 py-1.5 text-sm hover:bg-gray-50">
              Manage Categories
            </Link>
            <Link href="/fx" className="rounded-md px-3 py-1.5 text-sm hover:bg-gray-50">
              Fx Rate
            </Link>
          </nav>
        </div>
      </header>

      {/* Shell */}
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <nav className="rounded-lg border bg-white p-3">
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Overview
            </div>
            <NavItem href="/dashboard" label="Dashboard" />
            <div className="mt-3 mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Manage
            </div>
            <NavItem href="/transactions" label="Transactions" />
            <NavItem href="/accounts" label="Accounts" />
            <NavItem href="/categories" label="Categories" />
          </nav>
        </aside>

        {/* Content */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          {children}
        </main>
      </div>
    </div>
  );
}