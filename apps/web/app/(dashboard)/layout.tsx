export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r bg-muted/40 md:block">
        <div className="flex h-14 items-center border-b px-4 font-semibold">
          BookingKit
        </div>
        <nav className="space-y-1 p-4">
          <p className="text-sm text-muted-foreground">Dashboard nav — stub</p>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
