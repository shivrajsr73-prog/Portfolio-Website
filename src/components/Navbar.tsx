import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import "./styles/Navbar.css";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);
export let smoother: ScrollSmoother | undefined;

const Navbar = () => {
  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1025px)");
    const links = Array.from(
      document.querySelectorAll(".header ul a")
    ) as HTMLAnchorElement[];

    const handleLinkClick = (e: Event) => {
      if (!desktopQuery.matches || !smoother) {
        return;
      }

      e.preventDefault();
      const elem = e.currentTarget as HTMLAnchorElement;
      const section = elem.getAttribute("data-href");
      if (section) {
        smoother.scrollTo(section, true, "top top");
      }
    };

    const setupSmoother = () => {
      if (!desktopQuery.matches) {
        smoother?.kill();
        smoother = undefined;
        ScrollTrigger.getAll().forEach((trigger) => trigger.refresh());
        return;
      }

      if (!smoother) {
        smoother = ScrollSmoother.create({
          wrapper: "#smooth-wrapper",
          content: "#smooth-content",
          smooth: 1.7,
          speed: 1.7,
          effects: true,
          autoResize: true,
          ignoreMobileResize: true,
        });
      }

      smoother.scrollTop(0);
      smoother.paused(true);
      ScrollSmoother.refresh(true);
    };

    const handleResize = () => {
      setupSmoother();
    };

    setupSmoother();
    links.forEach((link) => link.addEventListener("click", handleLinkClick));
    window.addEventListener("resize", handleResize);

    return () => {
      links.forEach((link) =>
        link.removeEventListener("click", handleLinkClick)
      );
      window.removeEventListener("resize", handleResize);
      smoother?.kill();
      smoother = undefined;
    };
  }, []);
  return (
    <>
      <div className="header">
        <a href="/#" className="navbar-title" data-cursor="disable">
          Logo
        </a>
        <a
          href="mailto:mayank.jp2005@gmail.com"
          className="navbar-connect"
          data-cursor="disable"
        >
          mayank.jp2005@gmail.com
        </a>
        <ul>
          <li>
            <a data-href="#about" href="#about">
              <HoverLinks text="ABOUT" />
            </a>
          </li>
          <li>
            <a data-href="#work" href="#work">
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li>
            <a data-href="#contact" href="#contact">
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
