"use client";

import { useEffect, useMemo, useState } from "react";

type TabKey = "home" | "quest" | "squad" | "rewards";
type TaskCategory = "Daily" | "Weekly" | "Campus" | "Squad";

type Task = {
  id: string;
  category: TaskCategory;
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  progress: number;
  target: number;
  rewardXp: number;
  rewardEnergy: number;
  perk: string;
  completed: boolean;
};

type SquadMember = {
  name: string;
  emoji: string;
  status: string;
  minutes: number;
};

type Reward = {
  id: string;
  title: string;
  subtitle: string;
  energyCost: number;
  label: string;
};

type Badge = {
  id: string;
  name: string;
  hint: string;
  icon: string;
  unlocked: boolean;
};

type AppState = {
  energy: number;
  xp: number;
  streak: number;
  tasks: Task[];
};

const STORAGE_KEY = "meituan-fitquest-state";
const DAILY_GOAL = 45;

const initialTasks: Task[] = [
  {
    id: "daily-walk",
    category: "Daily",
    name: "Sunrise Steps",
    description: "Complete a brisk 20-minute walk before your first class.",
    difficulty: "Easy",
    progress: 10,
    target: 20,
    rewardXp: 80,
    rewardEnergy: 35,
    perk: "Healthy breakfast coupon",
    completed: false,
  },
  {
    id: "daily-stretch",
    category: "Daily",
    name: "Dorm Stretch Combo",
    description: "Finish a 12-minute stretching routine between study blocks.",
    difficulty: "Easy",
    progress: 0,
    target: 12,
    rewardXp: 60,
    rewardEnergy: 20,
    perk: "Sports drink voucher",
    completed: false,
  },
  {
    id: "weekly-run",
    category: "Weekly",
    name: "3-Day Run Chain",
    description: "Run or jog on three separate days this week.",
    difficulty: "Medium",
    progress: 1,
    target: 3,
    rewardXp: 180,
    rewardEnergy: 70,
    perk: "Gym partner discount",
    completed: false,
  },
  {
    id: "campus-night",
    category: "Campus",
    name: "Night Track Flash",
    description: "Join the campus night run event before Sunday 21:00.",
    difficulty: "Hard",
    progress: 0,
    target: 1,
    rewardXp: 240,
    rewardEnergy: 100,
    perk: "Nearby court 20% off",
    completed: false,
  },
  {
    id: "squad-steps",
    category: "Squad",
    name: "Squad Step Burst",
    description: "Your squad reaches 28,000 total steps together today.",
    difficulty: "Medium",
    progress: 21000,
    target: 28000,
    rewardXp: 150,
    rewardEnergy: 55,
    perk: "Healthy lunch group deal",
    completed: false,
  },
];

const squadMembers: SquadMember[] = [
  { name: "Luna", emoji: "🏃", status: "Morning yoga done", minutes: 42 },
  { name: "Ming", emoji: "🚴", status: "Cycling to campus", minutes: 38 },
  { name: "Ava", emoji: "💪", status: "Strength session checked in", minutes: 34 },
  { name: "Kai", emoji: "🥤", status: "Claimed hydration perk", minutes: 26 },
];

const rewardsCatalog: Reward[] = [
  { id: "meal", title: "Healthy Meal Coupon", subtitle: "Salad, grain bowl, or light bento", energyCost: 60, label: "Meals" },
  { id: "pharmacy", title: "Meituan Pharmacy Voucher", subtitle: "Vitamins, tape, and recovery support", energyCost: 90, label: "Health" },
  { id: "drink", title: "Sports Drink Voucher", subtitle: "Hydration after class or gym", energyCost: 40, label: "Drinks" },
  { id: "venue", title: "Nearby Court Discount", subtitle: "Badminton, basketball, or indoor fitness", energyCost: 120, label: "Fitness" },
];

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "quest", label: "Quest", icon: "🎯" },
  { key: "squad", label: "Squad", icon: "👟" },
  { key: "rewards", label: "Rewards", icon: "🎁" },
];

function getLevel(xp: number) {
  return Math.floor(xp / 220) + 1;
}

function getXpInLevel(xp: number) {
  return xp % 220;
}

function getBadgeState(state: AppState): Badge[] {
  const completedCount = state.tasks.filter((task) => task.completed).length;

  return [
    {
      id: "starter",
      name: "Quest Starter",
      hint: "Complete your first quest",
      icon: "✨",
      unlocked: completedCount >= 1,
    },
    {
      id: "streak",
      name: "7-Day Rhythm",
      hint: "Maintain a 7-day movement streak",
      icon: "🔥",
      unlocked: state.streak >= 7,
    },
    {
      id: "xp",
      name: "Level Up Learner",
      hint: "Reach Level 3",
      icon: "🧠",
      unlocked: getLevel(state.xp) >= 3,
    },
    {
      id: "squad",
      name: "Squad Spark",
      hint: "Complete a squad challenge",
      icon: "🤝",
      unlocked: state.tasks.some((task) => task.category === "Squad" && task.completed),
    },
  ];
}

function formatProgress(task: Task) {
  if (task.category === "Campus") {
    return task.completed ? "Joined" : "Not joined";
  }

  if (task.category === "Squad") {
    return `${task.progress.toLocaleString()}/${task.target.toLocaleString()} steps`;
  }

  return `${task.progress}/${task.target} min`;
}

function computeTodayMinutes(tasks: Task[]) {
  return tasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + (task.category === "Squad" ? 12 : task.target), 0);
}

function getDefaultState(): AppState {
  return {
    energy: 125,
    xp: 280,
    streak: 6,
    tasks: initialTasks,
  };
}

export function FitQuestApp() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [state, setState] = useState<AppState>(getDefaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setState(JSON.parse(saved) as AppState);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const level = useMemo(() => getLevel(state.xp), [state.xp]);
  const xpInLevel = useMemo(() => getXpInLevel(state.xp), [state.xp]);
  const todayMinutes = useMemo(() => computeTodayMinutes(state.tasks), [state.tasks]);
  const todayProgress = Math.min(100, Math.round((todayMinutes / DAILY_GOAL) * 100));
  const badges = useMemo(() => getBadgeState(state), [state]);
  const unlockedBadges = badges.filter((badge) => badge.unlocked);
  const lockedBadges = badges.filter((badge) => !badge.unlocked);
  const topReward = rewardsCatalog.find((reward) => reward.energyCost <= state.energy) ?? rewardsCatalog[0];

  const groupedTasks = {
    Daily: state.tasks.filter((task) => task.category === "Daily"),
    Weekly: state.tasks.filter((task) => task.category === "Weekly"),
    Campus: state.tasks.filter((task) => task.category === "Campus"),
    Squad: state.tasks.filter((task) => task.category === "Squad"),
  };

  function completeTask(taskId: string) {
    setState((current) => {
      const task = current.tasks.find((item) => item.id === taskId);

      if (!task || task.completed) {
        return current;
      }

      return {
        ...current,
        xp: current.xp + task.rewardXp,
        energy: current.energy + task.rewardEnergy,
        streak: current.streak + 1,
        tasks: current.tasks.map((item) =>
          item.id === taskId
            ? {
                ...item,
                progress: item.target,
                completed: true,
              }
            : item
        ),
      };
    });
  }

  function resetDemo() {
    const nextState = getDefaultState();
    setState(nextState);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  return (
    <main className="app-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">Meituan FitQuest</p>
            <h1 className="text-2xl font-bold tracking-tight">Move more, unlock better days.</h1>
          </div>
          <button
            className="rounded-full border border-black/5 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
            onClick={resetDemo}
            type="button"
          >
            Reset Demo
          </button>
        </header>

        <div className="glass-card soft-grid relative overflow-hidden rounded-[30px] p-5">
          <div className="absolute right-4 top-4 rounded-full bg-[var(--yellow)]/85 px-3 py-1 text-xs font-semibold text-slate-900">
            Lv.{level}
          </div>
          <p className="text-sm font-medium text-[var(--mint-deep)]">Today&apos;s active quest</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-black tracking-tight">{todayMinutes} / {DAILY_GOAL} min</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Keep your streak alive and stack local perks.</p>
            </div>
            <div className="badge-ring rounded-[24px] bg-gradient-to-br from-[var(--mint)] to-[var(--yellow)] p-4 text-3xl">
              ⚡
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Daily progress</span>
              <span className="font-semibold text-slate-900">{todayProgress}%</span>
            </div>
            <div className="progress-track h-3 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--mint)] via-[var(--blue)] to-[var(--yellow)] transition-all duration-500"
                style={{ width: `${todayProgress}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatCard label="Current Energy" value={`${state.energy}`} accent="bg-[var(--yellow)]/20" />
            <StatCard label="Current Streak" value={`${state.streak} days`} accent="bg-[var(--coral)]/18" />
            <StatCard label="XP Progress" value={`${xpInLevel}/220 XP`} accent="bg-[var(--mint)]/20" />
            <StatCard label="Today Unlock" value={topReward.title} accent="bg-[var(--blue)]/18" />
          </div>

          <button
            className="mt-5 w-full rounded-[20px] bg-slate-950 px-4 py-4 text-sm font-semibold text-white transition hover:scale-[0.99]"
            onClick={() => setActiveTab("quest")}
            type="button"
          >
            Start Today&apos;s Quest
          </button>
        </div>

        <section className="mt-5 flex-1">
          {activeTab === "home" && (
            <div className="space-y-4">
              <Panel title="Today&apos;s unlockable Meituan perks" caption="Rewards become available as your energy rises.">
                <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                  {rewardsCatalog.map((reward) => {
                    const available = state.energy >= reward.energyCost;

                    return (
                      <div
                        key={reward.id}
                        className={`min-w-[220px] rounded-[24px] border p-4 ${
                          available
                            ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
                            : "border-slate-200 bg-white/70"
                        }`}
                      >
                        <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white">
                          {reward.label}
                        </span>
                        <h3 className="mt-3 text-base font-bold">{reward.title}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">{reward.subtitle}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-900">{reward.energyCost} energy</span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              available ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {available ? "Ready to claim" : "Locked"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Product logic" caption="A quick story behind the prototype.">
                <div className="space-y-3 text-sm leading-6 text-slate-700">
                  <LogicRow title="User pain point" body="University students often start strong, then lose exercise momentum because progress feels invisible and rewards feel distant." />
                  <LogicRow title="Core solution" body="Turn exercise into daily and weekly quests so workouts feel finite, trackable, and easier to start." />
                  <LogicRow title="Social loop" body="Friends form squads, share progress, and push team goals together, which makes consistency more fun and more accountable." />
                  <LogicRow title="Achievement loop" body="XP, levels, streaks, and badges create visible progress even before the body-change payoff arrives." />
                  <LogicRow title="Meituan ecosystem" body="After movement comes a real local-lifestyle benefit: healthy meals, pharmacy support, drinks, and nearby sports venue discounts." />
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "quest" && (
            <div className="space-y-4">
              <TaskSection title="Daily personal quests" tasks={groupedTasks.Daily} onComplete={completeTask} />
              <TaskSection title="Weekly challenge" tasks={groupedTasks.Weekly} onComplete={completeTask} />
              <TaskSection title="Limited campus challenge" tasks={groupedTasks.Campus} onComplete={completeTask} />
              <TaskSection title="Squad mission" tasks={groupedTasks.Squad} onComplete={completeTask} />
            </div>
          )}

          {activeTab === "squad" && (
            <div className="space-y-4">
              <Panel title="My squad" caption="Campus Motion Lab">
                <div className="rounded-[24px] bg-gradient-to-r from-[var(--mint)]/20 via-white to-[var(--yellow)]/25 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mint-deep)]">This week&apos;s goal</p>
                      <h3 className="mt-1 text-xl font-bold">180 active minutes</h3>
                    </div>
                    <div className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Reward pool 320 energy</div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-700">Team progress</span>
                      <span className="font-semibold">138 / 180 min</span>
                    </div>
                    <div className="progress-track h-3 rounded-full">
                      <div className="h-full w-[77%] rounded-full bg-gradient-to-r from-[var(--mint-deep)] to-[var(--yellow)]" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {squadMembers.map((member) => (
                    <div key={member.name} className="flex items-center justify-between rounded-[20px] bg-white/80 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg text-white">
                          {member.emoji}
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-[var(--muted)]">{member.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{member.minutes} min</p>
                        <p className="text-xs text-[var(--muted)]">this week</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Mini leaderboard" caption="Friendly competition only.">
                <div className="space-y-3">
                  {squadMembers
                    .slice()
                    .sort((a, b) => b.minutes - a.minutes)
                    .map((member, index) => (
                      <div key={member.name} className="flex items-center justify-between rounded-[18px] border border-slate-100 bg-white/80 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold">
                            #{index + 1}
                          </div>
                          <span className="font-semibold">{member.name}</span>
                        </div>
                        <span className="text-sm text-slate-700">{member.minutes} min</span>
                      </div>
                    ))}
                </div>
                <button className="mt-4 w-full rounded-[18px] bg-[var(--yellow)] px-4 py-3 text-sm font-semibold text-slate-900" type="button">
                  Invite Friends
                </button>
              </Panel>
            </div>
          )}

          {activeTab === "rewards" && (
            <div className="space-y-4">
              <Panel title="Energy wallet" caption="Use energy to redeem local lifestyle rewards.">
                <div className="flex items-end justify-between rounded-[24px] bg-slate-950 p-5 text-white">
                  <div>
                    <p className="text-sm text-white/70">Current energy</p>
                    <h3 className="mt-1 text-3xl font-black">{state.energy}</h3>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">Next badge at Lv. 3</div>
                </div>
              </Panel>

              <Panel title="Redeemable perks" caption="Prototype-only mock rewards">
                <div className="space-y-3">
                  {rewardsCatalog.map((reward) => {
                    const canClaim = state.energy >= reward.energyCost;

                    return (
                      <div key={reward.id} className="rounded-[22px] border border-slate-100 bg-white/80 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold">{reward.title}</h3>
                            <p className="mt-1 text-sm text-[var(--muted)]">{reward.subtitle}</p>
                          </div>
                          <span className="rounded-full bg-[var(--yellow)]/25 px-3 py-1 text-xs font-semibold text-slate-900">
                            {reward.energyCost} energy
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              canClaim ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {canClaim ? "Claimable now" : "Need more energy"}
                          </span>
                          <button
                            className={`rounded-full px-4 py-2 text-xs font-semibold ${
                              canClaim ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-500"
                            }`}
                            disabled={!canClaim}
                            type="button"
                          >
                            {canClaim ? "Claim reward" : "Locked"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Badge shelf" caption="Visible progress keeps momentum high.">
                <div className="grid grid-cols-2 gap-3">
                  {unlockedBadges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} unlocked />
                  ))}
                  {lockedBadges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} unlocked={false} />
                  ))}
                </div>
              </Panel>

              <Panel title="Check-in bonus" caption="Reward consistency, not just intensity.">
                <div className="rounded-[24px] bg-gradient-to-r from-[var(--coral)]/18 via-white to-[var(--yellow)]/25 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-700">Current streak</p>
                      <h3 className="mt-1 text-2xl font-black">{state.streak} days</h3>
                    </div>
                    <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm">
                      {state.streak >= 7 ? "Bonus unlocked" : "1 day to bonus"}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Hit a 7-day streak to unlock a bonus pharmacy or hydration voucher for recovery support.
                  </p>
                </div>
              </Panel>
            </div>
          )}
        </section>
      </div>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-white/50 bg-[rgba(255,255,255,0.88)] px-4 pb-6 pt-3 backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                className={`rounded-[18px] px-2 py-3 text-center transition ${
                  active ? "bg-slate-950 text-white shadow-lg" : "bg-white/70 text-slate-600"
                }`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <div className="text-lg">{tab.icon}</div>
                <div className="mt-1 text-[11px] font-semibold">{tab.label}</div>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

function Panel({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card rounded-[28px] p-4">
      <div className="mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{caption}</p>
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-[20px] border border-white/60 p-3 ${accent}`}>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-base font-bold leading-5">{value}</p>
    </div>
  );
}

function LogicRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[18px] bg-white/75 p-3">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

function TaskSection({
  title,
  tasks,
  onComplete,
}: {
  title: string;
  tasks: Task[];
  onComplete: (taskId: string) => void;
}) {
  return (
    <Panel title={title} caption="Clear tasks to gain XP, energy, and local perks.">
      <div className="space-y-3">
        {tasks.map((task) => {
          const progressPercent = Math.min(100, Math.round((task.progress / task.target) * 100));

          return (
            <article key={task.id} className="rounded-[24px] border border-slate-100 bg-white/85 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold">{task.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                      {task.difficulty}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{task.description}</p>
                </div>
                <span className="rounded-2xl bg-[var(--yellow)]/18 px-3 py-2 text-xs font-semibold text-slate-900">
                  +{task.rewardXp} XP
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-[18px] bg-slate-50 p-3">
                  <p className="text-slate-500">Energy reward</p>
                  <p className="mt-1 font-semibold text-slate-900">+{task.rewardEnergy}</p>
                </div>
                <div className="rounded-[18px] bg-slate-50 p-3">
                  <p className="text-slate-500">Linked perk</p>
                  <p className="mt-1 font-semibold text-slate-900">{task.perk}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-semibold text-slate-900">{formatProgress(task)}</span>
                </div>
                <div className="progress-track h-2.5 rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      task.completed ? "bg-emerald-500" : "bg-gradient-to-r from-[var(--mint)] to-[var(--yellow)]"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <button
                className={`mt-4 w-full rounded-[18px] px-4 py-3 text-sm font-semibold ${
                  task.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-950 text-white"
                }`}
                onClick={() => onComplete(task.id)}
                type="button"
              >
                {task.completed ? "Completed" : "Complete"}
              </button>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

function BadgeCard({ badge, unlocked }: { badge: Badge; unlocked: boolean }) {
  return (
    <div
      className={`rounded-[22px] p-4 ${
        unlocked
          ? "bg-gradient-to-br from-[var(--yellow)]/30 via-white to-[var(--mint)]/30"
          : "bg-slate-100/90 text-slate-400"
      }`}
    >
      <div className="text-2xl">{badge.icon}</div>
      <h3 className="mt-3 font-bold">{badge.name}</h3>
      <p className="mt-1 text-sm leading-6">{badge.hint}</p>
      <span
        className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          unlocked ? "bg-slate-950 text-white" : "bg-white text-slate-500"
        }`}
      >
        {unlocked ? "Unlocked" : "Locked"}
      </span>
    </div>
  );
}
