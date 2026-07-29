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
  const [people, setPeople] = useState(1);
  const [level, setLevel] = useState(3);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);

  const commission = useMemo(() => {
    const selected = levels.find((item) => item.id === level);
    return selected ? people * selected.commission : 0;
  }, [people, level]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
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
      triggerRef.current?.focus();
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
                  value={people}
                  onChange={(event) =>
                    setPeople(
                      Math.min(
                        100,
                        Math.max(0, Number(event.target.value) || 0),
                      ),
                    )
                  }
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

            <div className="calculator-modal-result" aria-live="polite">
              <span>Illustrative referral commission per completed round</span>
              <strong>{money.format(commission)} <small>USDT</small></strong>
              <p>
                {people === 0
                  ? "Your campaign activity remains the foundation with no referrals included."
                  : `Based on ${people} personally sponsored ${people === 1 ? "member" : "members"} at Level ${level}.`}
              </p>
            </div>

            <p className="calculator-modal-note">
              Uses the presenter-stated package examples and the official FAQ’s
              stated 10% direct-referral commission per eligible click. Program
              rules, availability, and results can change. Earnings are not
              guaranteed.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
