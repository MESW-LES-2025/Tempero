import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";

export default function XpCard() {
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [chefType, setChefType] = useState<string>("New Cook");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("xp, level, chef_type")
        .eq("auth_id", user.id)
        .single();

      if (error || !data) return;

      setXp(data.xp || 0);
      setLevel(data.level || 1);
      setChefType(data.chef_type || "New Cook");
    };

    fetchProfile();

    const channel = supabase
      .channel(`profile-xp-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `auth_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setXp(newData.xp || 0);
          setLevel(newData.level || 1);
          setChefType(newData.chef_type || "New Cook");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-white border border-secondary/20 rounded-xl p-6 shadow-sm w-full max-w-2xl mt-16 md:mt-0">
      <h3 className="text-lg font-heading-styled text-secondary mb-4">
        Your Progress
      </h3>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-heading text-dark">Level {level}</span>
          <span className="text-sm font-heading text-main">{chefType}</span>
        </div>

        <div className="h-4 bg-bright rounded-full overflow-hidden">
          <div
            className="h-full bg-main rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (xp % 1000) / 10)}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-dark/60 font-body">{xp} XP</span>
          <span className="text-xs text-dark/60 font-body">
            {Math.floor(xp / 1000) * 1000 + 1000} XP
          </span>
        </div>
      </div>
    </div>
  );
}
