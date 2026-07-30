"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Level = {
  id: number;
  campaign: number;
  commission: number;
};

const levels: Level[] = [
  { id: 1, campaign: 13, commission: 1.72 },
  { id: 2, campaign: 77, commission: 11.3 },
  { id: 3, campaign: 150, commission: 21.6 },
  { id: 4, campaign: 300, commission: 43.2 },
  { id: 5, campaign: 600, commission: 86.4 },
  { id: 6, campaign: 1200, commission: 172.8 },
  { id: 7, campaign: 2400, commission: 324 },
];

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function ReferralSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [peopleInput, setPeopleInput] = useState("1");
  const [level, setLevel] = useState(3);
  const [useStagger, setUseStagger] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const people = Math.min(100, Math.max(0, Number(peopleInput) || 0));

  const commission = useMemo(() => {
    const selected = levels.find((item) => item.id === level);
    return selected ? people * selected.commission : 0;
  }, [people, level]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const triggerElement = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key === "Tab" && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            "button, input, select, [href], [tabindex]:not([tabindex='-1'])",
          ),
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [isOpen]);

  return (
    <div className="calculator-launch" id="calculator">
      <button
        ref={triggerRef}
        type="button"
        className="calculator-launch-button"
        onClick={() => setIsOpen(true)}
      >
        Calculate referral potential <span aria-hidden="true">↗</span>
      </button>

      {isOpen && (
        <div
          className="calculator-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            ref={modalRef}
            className="calculator-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calculator-title"
          >
            <button
              ref={closeRef}
              type="button"
              className="calculator-modal-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close referral calculator"
            >
              ×
            </button>

            <p className="eyebrow">Optional referral calculator</p>
            <h2 id="calculator-title">Explore what referrals could add.</h2>
            <p className="calculator-modal-intro">
              Referrals are not required. This calculator simply illustrates
              the additional commission personally sponsored members could
              contribute.
            </p>

            <div className="calculator-modal-fields">
              <label>
                <span>People you personally refer</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={peopleInput}
                  onFocus={(event) => event.currentTarget.select()}
                  onBlur={() => {
                    if (peopleInput === "") setPeopleInput("0");
                  }}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (nextValue === "") {
                      setPeopleInput("");
                      return;
                    }

                    const withoutLeadingZeros = nextValue.replace(
                      /^0+(?=\d)/,
                      "",
                    );
                    const clamped = Math.min(
                      100,
                      Math.max(0, Number(withoutLeadingZeros) || 0),
                    );
                    setPeopleInput(String(clamped));
                  }}
                />
              </label>
              <label>
                <span>Campaign level for each person</span>
                <select
                  value={level}
                  onChange={(event) => setLevel(Number(event.target.value))}
                >
                  {levels.map((item) => (
                    <option value={item.id} key={item.id}>
                      Level {item.id} · {item.campaign.toLocaleString()} USDT
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="stagger-option">
              <input
                type="checkbox"
                checked={useStagger}
                onChange={(event) => setUseStagger(event.target.checked)}
              />
              <span className="stagger-option-control" aria-hidden="true">
                <i />
              </span>
              <span className="stagger-option-copy">
                <strong>Model the 3-campaign weekly stagger</strong>
                <small>
                  Each person starts one campaign per week for three weeks.
                </small>
              </span>
            </label>

            <div className="calculator-modal-result" aria-live="polite">
              <span>
                {useStagger
                  ? "Illustrative referral payout per week after ramp-up"
                  : "Illustrative referral commission per completed round"}
              </span>
              <strong>{money.format(commission)} <small>USDT</small></strong>
              <p>
                {people === 0
                  ? "Your campaign activity remains the foundation with no referrals included."
                  : useStagger
                    ? `Based on ${people} personally sponsored ${people === 1 ? "member" : "members"}, each running three Level ${level} campaigns started one week apart.`
                    : `Based on ${people} personally sponsored ${people === 1 ? "member" : "members"} at Level ${level}.`}
              </p>

              {useStagger && (
                <div className="stagger-timeline" aria-label="Three-week stagger illustration">
                  <div>
                    <span>Week 1</span>
                    <strong>Start #1</strong>
                    <small>Ramp-up</small>
                  </div>
                  <div>
                    <span>Week 2</span>
                    <strong>Start #2</strong>
                    <small>Ramp-up</small>
                  </div>
                  <div>
                    <span>Week 3</span>
                    <strong>Start #3</strong>
                    <small>First payout window</small>
                  </div>
                  <div className="stagger-timeline-ongoing">
                    <span>Then weekly</span>
                    <strong>{money.format(commission)} USDT</strong>
                    <small>Approximately every 5–7 days</small>
                  </div>
                </div>
              )}
            </div>

            <p className="calculator-modal-note">
              Uses the presenter-stated package examples and the official FAQ’s
              stated 10% direct-referral commission per eligible click. Program
              rules, timing, availability, and results can change. Weekly
              stagger results are an illustration, not guaranteed payouts.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
