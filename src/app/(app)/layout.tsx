import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { SignOutButton } from "@/components/layout/SignOutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="hidden md:flex items-center justify-end gap-4 border-b border-gray-200 bg-white px-6 py-3">
          <span className="text-sm text-gray-600">
            {profile?.full_name ?? user.email}
          </span>
          <SignOutButton />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
