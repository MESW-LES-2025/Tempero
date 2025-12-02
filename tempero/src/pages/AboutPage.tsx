export default function AboutPage() {
  return (
    <div className="w-full bg-bright text-dark">
      {/* Top Section */}
      <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-28">
        {/* Vertical Background Text */}
        <h1
          className="
          absolute left-0 top-24 
          text-[110px] font-heading-styled 
          text-dark/5 select-none tracking-tight
        "
        >
          ABOUT
        </h1>

        {/* Title */}
        <div className="max-w-lg">
          <h2 className="text-4xl font-heading text-secondary">
            About Tempero
          </h2>
          <p className="mt-3 text-dark/60 font-body">
            Tempero is your space to cook, create, and share recipes that
            matter.
          </p>
        </div>

        {/* Hero Image Mask */}
        <div className="absolute right-0 top-10 hidden md:block ">
          <img
            src="https://images.unsplash.com/photo-1702234883240-fb86c8087f3c?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Tempero display"
            className="w-[450px] opacity-90 rounded-xl"
          />
        </div>
      </section>

      {/* Content Section */}
      <section className="mx-auto max-w-6xl px-6 pb-24 grid gap-16 md:grid-cols-2">
        {/* Image Left */}
        <div className="space-y-10">
          <img
            src="https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cmVjaXBlfGVufDB8fDB8fHww"
            className="rounded-xl shadow-xl w-full h-72 object-cover"
          />

          <img
            src="https://plus.unsplash.com/premium_photo-1664640733870-15cb6a5b6ee6?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dG9tYXRhZGElMjByZWNpcGV8ZW58MHx8MHx8fDA%3D"
            className="rounded-xl shadow-xl w-full h-72 object-cover"
          />
        </div>

        {/* Text Right */}
        <div className="flex flex-col justify-center">
          <h3 className="text-xl font-heading text-secondary">
            Sharing is Caring
          </h3>

          <p className="mt-4 text-dark/70 leading-relaxed font-body">
            At Tempero, we believe in the power of food, creativity, and
            community. Our mission is simple: help cooks of all levels share
            their passion, learn from others, and build meaningful culinary
            experiences.
          </p>

          <p className="mt-4 text-dark/70 leading-relaxed font-body">
            Whether you're creating your first recipe or crafting gourmet
            masterpieces, Tempero gives you the tools to express, discover, and
            inspire.
          </p>
        </div>
      </section>

      {/* Bottom Image */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <img
          src="https://plus.unsplash.com/premium_photo-1728412897938-d70e9c5becd7?q=80&w=1222&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          className="rounded-[40px] w-full h-[380px] object-cover shadow-lg"
        />
      </section>
    </div>
  );
}
