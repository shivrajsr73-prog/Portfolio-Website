import "./styles/Career.css";

const Career = () => {
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>YouTube Video Editor</h4>
                <h5>Food N Cure</h5>
              </div>
              <h3>2026</h3>
            </div>
            <p>
              Working as a professional YouTube video editor, creating engaging
              and high-quality content. Focused on smooth transitions, clean
              cuts, sound design, and improving viewer engagement.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Freelance Graphic Designer</h4>
                <h5>Self-Employed</h5>
              </div>
              <h3>2024 - 2025</h3>
            </div>
            <p>
              Designed digital wedding invitations and creative graphics for
              clients. Focused on elegant layouts, color combinations, and
              personalized designs.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Graphic Design & Video Editing</h4>
                <h5>Learning Phase</h5>
              </div>
              <h3>2023 - 2024</h3>
            </div>
            <p>
              Started learning graphic design and video editing tools. Worked
              on personal projects to build skills in editing, design, and
              creativity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
