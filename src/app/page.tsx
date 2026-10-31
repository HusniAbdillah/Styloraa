import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleHelp,
  Compass,
  Shirt,
  Sparkles,
} from "lucide-react";

const steps = [
  ["01", "Bring the look", "Upload the outfit that caught your eye."],
  ["02", "Review the details", "Keep the pieces you trust. Edit what you do not."],
  ["03", "Make it yours", "See considered outfit ideas built around your wardrobe."],
];

export default function Home() {
  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <Link href="/" className="brand-lockup" aria-label="Stylora home">
          <span className="brand-symbol" aria-hidden="true">✳</span>
          <span>Stylora</span>
        </Link>
        <nav aria-label="Main navigation" className="landing-links">
          <a className="landing-link landing-link-active" href="#home">Home</a>
          <a className="landing-link" href="#approach">Features</a>
          <a className="landing-link" href="#how-it-works">How it works</a>
          <a className="landing-link" href="#about">About</a>
        </nav>
        <Link className="button button-dark landing-nav-cta" href="/create">
          Get started <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </header>

      <section className="landing-hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={15} aria-hidden="true" /> A more considered way to get dressed</p>
          <h1>A considered way to get <em>dressed.</em></h1>
          <p className="hero-description">
            Start with an outfit you love. See what makes it work, what you already own,
            and thoughtful ways to make the look your own.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/create">
              <Shirt size={18} aria-hidden="true" /> Upload inspiration <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <a className="button button-outline" href="#how-it-works">
              <span className="play-mark" aria-hidden="true">▶</span> See how it works
            </a>
          </div>
          <a className="profile-nudge" href="/preferences">
            <span className="profile-nudge-mark"><Sparkles size={17} aria-hidden="true" /></span>
            <span><strong>Personal style, at your pace.</strong><br />Add optional preferences to make suggestions more personal.</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className="hero-visual" aria-label="Illustration of the Stylora outfit process">
          <div className="hero-visual-note">A look, understood.</div>
          <div className="editorial-frame">
            <div className="editorial-frame-top"><span>STYLORA STUDIO</span><span>LOOK 01</span></div>
            <div className="look-illustration" aria-hidden="true">
              <span className="look-figure-hair" />
              <span className="look-figure-body" />
              <span className="look-figure-jacket" />
              <span className="look-figure-trouser left" />
              <span className="look-figure-trouser right" />
              <span className="look-figure-bag" />
            </div>
            <div className="editorial-caption">
              <div><span className="caption-overline">THE REFERENCE</span><strong>Quiet confidence</strong></div>
              <span className="caption-number">01 / 03</span>
            </div>
          </div>
          <div className="analysis-note">
            <div className="analysis-note-head"><Sparkles size={16} aria-hidden="true" /><strong>What gives it shape</strong><span className="status-dot" /></div>
            <p>Soft layers, an easy silhouette, and a restrained neutral palette.</p>
            <div className="analysis-tags"><span>Layering</span><span>Neutral</span><span>Relaxed</span></div>
          </div>
          <div className="recommendation-note">
            <div className="recommendation-title"><span>Three ways forward</span><ArrowRight size={15} aria-hidden="true" /></div>
            <div className="mini-look-list">
              <span><i className="swatch swatch-wine" /> Closest to the look</span>
              <span><i className="swatch swatch-stone" /> From your wardrobe</span>
              <span><i className="swatch swatch-ink" /> A fresh alternative</span>
            </div>
          </div>
          <span className="hero-orbit orbit-one" aria-hidden="true" />
          <span className="hero-orbit orbit-two" aria-hidden="true" />
        </div>
      </section>

      <section className="value-strip" id="approach" aria-label="Stylora principles">
        <div><Sparkles size={21} aria-hidden="true" /><span>Understand the details</span></div>
        <div><Shirt size={21} aria-hidden="true" /><span>Start with what you own</span></div>
        <div><CircleHelp size={21} aria-hidden="true" /><span>Know why it works</span></div>
        <div><Compass size={21} aria-hidden="true" /><span>Choose your own direction</span></div>
      </section>

      <section className="process-section" id="how-it-works">
        <div className="process-intro">
          <p className="eyebrow">A clear path from save to style</p>
          <h2>Keep the inspiration.<br /><em>Make the outfit yours.</em></h2>
          <p>Stylora makes the reasoning visible, so the next step feels considered rather than guessed.</p>
        </div>
        <div className="process-list">
          {steps.map(([number, title, description]) => (
            <article className="process-row" key={number}>
              <span className="process-number">{number}</span>
              <div><h3>{title}</h3><p>{description}</p></div>
              <ArrowDownRight size={18} aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta" id="about">
        <span className="cta-kicker">Start with something you saved</span>
        <div><h2>Let’s find the pieces<br />behind the feeling.</h2><Link className="button button-paper" href="/create">Bring your inspiration <ArrowRight size={17} aria-hidden="true" /></Link></div>
        <span className="cta-seal" aria-hidden="true"><Check size={23} /></span>
      </section>
      <footer className="landing-footer"><Link href="/" className="brand-lockup"><span className="brand-symbol" aria-hidden="true">✳</span><span>Stylora</span></Link><span>Dress with intention.</span><a href="/preferences">Your style, your choice</a></footer>
    </main>
  );
}
