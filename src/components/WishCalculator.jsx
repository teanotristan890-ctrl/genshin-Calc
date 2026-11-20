import { useMemo, useState } from "react";
import {
  COMMISSION_PRIMOS,
  HARD_PITY,
  PRIMOS_PER_PULL,
  SOFT_PITY,
  WELKIN_PRIMOS,
  computeStats,
} from "../lib/wishMath";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt = (n) => n.toLocaleString("en-US");
const pct = (p) => (p >= 0.9995 ? "100%" : `${(p * 100).toFixed(1)}%`);

const starfield = {
  backgroundColor: "#0a0a0a",
  backgroundImage: [
    "radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,.5), transparent)",
    "radial-gradient(1px 1px at 130px 85px, rgba(255,255,255,.3), transparent)",
    "radial-gradient(1.5px 1.5px at 210px 150px, rgba(255,255,255,.4), transparent)",
    "radial-gradient(1px 1px at 70px 175px, rgba(255,255,255,.35), transparent)",
    "radial-gradient(ellipse at 50% -10%, rgba(255,255,255,.07), transparent 60%)",
  ].join(","),
  backgroundSize:
    "233px 197px, 241px 203px, 257px 211px, 229px 191px, 100% 100%",
};

const hatch = {
  backgroundImage:
    "repeating-linear-gradient(135deg, rgba(255,255,255,.14) 0 2px, transparent 2px 7px)",
};

const BADGE = {
  solid: "bg-white text-neutral-950 border-white",
  outline: "border-neutral-600 text-neutral-200",
  muted: "border-neutral-800 text-neutral-400",
};

const PAGE_CSS = `
  html, body { margin: 0; background: #0a0a0a; }
  body { display: block; min-width: 0; min-height: 0; }
  #root { max-width: none; margin: 0; padding: 0; text-align: left; }
  html { scrollbar-width: thin; scrollbar-color: #404040 #0a0a0a; }
  html::-webkit-scrollbar { width: 10px; }
  html::-webkit-scrollbar-track { background: #0a0a0a; }
  html::-webkit-scrollbar-thumb { background: #404040; border-radius: 9999px; border: 2px solid #0a0a0a; }
  html::-webkit-scrollbar-thumb:hover { background: #737373; }
`;

function Badge({ variant = "muted", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE[variant]}`}
    >
      {children}
    </span>
  );
}

function Panel({ title, right, children, className = "" }) {
  return (
    <section
      className={`flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm ${className}`}
    >
      {(title || right) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-neutral-300">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
  sliderMax,
  sliderStep = 1,
  stepBy = 1,
  hint,
}) {
  const sMax = sliderMax ?? max ?? 100;
  const upper = max ?? Infinity;
  const [draft, setDraft] = useState(null);
  const step = (dir) => {
    setDraft(null);
    onChange(clamp(value + dir * stepBy, min, upper));
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm text-neutral-200">{label}</label>
        <div className="flex items-center overflow-hidden rounded-lg border border-neutral-700 bg-neutral-950 transition focus-within:border-neutral-400">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={value <= min}
            aria-label={`Decrease ${label}`}
            className="flex h-8 w-8 items-center justify-center text-lg leading-none text-neutral-400 transition hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          >
            −
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={draft ?? String(value)}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              if (raw === "") {
                setDraft("");
                onChange(min);
                return;
              }
              const n = clamp(Number(raw), min, upper);
              setDraft(String(n));
              onChange(n);
            }}
            onBlur={() => setDraft(null)}
            className="h-8 w-20 border-x border-neutral-800 bg-transparent px-1 text-center text-sm tabular-nums text-white outline-none"
          />
          <button
            type="button"
            onClick={() => step(1)}
            disabled={value >= upper}
            aria-label={`Increase ${label}`}
            className="flex h-8 w-8 items-center justify-center text-lg leading-none text-neutral-400 transition hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          >
            +
          </button>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={sMax}
        step={sliderStep}
        value={Math.min(value, sMax)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full cursor-pointer accent-white"
        aria-label={label}
      />
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-neutral-800 bg-neutral-950 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            value === o.value
              ? "bg-white text-neutral-950"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SwitchRow({ label, sub, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-left transition hover:border-neutral-600"
    >
      <span>
        <span className="block text-sm text-neutral-100">{label}</span>
        <span className="block text-xs text-neutral-500">{sub}</span>
      </span>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition ${
          checked ? "bg-white" : "bg-neutral-700"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full transition-all ${
            checked ? "left-5 bg-neutral-950" : "left-1 bg-neutral-300"
          }`}
        />
      </span>
    </button>
  );
}

function StatCard({ label, value, sub, badge }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm">
      <div className="flex min-h-[24px] items-center justify-between gap-2">
        <p className="text-sm text-neutral-400">{label}</p>
        {badge}
      </div>
      <p className="mt-3 text-5xl font-semibold tabular-nums tracking-tight text-white">
        {value}
      </p>
      <p className="mt-3 text-sm leading-snug text-neutral-500">{sub}</p>
    </div>
  );
}

function PityBar({ pity, effective }) {
  const at = (n) => `${(clamp(n, 0, HARD_PITY) / HARD_PITY) * 100}%`;
  const softLeft = (SOFT_PITY / HARD_PITY) * 100;
  return (
    <div>
      <div className="relative h-5 overflow-hidden rounded-full border border-neutral-800 bg-neutral-950">
        <div
          className="absolute inset-y-0"
          style={{
            left: `${softLeft}%`,
            width: `${100 - softLeft}%`,
            ...hatch,
          }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/25 transition-all duration-500"
          style={{ width: at(effective) }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white transition-all duration-500"
          style={{ width: at(pity) }}
        />
        <div
          className="absolute inset-y-0 w-px bg-neutral-500"
          style={{ left: `${softLeft}%` }}
        />
        <div className="absolute inset-y-0 right-0 w-1 bg-white" />
      </div>
      <div className="relative mt-2 h-5 text-xs text-neutral-500">
        <span className="absolute left-0">0</span>
        <span
          className="absolute -translate-x-1/2 text-neutral-300"
          style={{ left: `${softLeft}%` }}
        >
          {SOFT_PITY} · soft
        </span>
        <span className="absolute right-0 text-neutral-300">
          {HARD_PITY} · hard
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-neutral-500">
        <Legend swatch="bg-white" label="Current pity" />
        <Legend swatch="bg-white/25" label="After your pulls" />
        <Legend
          swatch="border border-neutral-600"
          style={hatch}
          label="Soft pity (74–89)"
        />
        <Legend swatch="bg-white" label="Hard pity (90)" />
      </div>
    </div>
  );
}

function Legend({ swatch, label, style }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${swatch}`} style={style} />
      {label}
    </span>
  );
}

export default function WishCalculator() {
  const [pity, setPity] = useState(42);
  const [guaranteed, setGuaranteed] = useState(false);
  const [primogems, setPrimogems] = useState(6400);
  const [fates, setFates] = useState(12);
  const [commissions, setCommissions] = useState(true);
  const [welkin, setWelkin] = useState(true);

  const s = useMemo(
    () =>
      computeStats({ pity, guaranteed, primogems, fates, commissions, welkin }),
    [pity, guaranteed, primogems, fates, commissions, welkin],
  );

  const guaranteedReady = s.totalPulls >= s.hardFeatured;
  const probBadge = guaranteedReady
    ? { variant: "solid", text: "Guaranteed" }
    : s.featuredChance >= 0.75
      ? { variant: "outline", text: "Very likely" }
      : s.featuredChance >= 0.4
        ? { variant: "outline", text: "Coin flip" }
        : { variant: "muted", text: "Unlikely" };

  const softActive = pity + 1 >= SOFT_PITY;
  const coverage = clamp(s.totalPulls / s.hardFeatured, 0, 1);

  const milestones = guaranteed
    ? [
        { label: "Soft pity (pull 74)", need: s.softNext },
        { label: "Hard pity · guaranteed featured", need: s.hardFeatured },
      ]
    : [
        { label: "Soft pity · next 5★", need: s.softNext },
        { label: "Hard pity · next 5★", need: s.hardNext },
        {
          label: "Soft pity · featured, if you lose the 50/50",
          need: s.softFeatured,
        },
        {
          label: "Hard pity · guaranteed featured (max 180)",
          need: s.hardFeatured,
        },
      ];

  const daysValue =
    s.daysToHardPity === null
      ? "—"
      : s.daysToHardPity === 0
        ? "0"
        : fmt(s.daysToHardPity);
  const daysSub =
    s.daysToHardPity === 0
      ? "You already have enough for a guaranteed featured 5★."
      : s.daysToHardPity === null
        ? "Turn on Commissions or Welkin to estimate days."
        : `${fmt(s.shortfallPulls)} more pulls (${fmt(s.primosNeeded)} primogems) at ${s.dailyIncome} a day`;

  return (
    <div
      className="min-h-screen w-full text-left text-neutral-100 antialiased"
      style={starfield}
    >
      <style>{PAGE_CSS}</style>
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 pb-8 pt-6 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">
              Genshin Impact · Character Event Wish
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Pity &amp; Primogem Planner
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {guaranteed ? "Guaranteed" : "50/50"}
            </Badge>
            <Badge variant={softActive ? "solid" : "muted"}>
              {softActive ? "Soft pity active" : "Base rate"}
            </Badge>
          </div>
        </header>

        <main className="mt-6 grid flex-1 grid-cols-1 gap-5 lg:grid-cols-12">
          <Panel title="Your account" className="lg:col-span-4">
            <div className="flex flex-1 flex-col justify-between gap-6">
              <NumberField
                label="Current pity"
                value={pity}
                onChange={setPity}
                min={0}
                max={HARD_PITY - 1}
                hint="Pulls since your last 5★ on the character banner (0–89)."
              />

              <div>
                <p className="mb-2 text-sm text-neutral-200">50/50 status</p>
                <Segmented
                  value={guaranteed}
                  onChange={setGuaranteed}
                  options={[
                    { value: false, label: "50/50" },
                    { value: true, label: "Guaranteed" },
                  ]}
                />
              </div>

              <NumberField
                label="Primogems"
                value={primogems}
                onChange={setPrimogems}
                min={0}
                sliderMax={30000}
                sliderStep={PRIMOS_PER_PULL}
                stepBy={PRIMOS_PER_PULL}
                hint={`${PRIMOS_PER_PULL} primogems = 1 pull`}
              />

              <NumberField
                label="Intertwined Fates"
                value={fates}
                onChange={setFates}
                min={0}
                sliderMax={100}
              />

              <div>
                <p className="mb-2 text-sm text-neutral-200">Daily income</p>
                <div className="space-y-2">
                  <SwitchRow
                    label="Daily Commissions"
                    sub={`${COMMISSION_PRIMOS} primogems a day`}
                    checked={commissions}
                    onChange={setCommissions}
                  />
                  <SwitchRow
                    label="Blessing of the Welkin Moon"
                    sub={`${WELKIN_PRIMOS} primogems a day`}
                    checked={welkin}
                    onChange={setWelkin}
                  />
                </div>
              </div>
            </div>
          </Panel>

          <div className="flex flex-col gap-5 lg:col-span-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <StatCard
                label="Featured 5★ chance"
                value={pct(s.featuredChance)}
                sub={`Within ${fmt(s.totalPulls)} pulls · any 5★: ${pct(s.anyChance)}`}
                badge={
                  <Badge variant={probBadge.variant}>{probBadge.text}</Badge>
                }
              />
              <StatCard
                label="Pulls ready"
                value={fmt(s.totalPulls)}
                sub={`${fmt(Math.floor(primogems / PRIMOS_PER_PULL))} from primogems + ${fmt(fates)} fates`}
              />
              <StatCard
                label="Days to hard pity"
                value={daysValue}
                sub={daysSub}
                badge={
                  s.dailyIncome > 0 ? (
                    <Badge variant="muted">{s.dailyIncome}/day</Badge>
                  ) : null
                }
              />
            </div>

            <Panel
              title="Pity progress"
              right={
                <span className="text-sm text-neutral-500">
                  Effective position{" "}
                  <span className="font-medium tabular-nums text-white">
                    {pity} + {fmt(s.totalPulls)} = {fmt(s.effectivePity)}
                  </span>
                </span>
              }
            >
              <PityBar pity={pity} effective={s.effectivePity} />

              <div className="mt-6 border-t border-neutral-800 pt-5">
                <div className="flex items-center justify-between text-sm text-neutral-500">
                  <span>
                    Progress to guaranteed featured (
                    {guaranteed ? "max 90" : "max 180"})
                  </span>
                  <span className="tabular-nums text-neutral-200">
                    {fmt(s.totalPulls)} / {fmt(s.hardFeatured)} pulls
                  </span>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${coverage * 100}%` }}
                  />
                </div>
              </div>
            </Panel>

            <Panel title="Pull milestones" className="flex-1">
              <ul className="divide-y divide-neutral-800">
                {milestones.map((m) => {
                  const reached = s.totalPulls >= m.need;
                  return (
                    <li
                      key={m.label}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="text-neutral-300">{m.label}</span>
                      <span className="flex items-center gap-3">
                        <span className="tabular-nums text-neutral-100">
                          {fmt(m.need)} pulls
                        </span>
                        {reached ? (
                          <Badge variant="solid">Reached</Badge>
                        ) : (
                          <Badge variant="muted">
                            {fmt(m.need - s.totalPulls)} short
                          </Badge>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-neutral-600">
                Rates: 0.6% base (pulls 1–73), +6% per pull in soft pity
                (74–89), 100% at 90. The 50/50 is modeled as a flat 50% coin
                flip.
              </p>
            </Panel>
          </div>
        </main>

        <footer className="mt-8 border-t border-neutral-800 pt-6 text-center text-xs leading-relaxed text-neutral-600">
          <p>
            Unofficial fan-made calculator. Not affiliated with or endorsed by
            HoYoverse.
          </p>
          <p className="mt-1">
            © All rights reserved by COGNOSPHERE. Genshin Impact and all related
            assets, names, and trademarks belong to HoYoverse / COGNOSPHERE.
          </p>
        </footer>
      </div>
    </div>
  );
}
