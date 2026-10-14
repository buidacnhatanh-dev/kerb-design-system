import { ProjectModal } from "./ProjectModal";

/** A portfolio page with one project card, as on design/11-PortfolioModal.png */
export function App() {
  return (
    <>
      <a href="#main" className="skip-link kerb-focusable">
        Skip to main content
      </a>
      <header className="site-header">
        <a href="#main" className="name kerb-focusable">
          Nhat Anh Bui
        </a>
        <nav aria-label="Main">
          <ul>
            <li>
              <a href="#main" className="kerb-focusable" aria-current="page">
                Work
              </a>
            </li>
            <li>
              <a href="#about" className="kerb-focusable">
                About
              </a>
            </li>
            <li>
              <a href="#contact" className="kerb-focusable">
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </header>
      <main id="main">
        <h1>Selected work</h1>
        <ul className="projects">
          <li>
            <ProjectModal />
          </li>
        </ul>
      </main>
    </>
  );
}
