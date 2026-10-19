import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { AppLink } from '../app/navigation';
import { AppTopBar } from '../components/AppTopBar';
import { ChevronRightIcon, EyeIcon, EyeOffIcon, GearIcon, GiftIcon, PhonePayIcon, ScanIcon } from '../components/icons';
import { InertButton } from '../components/InertButton';
import { Entrance, Pop, Rise } from '../motion/primitives';
import { dur, ease, spring, staggerDelay, timing } from '../motion/tokens';

/**
 * / (where the app opens): a filler banking home screen so the demo can start where a customer
 * would. Only the "Rewards Tracker" quick action and the tab bar lead anywhere;
 * everything else is decorative. All account details are mock placeholders.
 */
const PRODUCT_TABS = ['Accounts', 'Cards', 'Investments', 'Loans'] as const;
type ProductTab = (typeof PRODUCT_TABS)[number];

const PROMOS = [
  { tag: 'Money lock', text: 'Protect your savings and time deposits from scammers' },
  { tag: 'Savings goals', text: 'Stay on track and turn your plans into reality' },
  { tag: 'Rewards', text: 'See how close you are to full cashback this month' },
];

export function HomeScreen() {
  const [tab, setTab] = useState<ProductTab>('Accounts');
  const [tabChanged, setTabChanged] = useState(false);
  const [hidden, setHidden] = useState(false);

  return (
    <Entrance>
      <div className="relative overflow-hidden pb-6">
        <HeroBackdrop />

        <AppTopBar />

        <section className="relative pt-[26px] pr-[150px] pl-[44px]" aria-labelledby="home-greeting">
          <Rise y={12} delay={dur(0.1)}>
            <h1 id="home-greeting" className="text-[24px] leading-8 font-bold text-ink">
              Hey there!
            </h1>
          </Rise>
          <Rise as="p" y={10} delay={dur(0.16)} className="mt-1 text-[15px] leading-[21px] text-ink-muted">
            Welcome to a brand-new experience, designed with you in mind.
          </Rise>
        </section>

        <Rise y={20} scale={0.98} delay={dur(0.22)} className="relative mx-[18px] mt-[32px]">
          <nav aria-label="Quick actions" className="relative rounded-[16px] bg-page shadow-float">
            <InertButton label="Customise quick actions" className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-back text-ink-muted">
              <GearIcon size={16} />
            </InertButton>
            <ul className="grid grid-cols-3 pt-[23px] pb-[20px]">
              <QuickAction index={0} icon={<PhonePayIcon size={28} />} label="PayNow" />
              <QuickAction index={1} icon={<ScanIcon size={28} />} label="Scan & Pay" />
              <li>
                <AppLink
                  to="/rewards"
                  className="pressable flex flex-col items-center gap-2 rounded-[12px] px-1 text-ink"
                  aria-label="Rewards Tracker: open your cashback progress"
                >
                  <Pop delay={staggerDelay(2, 0.34, dur(0.06))} className="grid size-9 place-items-center">
                    <GiftIcon size={28} />
                  </Pop>
                  <span className="text-[14px] leading-5">Rewards Tracker</span>
                </AppLink>
              </li>
            </ul>
          </nav>
        </Rise>
      </div>

      <Rise y={10} delay={dur(0.3)} className="mt-[25px] flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setHidden((h) => !h)}
          aria-pressed={hidden}
          aria-label={hidden ? 'Show balances' : 'Hide balances'}
          className="pressable grid size-9 shrink-0 place-items-center rounded-full bg-back text-ink"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={hidden ? 'off' : 'on'}
              initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={spring.pop}
            >
              {hidden ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </motion.span>
          </AnimatePresence>
        </button>
        <span className="mx-1 h-6 w-px shrink-0 bg-divider" aria-hidden="true" />
        <div role="tablist" aria-label="Products" className="isolate flex gap-2">
          {PRODUCT_TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setTabChanged(true);
              }}
              className={`pressable relative h-[34px] shrink-0 rounded-full border px-4 text-[14px] transition-colors duration-200 ${
                tab === t ? 'border-transparent font-semibold text-white' : 'border-divider text-ink'
              }`}
            >
              {tab === t && (
                <motion.span layoutId="home-product-pill" className="absolute -inset-px z-0 rounded-full bg-brand-strong" transition={spring.soft} />
              )}
              <span className="relative z-10">{t}</span>
            </button>
          ))}
        </div>
      </Rise>

      <Rise y={18} delay={dur(0.36)} className="relative mx-[18px] mt-4" role="tabpanel" aria-label={tab}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={tab}
            className="w-full"
            initial={tabChanged ? { opacity: 0, x: 24 } : false}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24, transition: { duration: timing.exit } }}
            transition={{ duration: dur(0.4), ease: ease.out }}
          >
            <ProductPanel tab={tab} hidden={hidden} />
          </motion.div>
        </AnimatePresence>
      </Rise>

      <section aria-label="For you" className="mt-[35px] flex snap-x gap-3 overflow-x-auto px-[18px] pb-2 [scrollbar-width:none]">
        {PROMOS.map((p, i) => (
          <Rise
            key={p.tag}
            x={36}
            y={0}
            delay={staggerDelay(i, 0.44, dur(0.07))}
            className="relative h-[104px] w-[285px] shrink-0 snap-start overflow-hidden rounded-[14px] bg-[linear-gradient(120deg,#fbefe8,#f3dccf)] p-3"
          >
            <span aria-hidden="true" className="absolute -right-6 -bottom-8 size-24 rounded-full bg-white/40" />
            <p className="text-[11px] leading-4 font-semibold tracking-[0.06em] text-ink-muted uppercase">{p.tag}</p>
            <p className="mt-1.5 text-[15px] leading-5 font-semibold text-ink">{p.text}</p>
          </Rise>
        ))}
      </section>
    </Entrance>
  );
}

function QuickAction({ index, icon, label }: { index: number; icon: ReactNode; label: string }) {
  return (
    <li>
      <InertButton label={label} className="flex w-full flex-col items-center gap-2 px-1 text-ink">
        <Pop delay={staggerDelay(index, 0.34, dur(0.06))} className="grid size-9 place-items-center">
          {icon}
        </Pop>
        <span className="text-[14px] leading-5">{label}</span>
      </InertButton>
    </li>
  );
}

function ProductPanel({ tab, hidden }: { tab: ProductTab; hidden: boolean }) {
  if (tab === 'Accounts') {
    return (
      <article className="rounded-[16px] bg-card px-4 pt-4 pb-2" aria-label="360 Account">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-peach text-[12px] text-ink-avatar">
            360
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] leading-6 font-semibold text-ink">360 Account</h2>
            <p className="text-[14px] leading-5 text-ink-muted">123-12345678-123</p>
          </div>
          <ChevronRightIcon size={22} className="text-ink-muted" />
        </div>
        <dl className="mt-[26px] divide-y divide-divider-soft text-[15px] leading-6">
          <div className="flex h-10 items-center justify-between gap-3">
            <dt className="text-ink-muted">Available balance</dt>
            <dd className="font-bold text-ink">
              <Masked hidden={hidden} value="30,000.00" suffix=" SGD" />
            </dd>
          </div>
          <div className="flex h-10 items-center justify-between gap-3">
            <dt className="text-ink-muted">Debit card no.</dt>
            <dd className="text-ink">
              <Masked hidden={hidden} value="123-4567-8901-234" />
            </dd>
          </div>
        </dl>
      </article>
    );
  }
  if (tab === 'Cards') {
    return (
      <AppLink to="/rewards" className="pressable block rounded-[16px] bg-card p-4" aria-label="OCBC 365 Credit Card: open Rewards Tracker">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-peach text-[12px] text-ink-avatar">
            365
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] leading-6 font-semibold text-ink">OCBC 365 Credit Card</h2>
            <p className="text-[14px] leading-5 text-ink-muted">•••• 1234</p>
          </div>
          <ChevronRightIcon size={22} className="text-ink-muted" />
        </div>
        <hr className="my-3 border-divider-soft" />
        <p className="flex items-center justify-between text-[15px] leading-6">
          <span className="text-ink-muted">Rewards Tracker</span>
          <span className="font-semibold text-link">See cashback</span>
        </p>
      </AppLink>
    );
  }
  return (
    <div className="grid h-[150px] place-items-center rounded-[16px] bg-card px-6 text-center text-[15px] text-ink-muted">
      No {tab.toLowerCase()} to show in this prototype.
    </div>
  );
}

/** Balance text that blurs into dots when balances are hidden. */
function Masked({ hidden, value, suffix = '' }: { hidden: boolean; value: string; suffix?: string }) {
  return (
    <span className="relative inline-flex overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={hidden ? 'hidden' : 'shown'}
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
          transition={{ duration: dur(0.25), ease: ease.out }}
        >
          {hidden ? '••••••' : value}
          {suffix}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** The warm hero wash, a red arc on the left and an abstract illustration (no photography). */
function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[336px]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#fbf4f0_55%,#f6ebe5_100%)]" />
      <Rise y={0} x={-14} delay={0} duration={dur(0.8)} className="absolute top-[52px] -left-[46px] h-[300px] w-[70px] rounded-[50%] bg-brand" />
      <Rise y={0} x={20} scale={0.94} delay={dur(0.12)} duration={dur(0.8)} className="absolute top-[64px] right-0 h-[150px] w-[168px]">
        <svg viewBox="0 0 168 150" width="168" height="150">
          <circle cx="112" cy="70" r="66" fill="#f5d5c0" opacity="0.55" />
          <circle cx="70" cy="104" r="38" fill="#fde7dc" />
          <rect x="84" y="46" width="62" height="46" rx="8" fill="#ffffff" />
          <rect x="84" y="46" width="62" height="12" rx="6" fill="#ed1c24" />
          <rect x="92" y="68" width="30" height="6" rx="3" fill="#e2dbd6" />
          <rect x="92" y="80" width="20" height="6" rx="3" fill="#e2dbd6" />
          <circle cx="56" cy="62" r="17" fill="#ffffff" />
          <circle cx="56" cy="62" r="11" fill="none" stroke="#d4141c" strokeWidth="3" />
          <path d="M53 62h6M56 58v8" stroke="#d4141c" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="140" cy="116" r="9" fill="#ffffff" />
          <circle cx="24" cy="30" r="5" fill="#f5d5c0" />
        </svg>
      </Rise>
    </div>
  );
}
