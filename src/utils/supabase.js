import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export async function fetchProducts() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });
  if (error) {
    console.error("Failed to fetch products:", error);
    return null;
  }
  return data;
}

export async function upsertProduct(product) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .upsert(product, { onConflict: "id" })
    .select()
    .single();
  if (error) {
    console.error("Failed to upsert product:", error);
    return null;
  }
  return data;
}

export async function insertProduct(product) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();
  if (error) {
    console.error("Failed to insert product:", error);
    return null;
  }
  return data;
}

export async function deleteProduct(id) {
  if (!supabase) return false;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete product:", error);
    return false;
  }
  return true;
}

export function subscribeToProducts(callback) {
  if (!supabase) return null;
  const channel = supabase
    .channel("products-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      (payload) => callback(payload)
    )
    .subscribe();
  return channel;
}
