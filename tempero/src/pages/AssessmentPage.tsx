import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

export default function AssessmentPage() {
  const [questions, setQuestions] = useState<Array<{
    id: string;
    question: string;
    options: Array<{ text: string; score: number }>;
  }>>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Simple shuffle utility
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  useEffect(() => {
    const q = [
      {
        id: "q1",
        question: "How often do you cook at home?",
        options: [
          { text: "Rarely — maybe once a week or less.", score: 1 },
          { text: "A few times a week.", score: 2 },
          { text: "Almost every day.", score: 3 },
          { text: "Every day — I cook most of my meals.", score: 4 },
          { text: "Every day, and I experiment or try new dishes often.", score: 5 },
        ],
      },
      {
        id: "q2",
        question: "How would you describe your kitchen setup?",
        options: [
          { text: "Just the basics — one pan, a knife, and a stove.", score: 1 },
          { text: "A few extras like a blender or baking tray.", score: 2 },
          { text: "A solid setup — sharp knives, a scale, and good cookware.", score: 3 },
          { text: "Well-equipped — I have tools for most cooking techniques.", score: 4 },
          { text: "Professional-style — quality knives, thermometers, and specialized gear.", score: 5 },
        ],
      },
      {
        id: "q3",
        question: "How easy is it for you to find cooking ingredients?",
        options: [
          { text: "I mostly rely on basic supermarket items.", score: 1 },
          { text: "I can find most common ingredients easily.", score: 2 },
          { text: "I sometimes hunt for specific ones but manage.", score: 3 },
          { text: "I can access a wide range of ingredients when needed.", score: 4 },
          { text: "I have easy access to almost anything — including specialty items.", score: 5 },
        ],
      },
      {
        id: "q4",
        question: "When you read 'reduce by half', you...",
        options: [
          { text: "Have no idea what that means.", score: 1 },
          { text: "Let it simmer and guess when it looks less.", score: 2 },
          { text: "Watch until it thickens and volume drops noticeably.", score: 3 },
          { text: "Judge reduction by consistency and flavor concentration.", score: 4 },
          { text: "Track volume and viscosity precisely for predictable sauces.", score: 5 },
        ],
      },
      {
        id: "q5",
        question: "You're cooking chicken breast — what's your approach?",
        options: [
          { text: "I just cook until the inside looks white.", score: 1 },
          { text: "I flip occasionally to avoid burning.", score: 2 },
          { text: "I use a thermometer or timing to avoid drying.", score: 3 },
          { text: "I rest it and consider carry-over heat.", score: 4 },
          { text: "I control temperature zones or sous-vide for perfect juiciness.", score: 5 },
        ],
      },
      {
        id: "q6",
        question: "When browning onions for flavor, you...",
        options: [
          { text: "Turn up the heat to get it done faster.", score: 1 },
          { text: "Stir constantly until they're dark.", score: 2 },
          { text: "Cook medium-low and let them soften slowly.", score: 3 },
          { text: "Cook patiently for deep caramelization without burning.", score: 4 },
          { text: "Adjust fat, salt, and deglazing for layered sweetness and color.", score: 5 },
        ],
      },
      {
        id: "q7",
        question: "You're seasoning soup. What's your process?",
        options: [
          { text: "I just follow the recipe's measurements.", score: 1 },
          { text: "I add salt at the end.", score: 2 },
          { text: "I taste as I go.", score: 3 },
          { text: "I season progressively in layers.", score: 4 },
          { text: "I balance seasoning, acidity, and fat instinctively.", score: 5 },
        ],
      },
      {
        id: "q8",
        question: "When a recipe calls for 'tempering eggs,' you...",
        options: [
          { text: "Don't know what that means.", score: 1 },
          { text: "Just mix hot liquid and eggs together.", score: 2 },
          { text: "Add a little hot liquid slowly while whisking.", score: 3 },
          { text: "Gradually equalize temperature to avoid curdling.", score: 4 },
          { text: "Temper intuitively and use it for custards or sauces confidently.", score: 5 },
        ],
      },
      {
        id: "q9",
        question: "When you hear 'umami', what comes to mind?",
        options: [
          { text: "Never heard of it.", score: 1 },
          { text: "Something about savory taste.", score: 2 },
          { text: "Foods like soy sauce or mushrooms.", score: 3 },
          { text: "Deep flavor from glutamates and slow cooking.", score: 4 },
          { text: "Layering natural umami sources for depth and balance.", score: 5 },
        ],
      },
      {
        id: "q10",
        question: "How do you feel improvising without a recipe?",
        options: [
          { text: "I can't — I need exact steps.", score: 1 },
          { text: "I can tweak a bit but stay close.", score: 2 },
          { text: "I can swap ingredients I know well.", score: 3 },
          { text: "I cook mostly by feel and tasting.", score: 4 },
          { text: "I create dishes from concepts and memory.", score: 5 },
        ],
      },
    ];

    // Shuffle questions and their options
    const shuffled = shuffleArray(q).map(question => ({
      ...question,
      options: shuffleArray(question.options),
    }));
    setQuestions(shuffled);
  }, []);

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
      alert(`Failed to save assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    const confirmSkip = window.confirm(
      "Are you sure you want to skip? You’ll start as a beginner (level 1)."
    );
    if (!confirmSkip) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Set default XP for beginners
      const { error } = await supabase
        .from('profiles')
        .update({ xp: 1000 })
        .eq('auth_id', user.id);

      if (error) throw error;

      navigate("/");
    } catch (error) {
      console.error("Skip error:", error);
      alert(`Failed to skip assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

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

          {/* Skip button with spacing */}
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="w-1/2 rounded-lg bg-gray-500 px-4 py-2.5 text-white hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 duration-150"
            >
              Skip
            </button>
          </div>

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
                        onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.score }))}
                        className="text-main focus:ring-main"
                        required
                      />
                      <span className="text-sm text-dark font-body">{opt.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-8 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-secondary px-4 py-2.5 text-white hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70 duration-150"
              >
                {loading ? "Calculating..." : "Submit Assessment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
