import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { getAdminStats, getReports, updateReportStatus, getUsers } from "../services/adminService";
import ResolveReportModal from "../components/ResolveReportModal";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"stats" | "reports" | "users">("stats");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [reportFilter, setReportFilter] = useState("all");
  const [reportLoading, setReportLoading] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (tab === "stats") {
      setLoading(true);
      getAdminStats().then((data) => {
        setStats(data);
        setLoading(false);
      });
    } else if (tab === "reports") {
      setReportLoading(true);
      getReports(reportFilter).then(async (data) => {
        // Fetch content preview for reviews and comments
        const enrichedReports = await Promise.all(
          data.map(async (report) => {
            if (report.reported_item_type === "review") {
              const { data: review } = await supabase
                .from("reviews")
                .select("description")
                .eq("id", report.reported_item_id)
                .single();
              return { ...report, content_preview: review?.description || "No description" };
            } else if (report.reported_item_type === "comment") {
              const { data: comment } = await supabase
                .from("comments")
                .select("body")
                .eq("id", report.reported_item_id)
                .single();
              return { ...report, content_preview: comment?.body || "No content" };
            }
            return report;
          })
        );
        setReports(enrichedReports);
        setReportLoading(false);
      });
    } else if (tab === "users") {
      setUsersLoading(true);
      getUsers().then((data) => {
        setUsers(data);
        setUsersLoading(false);
      });
    }
  }, [tab, reportFilter]);

  async function handleReportAction(reportId: string, action: "resolved" | "dismissed") {
    await updateReportStatus(reportId, action);
    const updated = await getReports(reportFilter);
    setReports(updated);
  }

  async function handleReportResolved() {
    const updated = await getReports(reportFilter);
    setReports(updated);
  }

  return (
    <div className="min-h-screen w-full bg-bright py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-heading text-secondary mb-8">Admin Dashboard</h1>
        
        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-dark/10">
          <button
            className={`pb-3 px-2 font-heading text-lg ${
              tab === "stats"
                ? "text-secondary border-b-2 border-secondary"
                : "text-dark/60 hover:text-secondary"
            }`}
            onClick={() => setTab("stats")}
          >
            Stats
          </button>
          
          <button
            className={`pb-3 px-2 font-heading text-lg ${
              tab === "reports"
                ? "text-secondary border-b-2 border-secondary"
                : "text-dark/60 hover:text-secondary"
            }`}
            onClick={() => setTab("reports")}
          >
            Reports
          </button>
          
          <button
            className={`pb-3 px-2 font-heading text-lg ${
              tab === "users"
                ? "text-secondary border-b-2 border-secondary"
                : "text-dark/60 hover:text-secondary"
            }`}
            onClick={() => setTab("users")}
          >
            Users
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {tab === "stats" && (
            <div>
              {loading ? (
                <p className="text-center text-dark/60 font-heading">Loading...</p>
              ) : (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-bright p-6 rounded-lg">
                      <p className="text-dark/60 text-sm font-heading">Total Users</p>
                      <p className="text-4xl font-heading-styled text-secondary mt-2">{stats?.totalUsers || 0}</p>
                    </div>
                    <div className="bg-bright p-6 rounded-lg">
                      <p className="text-dark/60 text-sm font-heading">Total Recipes</p>
                      <p className="text-4xl font-heading-styled text-secondary mt-2">{stats?.totalRecipes || 0}</p>
                    </div>
                    <div className="bg-bright p-6 rounded-lg">
                      <p className="text-dark/60 text-sm font-heading">Total Reviews</p>
                      <p className="text-4xl font-heading-styled text-secondary mt-2">{stats?.totalReviews || 0}</p>
                    </div>
                    <div className="bg-bright p-6 rounded-lg">
                      <p className="text-dark/60 text-sm font-heading">Pending Reports</p>
                      <p className="text-4xl font-heading-styled text-main mt-2">{stats?.pendingReports || 0}</p>
                    </div>
                  </div>

                  {/* Top Content */}
                  <div>
                    <h2 className="text-2xl font-heading text-secondary mb-4">Top Recipes</h2>
                    {stats?.topRecipes?.length > 0 ? (
                      <div className="space-y-3">
                        {stats.topRecipes.map((recipe: any) => (
                          <div key={recipe.id} className="flex justify-between items-center p-3 bg-bright rounded-lg">
                            <span className="font-body text-dark">{recipe.title}</span>
                            <span className="text-main font-heading">{recipe.likesCount} likes</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-dark/60 font-body">No recipes yet</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          {tab === "reports" && (
            <div>
              <h1 className="text-3xl font-heading-styled text-secondary mb-6">Reports Management</h1>
              
              {/* Filter Buttons */}
              <div className="flex gap-3 mb-6">
                {["all", "review", "recipe", "comment", "user"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setReportFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-heading capitalize transition ${
                      reportFilter === filter
                        ? "bg-secondary text-bright"
                        : "bg-white text-dark hover:bg-bright"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {reportLoading ? (
                <p className="text-center text-dark/60 font-heading">Loading reports...</p>
              ) : reports.length === 0 ? (
                <p className="text-center text-dark/60 font-body py-8">No reports found</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-white p-6 rounded-lg shadow-sm border border-dark/10">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="bg-main/20 text-main px-3 py-1 rounded-full text-sm font-heading capitalize">
                            {report.reported_item_type}
                          </span>
                          <h3 className="font-heading text-lg text-secondary mt-2">{report.reason}</h3>
                        </div>
                        <span className="text-sm text-dark/60 font-body">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-dark/80 font-body mb-4">
                        Reported by: @{report.profiles?.username || "Unknown"}
                      </p>
                      {report.content_preview && (
                        <div className="bg-bright/50 p-3 rounded-lg mb-4">
                          <p className="text-xs text-dark/60 font-heading mb-1">Content Preview:</p>
                          <p className="text-sm text-dark font-body line-clamp-3">"{report.content_preview}"</p>
                        </div>
                      )}
                      <p className="text-dark/60 font-body text-sm mb-4">
                        Status: <span className="capitalize">{report.status}</span>
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            const type = report.reported_item_type;
                            const id = report.reported_item_id;
                            
                            if (type === "recipe") {
                              navigate(`/recipe/${id}`);
                            } else if (type === "user") {
                              // Fetch username from profiles
                              const { data } = await supabase
                                .from("profiles")
                                .select("username")
                                .eq("auth_id", id)
                                .single();
                              if (data?.username) {
                                navigate(`/profile/${data.username}`);
                              }
                            } else if (type === "review") {
                              // Fetch recipe_id from review
                              const { data } = await supabase
                                .from("reviews")
                                .select("recipe_id")
                                .eq("id", id)
                                .single();
                              if (data?.recipe_id) {
                                navigate(`/recipe/${data.recipe_id}`);
                              }
                            } else if (type === "comment") {
                              // Fetch recipe_id through review
                              const { data: comment } = await supabase
                                .from("comments")
                                .select("review_id")
                                .eq("id", id)
                                .single();
                              if (comment?.review_id) {
                                const { data: review } = await supabase
                                  .from("reviews")
                                  .select("recipe_id")
                                  .eq("id", comment.review_id)
                                  .single();
                                if (review?.recipe_id) {
                                  navigate(`/recipe/${review.recipe_id}`);
                                }
                              }
                            }
                          }}
                          className="bg-secondary text-bright px-4 py-2 rounded-lg font-heading hover:bg-secondary/90"
                        >
                          View
                        </button>
                        {report.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedReport(report);
                                setResolveModalOpen(true);
                              }}
                              className="bg-main text-bright px-4 py-2 rounded-lg font-heading hover:bg-main/90"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => handleReportAction(report.id, "dismissed")}
                              className="bg-dark/20 text-dark px-4 py-2 rounded-lg font-heading hover:bg-dark/30"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedReport && (
                <ResolveReportModal
                  isOpen={resolveModalOpen}
                  onClose={() => {
                    setResolveModalOpen(false);
                    setSelectedReport(null);
                  }}
                  report={selectedReport}
                  onResolved={handleReportResolved}
                />
              )}
            </div>
          )}
          
          {tab === "users" && (
            <div>
              <h1 className="text-3xl font-heading-styled text-secondary mb-6">User Management</h1>
              
              {usersLoading ? (
                <p className="text-center text-dark/60 font-heading">Loading users...</p>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-bright">
                      <tr>
                        <th className="text-left p-4 font-heading text-secondary">Username</th>
                        <th className="text-left p-4 font-heading text-secondary">Name</th>
                        <th className="text-left p-4 font-heading text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-dark/60 font-body">No users found</td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.auth_id} className="border-b border-dark/10">
                            <td className="p-4 font-body text-dark">@{user.username}</td>
                            <td className="p-4 font-body text-dark">
                              {user.first_name} {user.last_name}
                            </td>
                            <td className="p-4 flex gap-3">
                              <button
                                onClick={() => navigate(`/profile/${user.username}`)}
                                className="text-secondary hover:text-main font-heading text-sm"
                              >
                                View
                              </button>
                              <button
                                onClick={async () => {
                                  const confirmed = window.confirm(`Delete user @${user.username}? This will delete all their content.`);
                                  if (!confirmed) return;
                                  
                                  const { error } = await supabase
                                    .from("profiles")
                                    .delete()
                                    .eq("auth_id", user.auth_id);
                                  
                                  if (error) {
                                    alert("Failed to delete user");
                                  } else {
                                    const updated = await getUsers();
                                    setUsers(updated);
                                  }
                                }}
                                className="text-danger hover:text-danger/80 font-heading text-sm"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
