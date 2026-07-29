import type { CSSProperties } from "react";

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

const growthMilestones = [
  { day: "Start", level: "Level 2", amount: 77, width: 3.21 },
  { day: "Day 76", level: "Level 3", amount: 150, width: 6.25 },
  { day: "Day 152", level: "Level 4", amount: 300, width: 12.5 },
  { day: "Day 209", level: "Level 5", amount: 600, width: 25 },
  { day: "Day 285", level: "Level 6", amount: 1200, width: 50 },
  { day: "Day 304", level: "Level 7", amount: 2400, width: 100 },
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
          <a href="#how">How it works</a>
          <a href="#roadmap">Growth roadmap</a>
          <a href="#learn">Learn more</a>
          <JoinButton label="Join now" />
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
          <div className="hero-actions">
            <JoinButton />
            <a className="text-link" href="#how">
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="fine-print">
            Free registration · Campaign purchase and activation required to earn
          </p>
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
          <span><b>✓</b> Sponsor support from Lynn</span>
          <span aria-hidden="true"><b>✓</b> Real advertising traffic</span>
          <span aria-hidden="true"><b>✓</b> Crypto-powered participation</span>
          <span aria-hidden="true"><b>✓</b> No referrals required</span>
          <span aria-hidden="true"><b>✓</b> Sponsor support from Lynn</span>
        </div>
      </section>

      <section className="section how-section" id="how">
        <div className="section-heading">
          <p className="eyebrow">The simple version</p>
          <h2>Three steps from curious to active.</h2>
        </div>
        <div className="steps">
          <article>
            <span>01</span>
            <div className="step-symbol">◎</div>
            <h3>Join through Lynn</h3>
            <p>Create your account using Lynn’s sponsor link from your home connection.</p>
          </article>
          <article>
            <span>02</span>
            <div className="step-symbol">◇</div>
            <h3>Activate a campaign</h3>
            <p>Choose an ad campaign, fund it with crypto, and pay the level’s activation fee.</p>
          </article>
          <article>
            <span>03</span>
            <div className="step-symbol">↗</div>
            <h3>View funded ads</h3>
            <p>Complete eligible daily views, then decide whether to reinvest or withdraw.</p>
          </article>
        </div>
        <div className="inline-conversion">
          <p><strong>Ready to see it for yourself?</strong> Registration takes just a few minutes.</p>
          <JoinButton />
        </div>
      </section>

      <section className="section growth-section" id="roadmap">
        <div className="growth-heading">
          <div>
            <p className="eyebrow">The roadmap, decoded</p>
            <h2>How the sample plan turns<br /><em>84 USDT into a Level 7 campaign.</em></h2>
          </div>
          <div className="growth-summary">
            <strong>16 cycles</strong>
            <span>≈ 304 days</span>
            <p>By repeatedly recycling completed campaign value instead of withdrawing it.</p>
          </div>
        </div>

        <div className="growth-visual">
          <div className="reinvestment-loop">
            <div className="loop-start">
              <small>Starting capital</small>
              <strong>84 USDT</strong>
              <span>Buys a Level 2 campaign + activation</span>
            </div>
            <div className="loop-flow" aria-label="The repeating campaign cycle">
              <div><b>1</b><span><strong>Buy</strong><small>an ad campaign</small></span></div>
              <i aria-hidden="true">→</i>
              <div><b>2</b><span><strong>Click</strong><small>for 12 days</small></span></div>
              <i aria-hidden="true">→</i>
              <div><b>3</b><span><strong>Hold</strong><small>for 7 days</small></span></div>
              <i aria-hidden="true">→</i>
              <div><b>4</b><span><strong>Recycle</strong><small>completion value</small></span></div>
            </div>
            <div className="loop-repeat">
              <span aria-hidden="true">↻</span>
              Repeat the approximately 19-day cycle
            </div>
            <p>
              The strategy compounds by buying larger or multiple campaigns with
              each completion. It assumes the member keeps reinvesting rather than
              taking money out.
            </p>
          </div>

          <div className="milestone-chart">
            <div className="chart-heading">
              <div>
                <h3>Highest campaign level purchased</h3>
                <p>Campaign purchase value by roadmap milestone</p>
              </div>
              <span>0–2,400 USDT · linear scale</span>
            </div>
            <div className="bar-list">
              {growthMilestones.map((milestone, index) => (
                <div className="bar-row" key={milestone.level}>
                  <span className="bar-day">{milestone.day}</span>
                  <span className="bar-level">{milestone.level}</span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${index === growthMilestones.length - 1 ? "bar-final" : ""}`}
                      style={{ "--bar-width": `${milestone.width}%`, "--bar-delay": `${index * 90}ms` } as CSSProperties}
                    />
                  </div>
                  <strong>{milestone.amount.toLocaleString()} USDT</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="growth-outcome">
          <div>
            <span>Day 304 position</span>
            <strong>Level 7 active</strong>
            <small>2,400 campaign + 240 activation + 535.57 remaining balance</small>
          </div>
          <div className="outcome-arrow" aria-hidden="true">→</div>
          <div className="projected-outcome">
            <span>If the Level 7 campaign completes</span>
            <strong>3,240 USDT</strong>
            <small>Projected campaign completion value before the withdrawal fee</small>
          </div>
          <div className="not-cash">
            <b>Important</b>
            This is reinvested campaign value—not a record of cash withdrawn or guaranteed profit.
          </div>
        </div>

        <details className="growth-assumptions">
          <summary>What has to go right for this sample roadmap to work?<i aria-hidden="true">+</i></summary>
          <div>
            <span>✓ All required daily ad activity is completed</span>
            <span>✓ Eligible funded ads remain available</span>
            <span>✓ Campaign values and program rules stay unchanged</span>
            <span>✓ Completion value is repeatedly reinvested</span>
            <span>✓ No early withdrawals interrupt compounding</span>
          </div>
        </details>

        <p className="growth-source">
          Source:{" "}
          <a
            href="https://media.base44.com/files/public/6a59be82aeb9c1fbceeb9656/970c892b8_CBPGrowthRoadmap.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            ClickBaitPays “84 USDT to 2,500 USDT Sample Growth Roadmap”
          </a>
          . Values are illustrative, depend on consistent activity and reinvestment,
          and are not guaranteed.
        </p>

        <div className="growth-cta">
          <p><strong>Now the roadmap makes sense.</strong> Watch the welcome video, then decide whether the strategy fits you.</p>
          <JoinButton label="Join ClickBaitPays with Lynn" />
        </div>
      </section>

      <section className="section learn-section" id="learn">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Go one layer deeper</p>
            <h2>See the strategy.<br />Know the dashboard.</h2>
          </div>
          <p>
            These two optional walkthroughs answer the questions most people have
            after the welcome video.
          </p>
        </div>

        <div className="secondary-videos">
          <article>
            <div className="small-video">
              <iframe
                src="https://player.vimeo.com/video/1210888623?h=310a937e30&title=0&byline=0&portrait=0"
                title="ClickBaitPays income strategies"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <div className="small-video-copy">
              <span>01 · Strategy</span>
              <h3>Income strategies</h3>
              <p>Campaigns, daily activity, referrals, and reinvesting explained.</p>
            </div>
          </article>
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
              <span>02 · Tour</span>
              <h3>Back-office walkthrough</h3>
              <p>See campaigns, clicks, balances, referrals, deposits, and withdrawals.</p>
            </div>
          </article>
        </div>

        <div className="key-facts" aria-label="Key ClickBaitPays facts">
          <div><strong>12</strong><span>activity days</span></div>
          <div><strong>7</strong><span>hold days</span></div>
          <div><strong>10%</strong><span>withdrawal fee</span></div>
          <p>Current public terms—always confirm inside the official dashboard.</p>
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
              <a href="mailto:lynntheo@gmail.com">lynntheo@gmail.com</a>
              <a href="tel:80171705630">801-7170-5630</a>
            </div>
          </div>
        </div>
        <div className="sponsor-action">
          <span>Ready when you are</span>
          <JoinButton label="Join ClickBaitPays with Lynn" />
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
