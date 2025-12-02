import { useState } from "react";
import ReactMarkdown from "react-markdown";

type FaqItem = {
  question: string;
  answer: string;
};

const faqData: FaqItem[] = [
  {
    question: "How do I create a recipe?",
    answer: `
You can create a recipe by going to **Recipes → Add Recipe**.  
Make sure to include:
- Title  
- Ingredients  
- Steps  
- Photos *(optional)*  
    `,
  },
  {
    question: "How do I make a list thematic?",
    answer: `
When creating a list, simply choose a **title** that describes the theme.  
For example:

- *Portuguese Classics*  
- *Vegetarian Dishes*  
- *My Travel Cooking Notes*  

Then you can add recipes inside it.
    `,
  },
  {
    question: "How do I follow other cooks?",
    answer: `
Visit any user profile and tap **Follow**.  
You will see their updates on future social features.
    `,
  },
  {
    question: "How do I edit my profile?",
    answer: `
    Go to Profile → Edit Profile.
    Here you can change your:
    - Profile Picture
    - Bio
    - Other personal details
    `,
  },
  {
    question: "How do I edit my uploaded recipes?",
    answer: `
    Go to Profile → My Recipes.
    Select the recipe you want to edit and tap Edit.
    Make your changes and save.
    `,
  },
  {
    question: "How do I search for recipes?",
    answer: `
Use the search bar at the top of the page.  
You can search by:
- Recipe Title  
- Ingredients  
- Tags
    `,
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <main className="min-h-screen bg-bright pb-20 pt-10 px-4 sm:px-6 lg:px-10">
      {/* Vertical Background Text */}
      <h1
        className="
          text-center absolute left-1/2 top-26 -translate-x-1/2
          text-[80px] font-heading-styled 
          text-dark/5 select-none tracking-tight
        "
      >
        FAQ
      </h1>
      <h1 className="text-3xl font-heading text-secondary mb-8 text-center">
        Frequently Asked Questions
      </h1>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqData.map((faq, i) => (
          <article
            key={i}
            className="border border-secondary/20 bg-white rounded-xl shadow-sm p-4 cursor-pointer"
            onClick={() => toggle(i)}
          >
            {/* Question */}
            <div className="flex justify-between items-center">
              <h2 className="font-heading text-lg text-secondary">
                {faq.question}
              </h2>

              <span className="text-main font-heading text-xl">
                {openIndex === i ? "−" : "+"}
              </span>
            </div>

            {/* Answer */}
            {openIndex === i && (
              <div className="mt-3 text-dark/80 font-body text-sm leading-6">
                <ReactMarkdown>{faq.answer}</ReactMarkdown>
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
