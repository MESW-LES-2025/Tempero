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
You can create a recipe by going to **Your Profile → Add Recipe (+ button at the bottom right)**.
Make sure to fill all form fields, except the image which is optional.

    `,
  },
  {
    question: "How do I create a thematic list?",
    answer: `
To create a thematic list, go to **Your Profile → Thematic Lists → + Thematic List (dashed rectangle)**.
Fill in the title and description, then add recipes to your list.
You can add more recipes later by editing the list.
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
  {
    question: "Which image formats are supported?",
    answer: `
Right now we support JPEG format only.
In the future we plan to support other formats including HEIC.
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
