"use client";

import { useEffect, useMemo, useState } from "react";

type TabKey = "home" | "quest" | "community" | "squad" | "rewards" | "profile";
type CommunityTab = "following" | "discover";
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

type CommunityPost = {
  id: string;
  title: string;
  author: string;
  avatar: string;
  likes: number;
  coverTag: string;
  coverEmoji: string;
  coverClassName: string;
  summary: string;
  content: string;
  following: boolean;
};

type Comment = {
  id: string;
  author: string;
  avatar: string;
  content: string;
  likes: number;
};

type AppState = {
  energy: number;
  xp: number;
  streak: number;
  tasks: Task[];
  claimedRewardIds: string[];
};

const STORAGE_KEY = "meituan-fitquest-state";
const DAILY_GOAL = 45;

const initialTasks: Task[] = [
  {
    id: "daily-walk",
    category: "Daily",
    name: "晨光步数挑战",
    description: "第一节课前完成 20 分钟快走，轻松把今天的状态拉起来。",
    difficulty: "Easy",
    progress: 10,
    target: 20,
    rewardXp: 80,
    rewardEnergy: 35,
    perk: "轻食早餐券",
    completed: false,
  },
  {
    id: "daily-stretch",
    category: "Daily",
    name: "宿舍舒展一下",
    description: "在两段学习间隙完成 12 分钟拉伸，久坐党也能轻松完成。",
    difficulty: "Easy",
    progress: 0,
    target: 12,
    rewardXp: 60,
    rewardEnergy: 20,
    perk: "运动饮品券",
    completed: false,
  },
  {
    id: "weekly-run",
    category: "Weekly",
    name: "本周三练打卡",
    description: "本周在 3 天内完成跑步或慢跑，稳稳建立运动节奏。",
    difficulty: "Medium",
    progress: 1,
    target: 3,
    rewardXp: 180,
    rewardEnergy: 70,
    perk: "双人运动馆优惠",
    completed: false,
  },
  {
    id: "campus-night",
    category: "Campus",
    name: "操场夜跑限时局",
    description: "周日 21:00 前参与一次校园夜跑活动，解锁更高奖励。",
    difficulty: "Hard",
    progress: 0,
    target: 1,
    rewardXp: 240,
    rewardEnergy: 100,
    perk: "附近场馆 8 折券",
    completed: false,
  },
  {
    id: "squad-steps",
    category: "Squad",
    name: "小队步数冲刺",
    description: "今天和队友一起累计 28000 步，把小队进度条直接推满。",
    difficulty: "Medium",
    progress: 21000,
    target: 28000,
    rewardXp: 150,
    rewardEnergy: 55,
    perk: "轻食午餐拼单券",
    completed: false,
  },
];

const squadMembers: SquadMember[] = [
  { name: "Luna", emoji: "🏃", status: "晨间瑜伽已完成", minutes: 88 },
  { name: "Ming", emoji: "🚴", status: "骑车去上课中", minutes: 76 },
  { name: "Ava", emoji: "💪", status: "力量训练已打卡", minutes: 68 },
  { name: "Kai", emoji: "🥤", status: "已领取补水权益", minutes: 54 },
];

const rewardsCatalog: Reward[] = [
  { id: "meal", title: "轻食餐券", subtitle: "沙拉、能量碗、轻食便当都可用", energyCost: 60, label: "健康餐" },
  { id: "pharmacy", title: "美团买药关怀券", subtitle: "维生素、肌贴、恢复类商品都能用", energyCost: 90, label: "医药健康" },
  { id: "drink", title: "运动饮品券", subtitle: "下课后、训练后都能随手补水", energyCost: 40, label: "饮品" },
  { id: "venue", title: "附近运动场馆优惠券", subtitle: "羽毛球、篮球、室内健身都适用", energyCost: 120, label: "运动场馆" },
  { id: "indulgence", title: "放纵餐快乐券", subtitle: "火锅、炸鸡、汉堡，给坚持一点快乐回礼", energyCost: 150, label: "快乐奖励" },
  { id: "点评", title: "大众点评健康餐厅套餐券", subtitle: "校园附近高分轻食店限时可兑", energyCost: 110, label: "点评联动" },
];

const communityPosts: CommunityPost[] = [
  {
    id: "post-run",
    title: "晚上跑完 6 公里，操场风真的太舒服了",
    author: "Luna",
    avatar: "L",
    likes: 1289,
    coverTag: "跑步",
    coverEmoji: "🏃",
    coverClassName: "from-orange-100 via-amber-50 to-yellow-100",
    summary: "夜跑真的很适合在学习后重启大脑，节奏稳一点，整个人都会松下来。",
    content: "今天晚饭后去操场跑了 6 公里，前两圈只想放弃，后面进入节奏后特别舒服。最近我给自己定的目标不是配速，而是稳定去跑。坚持比速度更重要，跑完顺手把 FitQuest 任务也完成了。",
    following: true,
  },
  {
    id: "post-bike",
    title: "校园骑行 18km 路线分享，适合新手",
    author: "Ming",
    avatar: "M",
    likes: 976,
    coverTag: "骑行",
    coverEmoji: "🚴",
    coverClassName: "from-sky-100 via-cyan-50 to-teal-100",
    summary: "这条路基本没什么大坡，新手也能轻松骑完全程。",
    content: "把今天骑的校园周边路线整理出来了，18km 刚刚好，不会太累，也很适合周末早起打卡。建议带一瓶补水饮料，回来顺手去美团兑一张运动饮品券，体验非常完整。",
    following: false,
  },
  {
    id: "post-basketball",
    title: "篮球局打满两小时，体能提升太明显了",
    author: "Ava",
    avatar: "A",
    likes: 1532,
    coverTag: "篮球",
    coverEmoji: "🏀",
    coverClassName: "from-rose-100 via-orange-50 to-amber-100",
    summary: "连续训练三周后，第四节明显没那么喘了，运动反馈真的会上头。",
    content: "今天和朋友打了两小时全场，感觉最近的体能储备真的上来了。以前打到后半段只想站着，现在还能继续回防。FitQuest 这种把日常运动拆成任务的方式，对我这种需要目标感的人特别友好。",
    following: true,
  },
  {
    id: "post-food",
    title: "宿舍党也能做的健身餐：鸡胸肉饭盒",
    author: "Yuki",
    avatar: "Y",
    likes: 842,
    coverTag: "健身餐",
    coverEmoji: "🥗",
    coverClassName: "from-emerald-100 via-lime-50 to-yellow-50",
    summary: "鸡胸肉、玉米、鸡蛋和米饭，简单但很顶饱，复刻门槛很低。",
    content: "这份健身餐真的很适合学生党，准备快，成本也低。运动后马上补一点碳水和蛋白质，恢复会舒服很多。配合美团轻食餐券，外卖和自己做都能形成很顺的生活习惯。",
    following: false,
  },
  {
    id: "post-football",
    title: "足球野场开踢，周末最期待的 90 分钟",
    author: "Kai",
    avatar: "K",
    likes: 1104,
    coverTag: "足球",
    coverEmoji: "⚽",
    coverClassName: "from-green-100 via-emerald-50 to-cyan-100",
    summary: "对我来说最强的运动动力，不是自律，是有人一起踢。",
    content: "周末足球局真的是我的快乐来源。只要有人约，我基本不会鸽。小队任务的存在也很妙，本来只是去踢球，结果顺便还能拉着朋友一起冲任务和奖励，参与感更完整。",
    following: true,
  },
  {
    id: "post-gym",
    title: "腿日训练后别忘了拉伸，第二天真的差很多",
    author: "Rico",
    avatar: "R",
    likes: 1321,
    coverTag: "健身",
    coverEmoji: "🏋️",
    coverClassName: "from-violet-100 via-fuchsia-50 to-rose-100",
    summary: "十分钟拉伸虽然不起眼，但能明显减轻第二天酸痛感。",
    content: "今天练腿练得很狠，但我最想提醒的是一定要拉伸。很多人不是不能练，而是练完第二天难受就中断了。把恢复也算进任务体验里，其实很适合校园用户的节奏。",
    following: false,
  },
];

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: "home", label: "首页", icon: "🏠" },
  { key: "quest", label: "任务", icon: "🎯" },
  { key: "community", label: "社区", icon: "🏋️" },
  { key: "squad", label: "小队", icon: "👟" },
  { key: "rewards", label: "奖励", icon: "🎁" },
  { key: "profile", label: "我的", icon: "🙂" },
];

const postComments: Record<string, Comment[]> = {
  "post-run": [
    { id: "c1", author: "阿福", avatar: "阿", content: "这个配速真的很舒服，夜跑党狠狠共鸣。", likes: 82 },
    { id: "c2", author: "小乔", avatar: "乔", content: "操场风一吹，跑步的痛苦瞬间减半。", likes: 46 },
    { id: "c3", author: "Ming", avatar: "M", content: "明天一起冲 8 公里吗？", likes: 21 },
  ],
  "post-bike": [
    { id: "c4", author: "Luna", avatar: "L", content: "这条线我骑过，风景真的不错。", likes: 33 },
    { id: "c5", author: "Yuki", avatar: "Y", content: "适合新手这个太重要了，已收藏。", likes: 18 },
  ],
  "post-basketball": [
    { id: "c6", author: "Kai", avatar: "K", content: "打满两小时还能回防，体能确实上来了。", likes: 58 },
    { id: "c7", author: "Rico", avatar: "R", content: "篮球真的是最快乐的有氧。", likes: 27 },
  ],
  "post-food": [
    { id: "c8", author: "Nora", avatar: "N", content: "这个搭配看起来就很适合训练后吃。", likes: 31 },
    { id: "c9", author: "Ava", avatar: "A", content: "鸡胸肉饭盒永远是学生党的稳定答案。", likes: 19 },
  ],
  "post-football": [
    { id: "c10", author: "Ming", avatar: "M", content: "运动搭子比闹钟更有效。", likes: 41 },
    { id: "c11", author: "Ava", avatar: "A", content: "这句“不是自律，是有人一起踢”太真实了。", likes: 36 },
  ],
  "post-gym": [
    { id: "c12", author: "Luna", avatar: "L", content: "拉伸真的会救第二天的腿。", likes: 24 },
    { id: "c13", author: "Kai", avatar: "K", content: "恢复也该被算进运动任务里。", likes: 12 },
  ],
};

const shareFriends = [
  { id: "f1", name: "Luna", avatar: "L" },
  { id: "f2", name: "Ming", avatar: "M" },
  { id: "f3", name: "Ava", avatar: "A" },
  { id: "f4", name: "Kai", avatar: "K" },
  { id: "f5", name: "Yuki", avatar: "Y" },
  { id: "f6", name: "Rico", avatar: "R" },
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
      name: "新手起步",
      hint: "完成第 1 个运动任务",
      icon: "✨",
      unlocked: completedCount >= 1,
    },
    {
      id: "streak",
      name: "七日节奏",
      hint: "连续运动达到 7 天",
      icon: "🔥",
      unlocked: state.streak >= 7,
    },
    {
      id: "xp",
      name: "升级进行时",
      hint: "成长到 3 级",
      icon: "🧠",
      unlocked: getLevel(state.xp) >= 3,
    },
    {
      id: "squad",
      name: "组队来电",
      hint: "完成 1 次小队任务",
      icon: "🤝",
      unlocked: state.tasks.some((task) => task.category === "Squad" && task.completed),
    },
  ];
}

function formatProgress(task: Task) {
  if (task.category === "Campus") {
    return task.completed ? "已参与" : "待参与";
  }

  if (task.category === "Squad") {
    return `${task.progress.toLocaleString()}/${task.target.toLocaleString()} 步`;
  }

  if (task.category === "Weekly") {
    return `${task.progress}/${task.target} 次`;
  }

  return `${task.progress}/${task.target} 分钟`;
}

function computeTodayMinutes(tasks: Task[]) {
  return tasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + (task.category === "Squad" ? 12 : task.category === "Weekly" ? 15 : task.target), 0);
}

function getDefaultState(): AppState {
  return {
    energy: 125,
    xp: 280,
    streak: 6,
    tasks: initialTasks,
    claimedRewardIds: [],
  };
}

function normalizeState(raw: Partial<AppState>): AppState {
  const fallback = getDefaultState();

  return {
    energy: typeof raw.energy === "number" ? raw.energy : fallback.energy,
    xp: typeof raw.xp === "number" ? raw.xp : fallback.xp,
    streak: typeof raw.streak === "number" ? raw.streak : fallback.streak,
    tasks: Array.isArray(raw.tasks) ? raw.tasks : fallback.tasks,
    claimedRewardIds: Array.isArray(raw.claimedRewardIds) ? raw.claimedRewardIds : [],
  };
}

export function FitQuestApp() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [communityTab, setCommunityTab] = useState<CommunityTab>("discover");
  const [state, setState] = useState<AppState>(getDefaultState);
  const [hydrated, setHydrated] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [showPublishOptions, setShowPublishOptions] = useState(false);
  const [showAllRewards, setShowAllRewards] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showIntroDetails, setShowIntroDetails] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setState(normalizeState(JSON.parse(saved) as Partial<AppState>));
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
  const unclaimedRewards = rewardsCatalog.filter((reward) => !state.claimedRewardIds.includes(reward.id));
  const claimableRewardsCount = unclaimedRewards.filter((reward) => reward.energyCost <= state.energy).length;
  const showHeroCard = activeTab !== "community" && activeTab !== "profile";
  const displayedRewards = rewardsCatalog.slice(0, 3);
  const discoverPosts = communityPosts;
  const followingPosts = communityPosts.filter((post) => post.following);
  const currentPosts = communityTab === "discover" ? discoverPosts : followingPosts;
  const profilePosts = communityPosts.slice(0, 3);
  const profileCollections = communityPosts.slice(3, 6);
  const topSquadMember = squadMembers.slice().sort((a, b) => b.minutes - a.minutes)[0];

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

  function claimReward(rewardId: string) {
    setState((current) => {
      const reward = rewardsCatalog.find((item) => item.id === rewardId);

      if (!reward) {
        return current;
      }

      if (current.claimedRewardIds.includes(rewardId) || current.energy < reward.energyCost) {
        return current;
      }

      return {
        ...current,
        energy: current.energy - reward.energyCost,
        claimedRewardIds: [...current.claimedRewardIds, rewardId],
      };
    });
  }

  function resetDemo() {
    const nextState = getDefaultState();
    setState(nextState);
    setCommunityTab("discover");
    setSelectedPost(null);
    setShowAllRewards(false);
    setShowPublishOptions(false);
    setShowShareSheet(false);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  return (
    <main className="app-shell min-h-screen px-4 py-5 lg:px-10">
      <div className="mx-auto flex max-w-[1260px] flex-col gap-6 md:grid md:grid-cols-[250px_minmax(360px,440px)] md:justify-center md:gap-6 xl:grid-cols-[300px_minmax(360px,440px)]">
        <aside className="glass-card hidden self-start rounded-[28px] p-5 md:sticky md:top-6 md:block">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--mint-deep)]">产品简介</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">Meituan FitQuest</h2>
            </div>
            <div className="rounded-full bg-[var(--yellow)]/80 px-2.5 py-1 text-[11px] font-semibold text-slate-900">To C 原型</div>
          </div>

          <button
            className="mb-3 flex w-full items-center justify-between rounded-[18px] bg-white/70 px-3 py-3 text-left"
            onClick={() => setShowIntroDetails((current) => !current)}
            type="button"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">产品简介</p>
              <p className="mt-1 text-[11px] text-slate-500">{showIntroDetails ? "点击收起" : "点击展开查看详细思路"}</p>
            </div>
            <span className="text-lg text-slate-500">{showIntroDetails ? "−" : "+"}</span>
          </button>

          <div className="space-y-3 text-xs leading-6 text-slate-700">
            <InterviewBlock title="美团生态" body={showIntroDetails ? "我希望这不只是一个游戏化运动激励工具产品，而是能够融入美团的本地生活生态的产品，和美团外卖、美团买药、大众点评等联动。对于用户而言，运动结束后，不只是成就感，还能顺势获得轻食、买药、饮品和附近场馆等真实本地生活权益。" : undefined} />
            <InterviewBlock title="用户痛点" body={showIntroDetails ? "很多大学生不是不想运动，而是很难持续。刚开始有热情，过几天就容易断掉，因为缺少反馈，太孤单没有陪伴感以及没有实际的激励。" : undefined} />
            <InterviewBlock title="解决方案" body={showIntroDetails ? "把运动变成每天都能完成的小任务，让目标更具体、起步更轻，完成后马上就能看到进度和奖励。" : undefined} />
            <InterviewBlock title="社交机制" body={showIntroDetails ? "1. 好友一起组队、一起冲目标，运动不再是一个人的事，既有陪伴感，也更容易坚持。 2. 社区分享和浏览大家的运动生活和健康饮食，建立社区氛围和平台调性。" : undefined} />
            <InterviewBlock title="成就机制" body={showIntroDetails ? "XP、等级、连续打卡和徽章，会把“我正在变好”这件事变得非常可见。" : undefined} />
          </div>
        </aside>

        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col pb-28">
          <header className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Meituan FitQuest</p>
              <h1 className="mt-1 text-[30px] font-black tracking-tight text-slate-900">运动是保持年轻最好方式</h1>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--mint-deep)]">Stay Fit, Stay Young</p>
            </div>
            <button
              className="rounded-full border border-black/5 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
              onClick={resetDemo}
              type="button"
            >
              重置演示
            </button>
          </header>

          {showHeroCard && (
            <div className="glass-card soft-grid relative overflow-hidden rounded-[30px] p-5">
              <div className="absolute right-4 top-4 rounded-full bg-[var(--yellow)]/85 px-3 py-1 text-xs font-semibold text-slate-900">
                Lv.{level}
              </div>
              <p className="text-sm font-medium text-[var(--mint-deep)]">今日运动任务</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">{todayMinutes} / {DAILY_GOAL} 分钟</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">坚持打卡，解锁更多权益。</p>
                </div>
                <div className="badge-ring rounded-[24px] bg-gradient-to-br from-[var(--mint)] to-[var(--yellow)] p-4 text-3xl">
                  ⚡
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">今日进度</span>
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
                <StatCard label="当前能量" value={`${state.energy}`} accent="bg-[var(--yellow)]/20" />
                <StatCard label="连续运动" value={`${state.streak} 天`} accent="bg-[var(--coral)]/18" />
                <StatCard label="等级进度" value={`${xpInLevel}/220 XP`} accent="bg-[var(--mint)]/20" />
                <StatCard label="今日可领取" value={`${claimableRewardsCount} 张券`} accent="bg-[var(--blue)]/18" />
              </div>

              <button
                className="mt-5 w-full rounded-[20px] bg-slate-950 px-4 py-4 text-sm font-semibold text-white transition hover:scale-[0.99]"
                onClick={() => setActiveTab("quest")}
                type="button"
              >
                开始今日任务
              </button>
            </div>
          )}

          <section className={`${showHeroCard ? "mt-5" : "mt-1"} flex-1`}>
            {activeTab === "home" && (
              <div className="space-y-4">
                <Panel title="今日可解锁权益" caption="能量越高，可领取的美团健康权益越多。">
                  <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                    {rewardsCatalog.map((reward) => {
                      const claimed = state.claimedRewardIds.includes(reward.id);
                      const available = !claimed && state.energy >= reward.energyCost;

                      return (
                        <div
                          key={reward.id}
                          className={`min-w-[220px] rounded-[24px] border p-4 ${
                            available
                              ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
                              : claimed
                                ? "border-slate-200 bg-slate-100/90"
                                : "border-slate-200 bg-white/70"
                          }`}
                        >
                          <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white">
                            {reward.label}
                          </span>
                          <h3 className="mt-3 text-base font-bold">{reward.title}</h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">{reward.subtitle}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">{reward.energyCost} 能量</span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                claimed
                                  ? "bg-slate-200 text-slate-500"
                                  : available
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {claimed ? "已领取" : available ? "可领取" : "未解锁"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                <Panel title="活动与任务怎么玩" caption="">
                  <div className="space-y-3 text-sm leading-6 text-slate-700">
                    <LogicRow title="每日任务" body="每天完成快走、拉伸、跑步等轻任务，先把运动门槛降下来，再慢慢建立节奏。" />
                    <LogicRow title="校园活动" body="限时校园挑战会把运动和校园生活结合起来，比如夜跑、操场挑战或周末球局。" />
                    <LogicRow title="组队激励" body="和朋友一起建小队、冲周目标、攒奖励池，让坚持运动这件事更有陪伴感。" />
                    <LogicRow title="权益兑换" body="运动积累的能量可以直接换轻食、买药、饮品、场馆优惠等真实生活权益。" />
                  </div>
                </Panel>
              </div>
            )}

            {activeTab === "quest" && (
              <div className="space-y-4">
                <TaskSection title="每日任务" tasks={groupedTasks.Daily} onComplete={completeTask} />
                <TaskSection title="每周挑战" tasks={groupedTasks.Weekly} onComplete={completeTask} />
                <TaskSection title="校园限时挑战" tasks={groupedTasks.Campus} onComplete={completeTask} />
                <TaskSection title="小队任务" tasks={groupedTasks.Squad} onComplete={completeTask} />
              </div>
            )}

            {activeTab === "community" && (
              selectedPost ? (
                <div className="space-y-4">
                  <section className="glass-card rounded-[28px] p-4">
                    <button
                      className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700"
                      onClick={() => setSelectedPost(null)}
                      type="button"
                    >
                      <span className="text-lg">←</span>
                      返回社区
                    </button>

                    <div className={`rounded-[24px] bg-gradient-to-br ${selectedPost.coverClassName} p-5`}>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-900">
                          {selectedPost.coverTag}
                        </span>
                        <span className="text-4xl">{selectedPost.coverEmoji}</span>
                      </div>
                      <p className="mt-8 text-sm leading-6 text-slate-700">{selectedPost.summary}</p>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-xl font-bold leading-8">{selectedPost.title}</h3>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                            {selectedPost.avatar}
                          </div>
                          <span>{selectedPost.author}</span>
                        </div>
                        <span>❤️ {selectedPost.likes}</span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-700">{selectedPost.content}</p>
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                      <button className="flex-1 rounded-[18px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900" type="button">
                        ❤️ 点赞
                      </button>
                      <button className="flex-1 rounded-[18px] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900" type="button">
                        ⭐ 收藏
                      </button>
                      <button
                        className="flex-1 rounded-[18px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                        onClick={() => setShowShareSheet(true)}
                        type="button"
                      >
                        ↗ 分享
                      </button>
                    </div>
                  </section>

                  <Panel title="评论区" caption="看看大家都在聊什么。">
                    <div className="space-y-3">
                      {(postComments[selectedPost.id] ?? []).map((comment) => (
                        <div key={comment.id} className="rounded-[20px] bg-white/80 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                                {comment.avatar}
                              </div>
                              <span className="text-sm font-semibold text-slate-900">{comment.author}</span>
                            </div>
                            <span className="text-xs text-slate-500">❤️ {comment.likes}</span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              ) : (
                <div className="space-y-4">
                  <section className="glass-card rounded-[28px] p-4">
                    <div className="flex items-center justify-between gap-2 rounded-[20px] bg-slate-100/80 p-1.5">
                      <button
                        className={`flex-1 rounded-[16px] px-3 py-3 text-sm font-semibold ${
                          communityTab === "following" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                        }`}
                        onClick={() => setCommunityTab("following")}
                        type="button"
                      >
                        关注
                      </button>
                      <button
                        className={`flex-1 rounded-[16px] px-3 py-3 text-sm font-semibold ${
                          communityTab === "discover" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                        }`}
                        onClick={() => setCommunityTab("discover")}
                        type="button"
                      >
                        推荐
                      </button>
                      <button
                        className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-slate-950 text-xl font-semibold text-white"
                        onClick={() => setShowPublishOptions(true)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </section>

                  <div className="columns-2 gap-3 [column-fill:_balance]">
                    {currentPosts.map((post) => (
                      <button
                        key={post.id}
                        className="glass-card mb-3 inline-block w-full break-inside-avoid rounded-[24px] p-3 text-left"
                        onClick={() => setSelectedPost(post)}
                        type="button"
                      >
                        <div className={`rounded-[20px] bg-gradient-to-br ${post.coverClassName} p-4`}>
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-900">
                              {post.coverTag}
                            </span>
                            <span className="text-3xl">{post.coverEmoji}</span>
                          </div>
                          <div className="mt-8 text-sm font-medium text-slate-700">{post.summary}</div>
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-6 text-slate-900">{post.title}</h3>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-[11px] font-bold text-white">
                              {post.avatar}
                            </div>
                            <span>{post.author}</span>
                          </div>
                          <span>❤️ {post.likes}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}

            {activeTab === "squad" && (
              <div className="space-y-4">
                <Panel title="我的运动小队" caption="28LA奥运预备队">
                  <div className="rounded-[24px] bg-gradient-to-r from-[var(--mint)]/20 via-white to-[var(--yellow)]/25 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mint-deep)]">本周目标</p>
                        <h3 className="mt-1 text-xl font-bold">420 分钟活跃运动</h3>
                      </div>
                      <div className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white">奖励池 320 能量</div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-700">小队进度</span>
                        <span className="font-semibold">286 / 420 分钟</span>
                      </div>
                      <div className="progress-track h-3 rounded-full">
                        <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[var(--mint-deep)] to-[var(--yellow)]" />
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
                          <p className="text-sm font-semibold">{member.minutes} 分钟</p>
                          <p className="text-xs text-[var(--muted)]">本周累计</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="好友排行榜" caption={`${topSquadMember.name}称霸了榜单`}>
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
                          <span className="text-sm text-slate-700">{member.minutes} 分钟</span>
                        </div>
                      ))}
                  </div>
                  <button className="mt-4 w-full rounded-[18px] bg-[var(--yellow)] px-4 py-3 text-sm font-semibold text-slate-900" type="button">
                    邀请好友加入
                  </button>
                </Panel>
              </div>
            )}

            {activeTab === "rewards" && (
              <div className="space-y-4">
                <Panel title="能量账户" caption="消耗能量，兑换真实可用的生活权益。">
                  <div className="flex items-end justify-between rounded-[24px] bg-slate-950 p-5 text-white">
                    <div>
                      <p className="text-sm text-white/70">当前能量</p>
                      <h3 className="mt-1 text-3xl font-black">{state.energy}</h3>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">Lv.3 解锁新徽章</div>
                  </div>
                </Panel>

                <Panel title="可兑换权益" caption="当前版本为原型演示，全部为 mock 数据。">
                  <div className="space-y-3">
                    {displayedRewards.map((reward) => {
                      const claimed = state.claimedRewardIds.includes(reward.id);
                      const canClaim = !claimed && state.energy >= reward.energyCost;

                      return (
                        <div key={reward.id} className="rounded-[22px] border border-slate-100 bg-white/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold">{reward.title}</h3>
                              <p className="mt-1 text-sm text-[var(--muted)]">{reward.subtitle}</p>
                            </div>
                            <span className="rounded-full bg-[var(--yellow)]/25 px-3 py-1 text-xs font-semibold text-slate-900">
                              {reward.energyCost} 能量
                            </span>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                claimed
                                  ? "bg-slate-200 text-slate-500"
                                  : canClaim
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {claimed ? "已领取" : canClaim ? "现在可兑" : "能量不足"}
                            </span>
                            <button
                              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                                claimed
                                  ? "bg-slate-200 text-slate-500"
                                  : canClaim
                                    ? "bg-slate-950 text-white"
                                    : "bg-slate-200 text-slate-500"
                              }`}
                              disabled={!canClaim}
                              onClick={() => claimReward(reward.id)}
                              type="button"
                            >
                              {claimed ? "已领取" : "立即领取"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className="mt-4 w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                    onClick={() => setShowAllRewards(true)}
                    type="button"
                  >
                    查看更多权益
                  </button>
                </Panel>

                <Panel title="徽章墙" caption="把看不见的坚持，变成看得见的成长。">
                  <div className="grid grid-cols-2 gap-3">
                    {unlockedBadges.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} unlocked />
                    ))}
                    {lockedBadges.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} unlocked={false} />
                    ))}
                  </div>
                </Panel>

                <Panel title="连续打卡奖励" caption="坚持！坚持！坚持！">
                  <div className="rounded-[24px] bg-gradient-to-r from-[var(--coral)]/18 via-white to-[var(--yellow)]/25 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-700">当前连续运动</p>
                        <h3 className="mt-1 text-2xl font-black">{state.streak} 天</h3>
                      </div>
                      <div className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm">
                        {state.streak >= 7 ? "奖励已解锁" : "再坚持 1 天"}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      每连续运动达到 7 天，可额外解锁一张放纵餐快乐券或补水券，用来奖励坚持进步的自己✊。
                    </p>
                  </div>
                </Panel>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-4">
                <Panel title="个人主页" caption="记录你的运动生活和成长轨迹。">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-950 text-2xl font-bold text-white">
                        N
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">湾仔老酸奶</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">IP 属地：上海</p>
                        <p className="text-sm text-[var(--muted)]">账号：fitquest_nora</p>
                      </div>
                    </div>
                    <button className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700" type="button">
                      设置
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <ProfileStat label="关注" value="126" />
                    <ProfileStat label="粉丝" value="2.4k" />
                    <ProfileStat label="获赞" value="9.8k" />
                  </div>
                </Panel>

                <Panel title="已发布作品" caption="你的运动与饮食分享，会在这里被持续看见。">
                  <div className="space-y-3">
                    {profilePosts.map((post) => (
                      <ProfileCard key={post.id} post={post} onOpen={setSelectedPost} />
                    ))}
                  </div>
                </Panel>

                <Panel title="收藏" caption="把想练的内容、想吃的搭配都先收起来。">
                  <div className="space-y-3">
                    {profileCollections.map((post) => (
                      <ProfileCard key={post.id} post={post} onOpen={setSelectedPost} />
                    ))}
                  </div>
                </Panel>
              </div>
            )}
          </section>
        </div>
      </div>

      <nav className="fixed bottom-0 left-1/2 z-20 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 border-t border-white/50 bg-[rgba(255,255,255,0.9)] px-3 pb-6 pt-3 backdrop-blur-xl md:left-[calc(50%+128px)] xl:left-[calc(50%+156px)]">
        <div className="grid grid-cols-6 gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                className={`rounded-[18px] px-1 py-3 text-center transition ${
                  active ? "bg-slate-950 text-white shadow-lg" : "bg-white/70 text-slate-600"
                }`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                <div className="text-lg">{tab.icon}</div>
                <div className="mt-1 text-[10px] font-semibold">{tab.label}</div>
              </button>
            );
          })}
        </div>
      </nav>

      {showPublishOptions && (
        <Modal onClose={() => setShowPublishOptions(false)} title="发布内容">
          <div className="grid grid-cols-3 gap-3">
            <ActionButton icon="🖼️" label="照片" />
            <ActionButton icon="✍️" label="文字" />
            <ActionButton icon="📷" label="相机" />
          </div>
        </Modal>
      )}

      {showShareSheet && selectedPost && (
        <Modal onClose={() => setShowShareSheet(false)} title="分享给好友">
          <div className="grid grid-cols-3 gap-4">
            {shareFriends.map((friend) => (
              <button key={friend.id} className="text-center" type="button">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                  {friend.avatar}
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-700">{friend.name}</div>
              </button>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <ActionButton icon="🔗" label="复制链接" />
            <ActionButton icon="💬" label="发消息" />
            <ActionButton icon="📍" label="生成海报" />
          </div>
        </Modal>
      )}

      {showAllRewards && (
        <Modal onClose={() => setShowAllRewards(false)} title="全部权益">
          <div className="space-y-3">
            {rewardsCatalog.map((reward) => {
              const claimed = state.claimedRewardIds.includes(reward.id);
              const canClaim = !claimed && state.energy >= reward.energyCost;

              return (
                <div key={reward.id} className="rounded-[20px] border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--mint-deep)]">{reward.label}</p>
                      <h3 className="mt-1 font-bold">{reward.title}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{reward.subtitle}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                      {reward.energyCost} 能量
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{claimed ? "已领取过" : canClaim ? "当前可兑换" : "需要更多能量"}</span>
                    <button
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${
                        claimed ? "bg-slate-200 text-slate-500" : canClaim ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-500"
                      }`}
                      disabled={!canClaim}
                      onClick={() => claimReward(reward.id)}
                      type="button"
                    >
                      {claimed ? "已领取" : "立即领取"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
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
        {caption ? <p className="mt-1 text-sm text-[var(--muted)]">{caption}</p> : null}
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

function InterviewBlock({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-[18px] bg-white/72 p-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {body ? <p className="mt-1.5 text-xs leading-6 text-[var(--muted)]">{body}</p> : null}
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
    <Panel title={title} caption="完成任务就能获得 XP、能量和对应权益。">
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
                      {task.difficulty === "Easy" ? "简单" : task.difficulty === "Medium" ? "中等" : "挑战"}
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
                  <p className="text-slate-500">奖励能量</p>
                  <p className="mt-1 font-semibold text-slate-900">+{task.rewardEnergy}</p>
                </div>
                <div className="rounded-[18px] bg-slate-50 p-3">
                  <p className="text-slate-500">对应权益</p>
                  <p className="mt-1 font-semibold text-slate-900">{task.perk}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">任务进度</span>
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
                {task.completed ? "已完成" : "完成任务"}
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
        {unlocked ? "已解锁" : "未解锁"}
      </span>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-white/80 p-3 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ProfileCard({
  post,
  onOpen,
}: {
  post: CommunityPost;
  onOpen: (post: CommunityPost) => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-[22px] bg-white/80 p-3 text-left"
      onClick={() => onOpen(post)}
      type="button"
    >
      <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${post.coverClassName} text-3xl`}>
        {post.coverEmoji}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--mint-deep)]">{post.coverTag}</p>
        <h3 className="mt-1 line-clamp-2 font-bold leading-6 text-slate-900">{post.title}</h3>
        <p className="mt-2 text-xs text-slate-500">❤️ {post.likes}</p>
      </div>
    </button>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/35 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-bold text-slate-900">{title ?? "详情"}</div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-500"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="rounded-[20px] bg-slate-100 px-4 py-5 text-center" type="button">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{label}</div>
    </button>
  );
}
