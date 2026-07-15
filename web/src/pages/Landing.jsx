import { useNavigate } from 'react-router-dom'
import './Landing.css'

// Landing page: the site's front door. Clicking "Get Started" takes the
// user straight into the IOCF Dashboard (the real central hub - not
// another landing page).
export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <div className="landing__bg">
        <div className="landing__floodlight landing__floodlight--1" />
        <div className="landing__floodlight landing__floodlight--2" />
        <div className="landing__stadium-ring" />
        <div className="landing__particles">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ '--i': i }} />
          ))}
        </div>
      </div>

      <div className="landing__content">
        <span className="landing__badge">International Online Cricket Federation</span>
        <h1 className="landing__title gradient-heading">
          Welcome to the<br />IOCF Universe
        </h1>
        <p className="landing__subtitle text-dim">
          The Ultimate Virtual Cricket Management Platform — Boards, Players, Stadiums,
          Tournaments &amp; Rankings, all in one command center.
        </p>
        <button className="btn btn-primary landing__cta" onClick={() => navigate('/dashboard')}>
          Get Started
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}
