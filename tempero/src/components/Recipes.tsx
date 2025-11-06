type Recipe = {
  id: number;
  title: string;
  description: string;
  image: string;
};

const recipes: Recipe[] = [
  {
    id: 1,
    title: "Thai Rice",
    description:
      "Bright, fragrant, and weeknight-fast, this Thai rice brings together jasmine grains, zingy lime, and a whisper of fish sauce for umami depth. Tossed hot with garlic, chilies, and a handful of fresh herbs, it’s the kind of side that steals the show—for a full meal once you crown it with a crispy fried egg.",
    image:
      "https://images.unsplash.com/photo-1679735386220-e8888925676e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGhhaSUyMHJpY2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=600",
  },
  {
    id: 2,
    title: "Peach Melba",
    description:
      "A timeless creation blending ripe peaches, smooth vanilla ice cream, and tart raspberry sauce. A symphony of textures and flavors born from simplicity and grace.",
    image:
      "https://media.istockphoto.com/id/1127066808/photo/tasty-fresh-cold-appetizing-vanilla-ice-cream-with-nuts-apricots-waffles-and-syrup-on-white.webp?a=1&b=1&s=612x612&w=0&k=20&c=ltkfc6ou0XE-erUI2j2-PPtz3fg5ZavXcQW6mwZ8Cs8=",
  },
  {
    id: 3,
    title: "Beef Bourguignon",
    description:
      "Classic French stew braised in red wine with mushrooms, pearl onions, and tender beef — slow-cooked perfection honoring tradition and balance.",
    image:
      "https://images.unsplash.com/photo-1548869206-93b036288d7e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8QmVlZiUyMEJvdXJndWlnbm9ufGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600",
  },
];

export default function Recipes() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {recipes.map((r) => (
        <article
          key={r.id}
          className="rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white hover:shadow-md transition"
        >
          <img
            src={r.image}
            alt={r.title}
            className="w-full h-44 object-cover"
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold text-[#e57f22]">{r.title}</h3>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">
              {r.description}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
