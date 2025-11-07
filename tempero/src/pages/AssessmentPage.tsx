import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

export default function AssessmentPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate total XP (sum of all answers)
      const totalXP = Object.values(answers).reduce((sum, value) => sum + value, 0);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log("Answers:", answers);
      console.log("Total XP calculated:", totalXP);
      console.log("User ID:", user.id);

      // Update profile with XP
      const { data, error } = await supabase
        .from('profiles')
        .update({ xp: totalXP * 100 }) 
        .eq('auth_id', user.id)  
        .select();

      console.log("Update result:", { data, error });

      if (error) throw error;

      // Redirect to main app
      navigate("/");
    } catch (error) {
      console.error("Assessment submission error:", error);
      alert(`Failed to save assessment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const questions = [
    {
      id: "q1",
      question: "How often do you cook?",
      options: [
        "Rarely",
        "A few times a week",
        "Almost every day",
        "Every day",
      ],
    },
    {
      id: "q2",
      question: "How do you feel when trying a new recipe?",
      options: ["Nervous", "Curious", "Confident"],
    },
    {
      id: "q3",
      question: "When a recipe says “season to taste,” what do you do?",
      options: [
        "I get confused",
        "Trust my instincts",
        "Season progressively",
      ],
    },
    {
      id: "q4",
      question: "Which tools do you have in your kitchen?",
      options: [
        "Just the basics",
        "Some extras (air fryer, scale, food processor)",
        "Full setup",
      ],
    },
    {
      id: "q5",
      question: "What’s the most advanced dish you’ve made?",
      options: [
        "Pasta or rice",
        "Cake or roast",
        "Multi-step meal (lasagna or risotto)",
      ],
    },
    {
      id: "q6",
      question: "When something goes wrong while cooking...",
      options: [
        "I give up",
        "I try to figure out what happened",
        "I am able to fix it",
      ],
    },
    {
      id: "q7",
      question: "How do you handle recipe measurements (cups, tsp, etc.)?",
      options: [
        "Always need to convert them",
        "I recognize some",
        "I know most by memory",
      ],
    },
    {
      id: "q8",
      question: "What kind of recipes do you prefer?",
      options: [
        "Quick and simple",
        "Home made and balanced",
        "Creative and challenging",
      ],
    },
    {
      id: "q9",
      question: "How easily can you find the ingredients you need for cooking?",
      options: [
        "I mostly use basic ingredients available nearby",
        "I can find most ingredients, though some require effort",
        "I have easy access to a wide variety, including specialty items",
      ],
    },
  ];

  return (
    <div className="relative min-h-screen bg-[url('/images/croissant-bg.jpg')] bg-cover bg-center overflow-y-auto">
      <div className="absolute inset-0 backdrop-blur-xs pointer-events-none"></div>

      <div className="relative z-10 mx-auto max-w-2xl w-full px-4 py-16">
        <div className="rounded-xl bg-bright/90 p-8 shadow-sm">
          <h1 className="mb-4 text-3xl font-bold font-heading text-main text-center">
            Cooking Skill Assessment
          </h1>
          <p className="mb-8 text-sm text-gray-600 text-center">
            Answer a few questions to find your starting chef level 🍳
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {questions.map((q, index) => (
              <div key={q.id} className="space-y-3">
                <h2 className="text-lg font-heading text-dark">
                  {index + 1}. {q.question}
                </h2>
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 rounded-lg bg-amber-50 hover:bg-amber-100 border-none px-3 py-2 shadow-sm cursor-pointer transition-all duration-150"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={i + 1}
                        onChange={() => setAnswers(prev => ({ ...prev, [q.id]: i + 1 }))}
                        className="text-main focus:ring-main"
                        required
                      />
                      <span className="text-sm text-dark font-body">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full rounded-lg bg-secondary px-4 py-2.5 text-white hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 duration-150"
            >
              {loading ? "Calculating..." : "Submit Assessment"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

