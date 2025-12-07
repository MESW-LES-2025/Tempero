import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-secondary/5 mt-20">
      <div className=" px-13 mx-auto py-10">
        <div className="text-center md:text-left flex flex-col sm:flex-row justify-between gap-10">
          <div>
            <h2 className="font-heading-styled text-2xl text-secondary mb-2">
              Tempero
            </h2>
            <p className="font-body text-dark/70 text-sm max-w-xs text-center md:text-left mx-auto md:mx-0">
              A community-driven platform to explore, share and enjoy delicious
              recipes.
            </p>
          </div>

          <div className="flex gap-10 md:flex-row flex-col">
            <div>
              <h3 className="font-heading text-main mb-2">Explore</h3>
              <ul className="space-y-1 font-body text-sm text-dark/80">
                <li>
                  <Link to="/lists" className="hover:text-main">
                    Lists
                  </Link>
                </li>
                <li>
                  <Link to="/search" className="hover:text-main">
                    Recipes
                  </Link>
                </li>
                <li>
                  <Link to="/favorites" className="hover:text-main">
                    Favorites
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading text-main mb-2">Support</h3>
              <ul className="space-y-1 font-body text-sm text-dark/80">
                <li>
                  <Link to="/faq" className="hover:text-main">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-main">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-dark/20 my-8"></div>

        <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="font-body text-dark/60 text-sm">
            © {new Date().getFullYear()} Tempero — Built with love by the
            Tempero Team
          </p>

          <div className="flex gap-4 mt-3 sm:mt-0">
            <a
              href="mailto:support@tempero.com"
              className="text-dark/60 hover:text-main font-body text-sm"
            >
              tempero@support.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
