const affiliateLink = "https://clickbaitpays.me/?ref=thinleo";

const videos = [
  {
    number: "01",
    eyebrow: "Start here",
    title: "ClickBaitPays in a nutshell",
    description:
      "Get the big picture first: what the platform is, who it serves, and how advertisers and participating members connect.",
    src: "https://player.vimeo.com/video/1210888620?h=46a4e2c6c8&title=0&byline=0&portrait=0",
  },
  {
    number: "02",
    eyebrow: "Plan your path",
    title: "Income strategies explained",
    description:
      "See how members think about campaigns, daily activity, referrals, and reinvesting—without skipping the important details.",
    src: "https://player.vimeo.com/video/1210888623?h=310a937e30&title=0&byline=0&portrait=0",
  },
  {
    number: "03",
    eyebrow: "Know the tools",
    title: "Back-office walkthrough",
    description:
      "Tour the member dashboard and learn where campaigns, clicks, balances, referrals, deposits, and withdrawals live.",
    src: "https://player.vimeo.com/video/1210888621?h=adb75853a1&title=0&byline=0&portrait=0",
  },
];

const resources = [
  {
    icon: "↗",
    title: "Getting Started Guide",
    description: "A practical walkthrough from account setup to first campaign.",
    href: "https://media.base44.com/files/public/6a59be82aeb9c1fbceeb9656/618d0fa01_CBPGettingStartedGuide.pdf",
  },
  {
    icon: "↗",
    title: "Growth Roadmap",
    description: "An illustrative reinvestment path using recurring campaign cycles.",
    href: "https://media.base44.com/files/public/6a59be82aeb9c1fbceeb9656/970c892b8_CBPGrowthRoadmap.pdf",
  },
  {
    icon: "↗",
    title: "Sustainability Story",
    description: "Read the platform team’s explanation of its business model.",
    href: "https://media.base44.com/files/public/6a59be82aeb9c1fbceeb9656/4a93543a4_CBPSustainabilityStory.pdf",
  },
  {
    icon: "↗",
    title: "Official FAQ",
    description: "Review current rules, timing, fees, and account requirements.",
    href: "https://clickbaitpays.me/questions.php",
  },
];

const faqs = [
  {
    question: "What is ClickBaitPays?",
    answer:
      "ClickBaitPays describes itself as a paid-to-click advertising platform. Advertisers purchase campaigns to receive traffic, while participating members purchase and activate a campaign, view funded ads, and earn USDT for eligible clicks.",
  },
  {
    question: "Can I join for free?",
    answer:
      "Account registration is free. Earning through ad activity requires purchasing an Ad Campaign and paying the activation fee for that campaign level.",
  },
  {
    question: "Do I need referrals?",
    answer:
      "No. The official FAQ says referrals are optional. Direct referrals can add a 10% commission on their eligible clicks, but your own campaign activity does not require recruiting.",
  },
  {
    question: "When do campaign earnings become available?",
    answer:
      "Current public materials describe 12 days of campaign activity followed by a 7-day hold before earnings move to Available Balance. Always confirm the current timing inside the official dashboard before purchasing.",
  },
  {
    question: "What should I know about withdrawals?",
    answer:
      "The official FAQ currently states that withdrawals have a 10 USDT minimum, carry a 10% fee, may be requested once per week, and are processed manually. Crypto transfers are generally irreversible.",
  },
  {
    question: "Can everyone in my household have an account?",
    answer:
      "Current rules allow one account per adult and up to three accounts per household. Household accounts must use the same original sponsor. Registration should be completed from a home IP without a VPN or mobile data.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="CBP with Lynn home">
          <span className="brand-mark">C</span>
          <span>
            <strong>CBP Path</strong>
            <small>with Lynn Theobald</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#videos">Videos</a>
          <a href="#resources">Resources</a>
          <a className="nav-cta" href={affiliateLink} target="_blank" rel="noopener noreferrer sponsored">
            Explore CBP <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="hero-copy">
          <p className="kicker"><span /> Your guided ClickBaitPays starting point</p>
          <h1>
            Advertise.
            <br />
            Participate.
            <br />
            <em>Build momentum.</em>
          </h1>
          <p className="hero-lead">
            Discover a crypto-powered advertising platform where members can promote
            what matters to them, view funded ads, and earn for eligible activity.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href={affiliateLink} target="_blank" rel="noopener noreferrer sponsored">
              Explore ClickBaitPays <span aria-hidden="true">↗</span>
            </a>
            <a className="button button-secondary" href="#videos">
              Watch the overview <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="microcopy">Free account registration · Campaign purchase required to earn</p>
        </div>

        <div className="hero-panel" aria-label="Your guided path">
          <div className="panel-orbit orbit-one" />
          <div className="panel-orbit orbit-two" />
          <div className="panel-center">
            <span className="panel-icon">CBP</span>
            <strong>Your path, simplified</strong>
            <small>Learn before you leap</small>
          </div>
          <div className="floating-chip chip-one"><span>01</span> Understand</div>
          <div className="floating-chip chip-two"><span>02</span> Activate</div>
          <div className="floating-chip chip-three"><span>03</span> Participate</div>
          <div className="floating-chip chip-four"><span>04</span> Decide</div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Site benefits">
        <div><strong>3</strong><span>guided videos</span></div>
        <div><strong>4</strong><span>practical resources</span></div>
        <div><strong>1:1</strong><span>sponsor support</span></div>
        <div><strong>Clear</strong><span>fees & expectations</span></div>
      </section>

      <section className="section section-intro" id="how-it-works">
        <div className="section-heading">
          <p className="kicker"><span /> The model in plain English</p>
          <h2>Know the path before<br />you take the first step.</h2>
          <p>
            ClickBaitPays combines advertising with paid participation. Here is the
            current public process—simplified, without the hype.
          </p>
        </div>
        <div className="steps-grid">
          <article>
            <span className="step-number">01</span>
            <div className="step-icon">◎</div>
            <h3>Create your account</h3>
            <p>Register through your sponsor link from your home internet connection. Avoid a VPN or mobile data.</p>
          </article>
          <article>
            <span className="step-number">02</span>
            <div className="step-icon">◇</div>
            <h3>Choose a campaign</h3>
            <p>Fund your account with crypto, purchase an advertising campaign, and pay that level’s activation fee.</p>
          </article>
          <article>
            <span className="step-number">03</span>
            <div className="step-icon">✦</div>
            <h3>Complete daily activity</h3>
            <p>View the required funded ads. Eligible clicks earn USDT based on the campaign level’s stated rate.</p>
          </article>
          <article>
            <span className="step-number">04</span>
            <div className="step-icon">↗</div>
            <h3>Use your available balance</h3>
            <p>After the stated hold, choose whether to reinvest, pay it forward, or request an eligible withdrawal.</p>
          </article>
        </div>
      </section>

      <section className="section video-section" id="videos">
        <div className="section-heading centered">
          <p className="kicker"><span /> Learn it. See it. Decide.</p>
          <h2>Your ClickBaitPays video path</h2>
          <p>Watch in order for the clearest introduction—from the core idea to the member dashboard.</p>
        </div>
        <div className="video-list">
          {videos.map((video) => (
            <article className="video-card" key={video.title}>
              <div className="video-copy">
                <span className="video-number">{video.number}</span>
                <p className="video-eyebrow">{video.eyebrow}</p>
                <h3>{video.title}</h3>
                <p>{video.description}</p>
              </div>
              <div className="video-frame">
                <iframe
                  src={video.src}
                  title={video.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section expectation-section">
        <div className="expectation-card">
          <div>
            <p className="kicker"><span /> A smarter starting point</p>
            <h2>Excitement is good.<br /><em>Clarity is better.</em></h2>
          </div>
          <div className="expectation-list">
            <div><span>12</span><p><strong>Activity days</strong><small>Described for a typical campaign cycle</small></p></div>
            <div><span>7</span><p><strong>Hold days</strong><small>Before completed earnings become available</small></p></div>
            <div><span>10%</span><p><strong>Withdrawal fee</strong><small>Based on the current official FAQ</small></p></div>
          </div>
          <p className="expectation-note">
            Program terms, campaign values, and timing can change. Confirm all current
            figures in the official ClickBaitPays dashboard before sending cryptocurrency.
          </p>
        </div>
      </section>

      <section className="section resources-section" id="resources">
        <div className="section-heading split-heading">
          <div>
            <p className="kicker"><span /> Keep learning</p>
            <h2>Your CBP resource desk</h2>
          </div>
          <p>Open the guides, compare the claims, and make an informed decision at your own pace.</p>
        </div>
        <div className="resource-grid">
          {resources.map((resource) => (
            <a key={resource.title} href={resource.href} target="_blank" rel="noopener noreferrer">
              <span className="resource-icon">{resource.icon}</span>
              <div>
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
              </div>
              <span className="resource-arrow">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="section faq-section" id="faq">
        <div className="section-heading">
          <p className="kicker"><span /> Questions worth asking</p>
          <h2>Before you join</h2>
          <p>Clear answers to the questions people usually ask after watching the videos.</p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details key={faq.question}>
              <summary>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {faq.question}
                <i aria-hidden="true">+</i>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section sponsor-section">
        <div className="sponsor-card">
          <div className="sponsor-avatar">LT</div>
          <p className="kicker"><span /> Your independent sponsor</p>
          <h2>Lynn Theobald</h2>
          <p className="sponsor-copy">
            Questions after watching the videos? Lynn can help you navigate the
            information, find the right resources, and understand the next step.
          </p>
          <div className="sponsor-actions">
            <a className="button button-primary" href={affiliateLink} target="_blank" rel="noopener noreferrer sponsored">
              Visit ClickBaitPays <span aria-hidden="true">↗</span>
            </a>
            <a className="button button-secondary" href="mailto:lynntheo@gmail.com">
              Email Lynn
            </a>
          </div>
          <div className="contact-row">
            <a href="mailto:lynntheo@gmail.com">✉ lynntheo@gmail.com</a>
            <a href="tel:80171705630">☎ 801-7170-5630</a>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <p className="kicker"><span /> Ready to explore?</p>
        <h2>Take the next step<br />with the facts in hand.</h2>
        <a className="button button-primary" href={affiliateLink} target="_blank" rel="noopener noreferrer sponsored">
          Explore ClickBaitPays with Lynn <span aria-hidden="true">↗</span>
        </a>
      </section>

      <footer>
        <div className="footer-brand">
          <span className="brand-mark">C</span>
          <div><strong>CBP Path</strong><small>with Lynn Theobald</small></div>
        </div>
        <p>
          This is an independent affiliate information site and is not operated by
          ClickBaitPays. Participation involves cryptocurrency and financial risk.
          Earnings are not guaranteed. Review official terms before participating.
        </p>
        <div className="footer-links">
          <a href="https://clickbaitpays.me/terms.php" target="_blank" rel="noopener noreferrer">Official terms</a>
          <a href="https://clickbaitpays.me/privacy.php" target="_blank" rel="noopener noreferrer">Privacy</a>
          <a href="mailto:lynntheo@gmail.com">Contact Lynn</a>
        </div>
      </footer>

      <a className="mobile-sticky" href={affiliateLink} target="_blank" rel="noopener noreferrer sponsored">
        Explore ClickBaitPays <span aria-hidden="true">↗</span>
      </a>
    </main>
  );
}
