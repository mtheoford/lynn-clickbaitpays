import ReferralSimulator from "./ReferralSimulator";

const affiliateLink = "https://clickbaitpays.me/?ref=thinleo";

const resources = [
  {
    title: "Getting Started",
    eyebrow: "Step-by-step guide",
    href: "https://media.base44.com/files/public/6a59be82aeb9c1fbceeb9656/618d0fa01_CBPGettingStartedGuide.pdf",
  },
  {
    title: "Growth Roadmap",
    eyebrow: "Illustrative strategy",
    href: "https://media.base44.com/files/public/6a59be82aeb9c1fbceeb9656/970c892b8_CBPGrowthRoadmap.pdf",
  },
  {
    title: "Sustainability Story",
    eyebrow: "The team’s explanation",
    href: "https://media.base44.com/files/public/6a59be82aeb9c1fbceeb9656/4a93543a4_CBPSustainabilityStory.pdf",
  },
  {
    title: "Official FAQ",
    eyebrow: "Current rules & fees",
    href: "https://clickbaitpays.me/questions.php",
  },
];

const faqs = [
  {
    question: "Is joining free?",
    answer:
      "Account registration is free. Earning from eligible ad activity requires purchasing an Ad Campaign and paying that campaign level’s activation fee.",
  },
  {
    question: "Do I need referrals?",
    answer:
      "No. ClickBaitPays says referrals are optional. Direct referrals can add commission income, but members can participate through their own campaign activity.",
  },
  {
    question: "When can earnings be withdrawn?",
    answer:
      "Current public materials describe 12 days of campaign activity plus a 7-day hold. The official FAQ lists a 10 USDT withdrawal minimum, a 10% fee, and manual weekly processing. Confirm current terms in the official dashboard.",
  },
];

function JoinButton({ label = "Join ClickBaitPays" }: { label?: string }) {
  return (
    <a
      className="join-button"
      href={affiliateLink}
      target="_blank"
      rel="noopener noreferrer sponsored"
    >
      <span>{label}</span>
      <i aria-hidden="true">↗</i>
    </a>
  );
}

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="CBP with Lynn home">
          <span className="brand-mark">C</span>
          <span>
            <strong>CBP with Lynn</strong>
            <small>Independent sponsor guide</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how">Income strategy</a>
          <a href="#roadmap">Growth roadmap</a>
          <a href="#learn">Learn more</a>
          <JoinButton />
        </nav>
      </header>

      <section className="hero">
        <div className="hero-aura hero-aura-one" />
        <div className="hero-aura hero-aura-two" />

        <div className="hero-copy">
          <p className="eyebrow">
            <span className="pulse-dot" />
            Your guided ClickBaitPays introduction
          </p>
          <h1>
            Advertise.
            <br />
            Participate.
            <br />
            <em>Get rewarded.</em>
          </h1>
          <p className="hero-lead">
            Discover how ClickBaitPays connects advertisers who want attention
            with participating members who can earn USDT for eligible ad views.
          </p>
          <div className="everybody-wins" aria-label="How ClickBaitPays describes its model">
            <span><b>Advertisers</b> get traffic!</span>
            <i aria-hidden="true">+</i>
            <span><b>Viewers</b> get paid!</span>
            <i aria-hidden="true">=</i>
            <span><b>Everybody wins!</b></span>
          </div>
          <div className="hero-actions">
            <JoinButton />
            <a className="text-link" href="#how">
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="welcome-feature">
          <div className="video-callout">
            <span className="pulse-dot" />
            Start here · Welcome to ClickBaitPays
          </div>
          <div className="hero-video">
            <iframe
              src="https://player.vimeo.com/video/1210888620?h=46a4e2c6c8&title=0&byline=0&portrait=0"
              title="Welcome to ClickBaitPays"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="video-caption">
            <div>
              <strong>Watch the overview</strong>
              <span>The fastest way to understand the opportunity</span>
            </div>
            <span className="watch-cue" aria-hidden="true">▶</span>
          </div>
        </div>
      </section>

      <section className="momentum-strip" aria-label="What you will find">
        <div className="momentum-track">
          <span><b>✓</b> Real advertising traffic</span>
          <span><b>✓</b> Crypto-powered participation</span>
          <span><b>✓</b> No referrals required</span>
          <span><b>✓</b> Sponsor &amp; up-line support</span>
          <span aria-hidden="true"><b>✓</b> Real advertising traffic</span>
          <span aria-hidden="true"><b>✓</b> Crypto-powered participation</span>
          <span aria-hidden="true"><b>✓</b> No referrals required</span>
          <span aria-hidden="true"><b>✓</b> Sponsor &amp; up-line support</span>
        </div>
      </section>

      <section className="section how-section" id="how">
        <div className="strategy-feature">
          <div className="strategy-heading-wide">
            <p className="eyebrow">The strategy that changes the picture</p>
            <h2>See how campaigns and referrals can work together.</h2>
          </div>

          <div className="strategy-stage">
            <div className="strategy-video-wrap">
              <div className="strategy-video-label">
                <span className="pulse-dot" />
                Featured · Income strategies
              </div>
              <div className="strategy-video">
                <iframe
                  src="https://player.vimeo.com/video/1210888623?h=310a937e30&title=0&byline=0&portrait=0"
                  title="ClickBaitPays income strategies"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="strategy-video-footer">
                <span>Campaigns</span>
                <i aria-hidden="true">•</i>
                <span>Staggering</span>
                <i aria-hidden="true">•</i>
                <span>Direct referrals</span>
                <strong>Watch now <b aria-hidden="true">▶</b></strong>
              </div>
            </div>
            <div className="strategy-support">
              <p>
                This focused walkthrough explains the three-campaign approach,
                staggered timing, direct-referral commissions, and the choices
                members make when campaign value becomes available.
              </p>
              <JoinButton />
            </div>
          </div>
        </div>
      </section>

      <section className="section growth-section" id="roadmap">
        <div className="growth-heading">
          <div>
            <p className="eyebrow">Two ways to build momentum</p>
            <h2>Build a rhythm.<br /><em>Then grow your reach.</em></h2>
          </div>
          <div className="growth-summary">
            <strong>2 growth engines</strong>
            <span>Campaigns + direct referrals</span>
            <p>Your own campaign activity can create a foundation. Personally sponsored members can add a second stream.</p>
          </div>
        </div>

        <div className="rhythm-card">
          <div className="rhythm-copy">
            <p className="eyebrow">Engine 01 · Campaign rhythm</p>
            <h3>Stagger three campaigns.<br />Create more frequent decision points.</h3>
            <p>
              Start one campaign each week. After the initial ramp-up, the
              illustrated 12-day activity and 7-day hold cycles can create a
              release opportunity approximately every 5–7 days.
            </p>
            <div className="rhythm-facts">
              <span><b>3</b> campaign lanes</span>
              <span><b>19</b> days per illustrated cycle</span>
              <span><b>5–7</b> days between potential releases</span>
            </div>
            <p className="rhythm-caution">
              A release is not guaranteed income. At each point you choose
              whether to restart, reserve, or request a withdrawal.
            </p>
          </div>

          <div className="rhythm-timeline" aria-label="Three staggered campaign timelines">
            <div className="timeline-axis" aria-hidden="true">
              <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span><span>Week 5</span><span>Week 6</span><span>Week 7</span>
            </div>
            <div className="campaign-lane lane-a">
              <strong>A</strong><div><span className="active-block">12 days active</span><span className="hold-block">7 day hold</span><i>Release</i><span className="restart-block">Restart</span></div>
            </div>
            <div className="campaign-lane lane-b">
              <strong>B</strong><div><span className="active-block">12 days active</span><span className="hold-block">7 day hold</span><i>Release</i><span className="restart-block">Restart</span></div>
            </div>
            <div className="campaign-lane lane-c">
              <strong>C</strong><div><span className="active-block">12 days active</span><span className="hold-block">7 day hold</span><i>Release</i><span className="restart-block">Restart</span></div>
            </div>
            <div className="release-rhythm">
              <span>Ramp-up</span>
              <div><i>●</i><b>Potential release</b><i>●</i><b>Potential release</b><i>●</i><b>Potential release</b></div>
            </div>
          </div>
        </div>

        <ReferralSimulator />

        <p className="growth-source">
          Sources:{" "}
          <a
            href="https://clickbaitpays.me/questions.php"
            target="_blank"
            rel="noopener noreferrer"
          >
            Official ClickBaitPays FAQ
          </a>
          {" "}and presenter training examples. The FAQ currently states a 10%
          direct-referral commission credited per eligible click. Package totals,
          campaign timing, availability, fees, and program rules can change.
          Calculator results are illustrative—not actual or guaranteed earnings.
        </p>

        <div className="growth-cta">
          <p><strong>See the two-engine opportunity?</strong> Watch the welcome video, then choose the starting level that fits you.</p>
          <JoinButton />
        </div>
      </section>

      <section className="section learn-section" id="learn">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">See what happens after you join</p>
            <h2>Know the dashboard.</h2>
          </div>
          <p>
            Take a practical tour of the member experience, from campaign
            tracking to referrals, balances, deposits, and withdrawals.
          </p>
        </div>

        <div className="secondary-videos single-video">
          <article>
            <div className="small-video">
              <iframe
                src="https://player.vimeo.com/video/1210888621?h=adb75853a1&title=0&byline=0&portrait=0"
                title="ClickBaitPays back-office walkthrough"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <div className="small-video-copy">
              <span>Member tour</span>
              <h3>Back-office walkthrough</h3>
              <p>See campaigns, clicks, balances, referrals, deposits, and withdrawals.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="section decision-section">
        <div className="decision-grid">
          <div className="resource-panel">
            <p className="eyebrow">Fast answers</p>
            <h2>Resources worth opening</h2>
            <div className="resource-list">
              {resources.map((resource) => (
                <a href={resource.href} target="_blank" rel="noopener noreferrer" key={resource.title}>
                  <span>
                    <small>{resource.eyebrow}</small>
                    <strong>{resource.title}</strong>
                  </span>
                  <i aria-hidden="true">↗</i>
                </a>
              ))}
            </div>
          </div>

          <div className="faq-panel">
            <p className="eyebrow">Before you join</p>
            <h2>Good questions.<br />Straight answers.</h2>
            <div className="faq-list">
              {faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}<i aria-hidden="true">+</i></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sponsor-section">
        <div className="sponsor-copy">
          <div className="avatar">LT</div>
          <div>
            <p className="eyebrow">Your independent sponsor</p>
            <h2>Start with Lynn Theobald.</h2>
            <p>Questions before joining? Lynn is here to help you find the facts and take the next step with confidence.</p>
            <div className="contact-links">
              <a href="mailto:lynntheo@gmail.com">
                <i className="contact-icon" aria-hidden="true">✉</i>
                lynntheo@gmail.com
              </a>
              <a href="tel:80171705630">
                <i className="contact-icon" aria-hidden="true">☎</i>
                801-7170-5630
              </a>
            </div>
          </div>
        </div>
        <div className="sponsor-action">
          <JoinButton />
        </div>
      </section>

      <footer>
        <div className="footer-brand">
          <span className="brand-mark">C</span>
          <span><strong>CBP with Lynn</strong><small>Independent sponsor guide</small></span>
        </div>
        <p>
          Independent affiliate site—not operated by ClickBaitPays. Participation
          involves cryptocurrency and financial risk. Earnings are not guaranteed.
          Review official terms before participating.
        </p>
        <div className="footer-links">
          <a href="https://clickbaitpays.me/terms.php" target="_blank" rel="noopener noreferrer">Terms</a>
          <a href="https://clickbaitpays.me/privacy.php" target="_blank" rel="noopener noreferrer">Privacy</a>
          <a href="mailto:lynntheo@gmail.com">Contact Lynn</a>
        </div>
      </footer>

      <a
        className="mobile-join"
        href={affiliateLink}
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        Join ClickBaitPays <span aria-hidden="true">↗</span>
      </a>
    </main>
  );
}
