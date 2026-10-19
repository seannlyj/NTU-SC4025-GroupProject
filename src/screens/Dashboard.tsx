import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router';
import { AppLink, useAppNavigate } from '../app/navigation';
import type { CategoryStat, RewardsOverview } from '../api';
import { scenarioKey, useCard, useOverview } from '../app/queries';
import { categoryName } from '../config/categories';
import { CASHBACK_POLICY } from '../config/policy';
import { formatUpdatedAt } from '../domain/dates';
import { formatSGD } from '../domain/money';
import { recentTransactions, splitSegments, summarizeMonth, type MonthSummary } from '../domain/summary';
import type { Card as CardModel } from '../domain/types';
import { AppTopBar } from '../components/AppTopBar';
import { Card } from '../components/Card';
import { LoadingRegion, Skeleton, Spinner } from '../components/Feedback';
import { BarsIcon, DownloadIcon, InfoIcon } from '../components/icons';
import { PageTitle } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { SplitBar } from '../components/SplitBar';
import { TransactionRow } from '../components/TransactionRow';
import { AnimatedMoney, Entrance, Pop, Rise } from '../motion/primitives';
import { dur, staggerDelay } from '../motion/tokens';

/**
 * /rewards plus the /no-card and /unavailable states, which are the same screen with different data.
 *
 * Entrance choreography (seconds): title 0 → cashback card 0.06 (amount counts up,
 * cap bar fills) → minimum-spend card 0.12 (progress fills, split bar segments fill in
 * turn, chip pops) → recent rows slide in one by one → category tiles ripple in →
 * shortcuts rise and their icons pop.
 */
export function DashboardScreen() {
  const card = useCard();
  const overview = useOverview();
  const navigate = useAppNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();

  let body;
  if (card.isPending) body = <DashboardSkeleton key="skeleton" />;
  else if (card.data === null) body = <NoCardView key="no-card" />;
  else if (card.isError) body = <UnavailableView key="unavailable" card={null} onRetry={() => card.refetch()} />;
  else if (overview.isError) {
    const retry = async () => {
      const result = await overview.refetch();
      if (result.isSuccess && pathname === '/unavailable') {
        // Recovered: carry the fresh data over to the normal dashboard without reloading it.
        queryClient.setQueryData(scenarioKey('card', 'normal'), card.data);
        queryClient.setQueryData(scenarioKey('overview', 'normal'), result.data);
        navigate('/rewards', { replace: true, nav: 'fade' });
      }
    };
    body = <UnavailableView key="unavailable" card={card.data} onRetry={retry} retrying={overview.isFetching} />;
  } else if (overview.isPending) body = <DashboardSkeleton key="skeleton" card={card.data} />;
  else body = <DashboardView key="view" card={card.data} overview={overview.data} />;

  return (
    <Entrance>
      <AppTopBar />
      <Rise y={10} className="px-5 pt-2">
        <PageTitle>Rewards Tracker</PageTitle>
      </Rise>
      {body}
    </Entrance>
  );
}

function CardIdentity({ card, delay = 0 }: { card: CardModel; delay?: number }) {
  return (
    <div className="flex items-center gap-[14px]">
      <Pop
        delay={delay}
        aria-hidden="true"
        className="grid size-12 shrink-0 place-items-center rounded-full bg-peach text-[13px] text-ink-avatar"
      >
        {card.badge}
      </Pop>
      <Rise x={-8} y={0} delay={delay + dur(0.06)}>
        <h2 className="text-[18px] leading-6 font-semibold text-ink">{card.productName}</h2>
        <p className="text-[14px] leading-5 text-ink-muted">
          <span aria-hidden="true">•••• </span>
          <span className="sr-only">Card ending </span>
          {card.last4}
        </p>
      </Rise>
    </div>
  );
}

function CashbackCard({ card, summary }: { card: CardModel; summary: MonthSummary }) {
  return (
    <Rise y={18} scale={0.985} delay={dur(0.06)}>
      <Card className="px-5 pt-5 pb-5" aria-label="Cashback this month">
        <CardIdentity card={card} delay={dur(0.14)} />
        <hr className="mt-[22px] border-divider" />
        <div className="mt-[17px] flex items-center justify-between">
          <p className="text-[16px] text-ink">Cashback this month</p>
          <p className="tabular text-[20px] leading-[26px] font-semibold text-ink">
            <AnimatedMoney cents={summary.cashbackCents} delay={dur(0.25)} />
          </p>
        </div>
        <ProgressBar
          className="mt-[13px]"
          value={summary.capProgress}
          minVisiblePx={14}
          delay={dur(0.35)}
          label="Cashback against monthly cap"
          valueText={`${formatSGD(summary.cashbackCents)} of ${formatSGD(summary.capCents)} cap`}
        />
        <p className="mt-[6px] text-[13px] leading-[18px] text-ink-muted">{formatSGD(summary.capCents)} monthly cap</p>
      </Card>
    </Rise>
  );
}

function MinimumSpendCard({ summary, updatedAt }: { summary: MonthSummary; updatedAt: string }) {
  return (
    <Rise y={18} scale={0.985} delay={dur(0.12)}>
      <Card className="px-5 pt-4 pb-3" aria-labelledby="minimum-spend-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="minimum-spend-title" className="text-[18px] leading-6 font-semibold text-ink">
              Minimum spend
            </h2>
            <p className="text-[13px] leading-[18px] text-ink-muted">Updated {formatUpdatedAt(updatedAt)}</p>
          </div>
          {summary.minimumMet ? (
            <Pop
              delay={dur(0.85)}
              className="rounded-full border-[1.5px] border-eligible px-[7px] py-px text-[13px] leading-[17px] font-semibold whitespace-nowrap text-eligible"
            >
              Minimum met
            </Pop>
          ) : (
            <Pop
              delay={dur(0.85)}
              className="rounded-full border-[1.5px] border-brand-strong px-[7px] py-px text-[13px] leading-[17px] font-semibold whitespace-nowrap text-brand-strong"
            >
              {formatSGD(summary.toGoCents)} to go
            </Pop>
          )}
        </div>
        <ProgressBar
          className="mt-3"
          height={10}
          value={summary.minimumProgress}
          delay={dur(0.3)}
          label="Eligible spend towards the minimum"
          valueText={`${formatSGD(summary.eligibleCents)} of ${formatSGD(summary.minSpendCents)}`}
        />
        <div className="tabular mt-[9px] flex justify-between text-[15px] leading-5">
          <AnimatedMoney className="text-ink" cents={summary.eligibleCents} delay={dur(0.3)} />
          <span className="text-ink-muted">
            <span className="sr-only">Minimum </span>
            {formatSGD(summary.minSpendCents)}
          </span>
        </div>
        <hr className="mt-[11px] border-divider" />
        <div className="mt-3 flex items-center justify-between leading-6">
          <h3 className="text-[15px] text-ink">Total card spending</h3>
          <AnimatedMoney className="tabular text-[16px] font-semibold text-ink" cents={summary.totalCents} delay={dur(0.45)} />
        </div>
        <div className="mt-2">
          <SplitBar segments={splitSegments(summary)} totalCents={summary.totalCents} delay={dur(0.5)} />
        </div>
      </Card>
    </Rise>
  );
}

function CategoryTiles({ categories }: { categories: CategoryStat[] }) {
  return (
    <ul className="mt-2.5 grid grid-cols-2 gap-[10.5px]">
      {categories.map((c, i) => (
        <Rise
          as="li"
          key={c.categoryId}
          y={12}
          scale={0.96}
          delay={staggerDelay(i, 0.4, dur(0.04))}
          className="flex h-[63px] flex-col justify-center rounded-[15px] bg-card px-4"
        >
          <p className="text-[13px] leading-[18px] text-ink-muted">{categoryName(c.categoryId)}</p>
          <p className="tabular text-[15px] leading-5 font-semibold text-ink">
            <span className="sr-only">Cashback </span>
            <AnimatedMoney cents={c.cashbackCents} delay={staggerDelay(i, 0.55, dur(0.04))} />
          </p>
        </Rise>
      ))}
    </ul>
  );
}

const SHORTCUTS = [
  { to: '/history', label: 'History', icon: <BarsIcon size={30} /> },
  { to: '/eligibility', label: 'Eligibility', icon: <InfoIcon size={30} /> },
  { to: '/report', label: 'Report', icon: <DownloadIcon size={30} /> },
];

function Shortcuts() {
  return (
    <Rise
      as="nav"
      aria-label="Rewards tools"
      y={18}
      delay={dur(0.55)}
      className="mx-4 mt-[26px] mb-[19px] rounded-[20px] bg-page shadow-float"
    >
      <ul className="grid grid-cols-3">
        {SHORTCUTS.map((s, i) => (
          <li key={s.to}>
            <AppLink to={s.to} className="pressable flex flex-col items-center gap-[5px] rounded-[20px] pt-[19px] pb-[17px] text-ink">
              <Pop delay={dur(0.7) + i * dur(0.07)}>{s.icon}</Pop>
              <span className="text-[14px] leading-5">{s.label}</span>
            </AppLink>
          </li>
        ))}
      </ul>
    </Rise>
  );
}

function DashboardView({ card, overview }: { card: CardModel; overview: RewardsOverview }) {
  const summary = summarizeMonth(overview.month, overview.transactions, CASHBACK_POLICY);
  const recent = recentTransactions(overview.transactions, 3);
  return (
    <>
      <div className="mt-3 space-y-3 px-4">
        <CashbackCard card={card} summary={summary} />
        <MinimumSpendCard summary={summary} updatedAt={overview.updatedAt} />
      </div>

      <section className="mt-[24px] px-5" aria-labelledby="recent-title">
        <Rise y={10} delay={dur(0.22)} className="flex items-center justify-between">
          <h2 id="recent-title" className="text-[18px] leading-6 font-semibold text-ink">
            Recent transactions
          </h2>
          <AppLink to="/transactions" className="pressable -mr-2 flex min-h-11 items-center px-2 text-[15px] text-link">
            See all
          </AppLink>
        </Rise>
        <ul className="divide-y divide-divider-soft">
          {recent.map((t, i) => (
            <Rise as="li" key={t.id} x={22} y={0} delay={staggerDelay(i, 0.28, dur(0.07))}>
              <TransactionRow transaction={t} cashbackCents={summary.cashbackByTransaction[t.id] ?? 0} showDate />
            </Rise>
          ))}
        </ul>
      </section>

      <section className="mt-5 px-4" aria-labelledby="category-title">
        <Rise y={10} delay={dur(0.34)}>
          <h2 id="category-title" className="px-1 text-[18px] leading-6 font-semibold text-ink">
            By category
          </h2>
        </Rise>
        <CategoryTiles categories={overview.categories} />
      </section>

      <Shortcuts />
    </>
  );
}

function NoCardView() {
  return (
    <div className="mt-[111px] flex flex-col items-center px-5">
      <Pop
        as="div"
        delay={dur(0.1)}
        aria-hidden="true"
        className="h-[59px] w-[92px] rounded-[12px] border-2 border-dashed border-[#bdb5b0] bg-card"
      />
      <Rise as="p" delay={dur(0.22)} className="mt-4 text-center text-[15px] leading-[22px] font-semibold text-ink" role="status">
        No eligible OCBC credit cards are available
      </Rise>
    </div>
  );
}

function UnavailableView({
  card,
  onRetry,
  retrying = false,
}: {
  card: CardModel | null;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <>
      <div className="mt-3 space-y-3 px-4">
        <Rise y={18} delay={dur(0.06)}>
          <Card className="px-5 pt-5 pb-[18px]" aria-label="Cashback this month">
            {card && <CardIdentity card={card} delay={dur(0.12)} />}
            <hr className="mt-[22px] border-divider" />
            <div className="mt-[17px] flex items-center justify-between">
              <p className="text-[16px] text-ink">Cashback this month</p>
              <p className="text-[18px] font-semibold text-ink">Unavailable</p>
            </div>
          </Card>
        </Rise>
        <Rise y={18} delay={dur(0.12)}>
          <Card className="flex items-center justify-between px-5 py-5">
            <h2 className="text-[18px] leading-[26px] font-semibold text-ink">Minimum spend</h2>
            <p className="text-[18px] font-semibold text-ink">Unavailable</p>
          </Card>
        </Rise>
      </div>
      <Rise as="section" y={18} delay={dur(0.18)} className="mt-5 px-4" aria-labelledby="category-title">
        <h2 id="category-title" className="px-1 text-[18px] leading-6 font-semibold text-ink">
          By category
        </h2>
        <Card className="mt-2 px-4 py-4">
          <p className="text-[18px] leading-[26px] font-semibold text-ink">Unavailable</p>
        </Card>
      </Rise>
      <Rise y={18} delay={dur(0.26)} className="mt-6 px-4" role="alert">
        <p className="sr-only">Rewards data is unavailable right now.</p>
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-brand-strong text-[16px] font-semibold text-white disabled:opacity-80"
        >
          {retrying && <Spinner />}
          {retrying ? 'Retrying…' : 'Retry'}
        </button>
      </Rise>
    </>
  );
}

function DashboardSkeleton({ card }: { card?: CardModel }) {
  return (
    <>
      <LoadingRegion label="Loading your rewards">
        <div className="mt-3 space-y-3 px-4">
          <Card className="px-5 pt-5 pb-[18px]">
            {card ? (
              <CardIdentity card={card} />
            ) : (
              <div className="flex items-center gap-[14px]">
                <Skeleton className="size-12 rounded-full!" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            )}
            <hr className="mt-[22px] border-divider" />
            <div className="mt-[17px] flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-7 w-16" />
            </div>
            <Skeleton className="mt-[9px] h-2 w-full" />
            <Skeleton className="mt-[10px] h-4 w-36" />
          </Card>
          <Card className="px-5 pt-4 pb-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-2 h-4 w-44" />
            <Skeleton className="mt-4 h-2.5 w-full" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-6 h-5 w-full" />
            <Skeleton className="mt-3 h-2 w-full" />
          </Card>
        </div>
        <div className="mt-[30px] space-y-5 px-5">
          <Skeleton className="h-6 w-52" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-[14px]">
              <Skeleton className="size-11 rounded-full!" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2.5 px-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-[63px] rounded-[15px]!" />
          ))}
        </div>
      </LoadingRegion>
    </>
  );
}
