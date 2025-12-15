import { supabase } from "../config/supabaseClient";

export async function getReports(filter: string = "all") {
  let query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("reported_item_type", filter);
  }

  const { data: reports, error } = await query;

  if (error) {
    console.error("Error fetching reports:", error);
    return [];
  }

  // Fetch reporter usernames separately
  if (reports && reports.length > 0) {
    const reporterIds = reports.map(r => r.reporter_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("auth_id, username")
      .in("auth_id", reporterIds);

    const profileMap = new Map(profiles?.map(p => [p.auth_id, p]) || []);

    return reports.map(report => ({
      ...report,
      profiles: profileMap.get(report.reporter_id) || null,
    }));
  }

  return reports || [];
}

export async function getUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("auth_id, username, first_name, last_name")
    .order("username", { ascending: true })
    .limit(50);

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return data || [];
}

export async function updateReportStatus(reportId: string, status: "resolved" | "dismissed") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("reports")
    .update({
      status,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  return { error };
}

export async function getAdminStats() {
  const [usersCount, recipesCount, reviewsCount, reportsCount, topRecipes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("recipes").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("recipes")
      .select("id, title, recipe_likes(recipe_id)")
      .limit(100),
  ]);

  // Count likes and sort manually
  const recipesWithLikes = (topRecipes.data || []).map((recipe: { id: string; title: string; recipe_likes?: unknown[] }) => ({
    id: recipe.id,
    title: recipe.title,
    likesCount: recipe.recipe_likes?.length || 0,
  }));

  const sortedRecipes = recipesWithLikes.sort((a: { likesCount: number }, b: { likesCount: number }) => b.likesCount - a.likesCount).slice(0, 5);

  return {
    totalUsers: usersCount.count || 0,
    totalRecipes: recipesCount.count || 0,
    totalReviews: reviewsCount.count || 0,
    pendingReports: reportsCount.count || 0,
    topRecipes: sortedRecipes,
  };
}
