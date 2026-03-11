import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: settings } = await supabase.from("settings").select("*").eq("user_id", user.id).single();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-foreground/70 text-sm mt-0.5">Dados da empresa e preferências</p>
      </div>
      <SettingsForm profile={profile} settings={settings} />
    </div>
  );
}
