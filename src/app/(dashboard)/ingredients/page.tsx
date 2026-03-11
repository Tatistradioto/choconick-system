import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { IngredientsTable } from "@/components/ingredients/IngredientsTable";

export default async function IngredientsPage() {
  const supabase = await createClient();
  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("*")
    .order("category")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ingredientes</h1>
          <p className="text-foreground/70 text-sm mt-0.5">Matéria-prima e preços</p>
        </div>
      </div>
      <IngredientsTable initialIngredients={ingredients || []} />
    </div>
  );
}
