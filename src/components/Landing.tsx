import { CSSProperties, PropsWithChildren } from "react";
import "./styles/Landing.css";

const Landing = ({ children }: PropsWithChildren) => {
  const graphicLetters = "GRAPHIC".split("");
  const designerLetters = "DESIGNER".split("");

  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>MAYANK</h1>
          </div>
          <div className="landing-info">
            <h3>A Creative</h3>
            <div className="landing-role-wrap">
              <div className="landing-role-back" aria-hidden="true">
                {graphicLetters.map((letter, index) => (
                  <span
                    className="landing-role-letter"
                    key={`graphic-${letter}-${index}`}
                    style={{ ["--i" as string]: index } as CSSProperties}
                  >
                    {letter}
                  </span>
                ))}
              </div>
              <div className="landing-role-front" aria-label="DESIGNER">
                {designerLetters.map((letter, index) => (
                  <span
                    className="landing-role-front-letter"
                    key={`designer-${letter}-${index}`}
                    style={{ animationDelay: `${0.45 + index * 0.11}s` } as CSSProperties}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
