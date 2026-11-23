import { Link } from 'react-router';
import { m } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownRight, CalendarCheck, CalendarDays, Check, Clock, DoorOpen, MapPin, Plus, ScanLine, TrendingUp } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import Button from '../components/ui/Button.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import SocialIcon from '../components/ui/SocialIcon.jsx';
import { GYM, OPENING_HOURS, SOCIAL_LINKS } from '../config/gym.js';
import { CATEGORY_DISPLAY } from '../utils/classDisplay.js';
import heroPhoto from '../assets/classes/strength.webp';
// Real screens of the member app (demo member Elif, phone size), so visitors see the product itself.
import appHome from '../assets/landing/app-home.webp';
import appWorkouts from '../assets/landing/app-workouts.webp';
import appProgress from '../assets/landing/app-progress.webp';
import appFood from '../assets/landing/app-food.webp';
import appRewards from '../assets/landing/app-rewards.webp';

// The year shown in the footer; set once when the page loads.
const YEAR = new Date().getFullYear();

// The public front page, shown to visitors who are not logged in (see App.jsx).
// Its job: explain GymFlow in a glance and lead to Join / Log in.
// Design note: the condensed display font (Barlow Condensed) is used large and tight, like gym
// signage, as the spine of the page; emerald is the only bold colour. The one "loud" element is the
// hero with the real app on a phone; every section after it stays quiet.

// One single page-load reveal for the hero; nothing else animates on its own. Reduced motion is
// respected automatically (MotionConfig reducedMotion="user" in main.jsx).
const reveal = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] } }),
};

// Buttons on dark or green backgrounds. Written out in full instead of overriding a Button variant:
// two Tailwind classes for the same property do not override each other by their order in the list,
// which made the closing "Join GymFlow" button white-on-white in dark mode.
const ON_DARK_OUTLINE =
  'inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-base font-medium text-white transition hover:bg-white/10 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
const ON_GREEN_SOLID =
  'inline-flex items-center justify-center rounded-lg bg-slate-950 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-slate-950/30 transition hover:bg-slate-800 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

// Shared section spacing and the width of the content column.
const SECTION = 'scroll-mt-16 py-16 sm:py-24';
const WRAP = 'mx-auto max-w-6xl px-4 sm:px-6 lg:px-8';
const H2 = 'font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl';

// A real sequence, so numbered markers are honest here.
const STEPS = [
  { icon: CalendarCheck, title: 'Join online', text: 'Create your account and choose a plan in a couple of minutes.' },
  { icon: ScanLine, title: 'Scan to get in', text: 'Show your personal QR code at the door. Nothing to carry or lose.' },
  { icon: TrendingUp, title: 'Book, train, track', text: 'Reserve classes, follow your workout plan, and watch your progress.' },
];

const USES = [
  { icon: DoorOpen, label: 'Opens the front door' },
  { icon: CalendarCheck, label: 'Every class you book' },
  { icon: MapPin, label: 'All partner gyms in the city' },
];

const PLANS = [
  {
    name: 'Basic',
    price: '1,000',
    pitch: 'The full gym, seven days a week.',
    perks: ['Unlimited gym access', 'QR check-in at the door', 'Loyalty points on every visit', 'Book any class and pay per class'],
    featured: false,
  },
  {
    name: 'Premium',
    price: '1,500',
    pitch: 'The gym plus classes and the whole network.',
    perks: ['Everything in Basic', '10 group classes every month', 'Train at all 5 partner gyms', 'Extra classes 30% cheaper'],
    featured: true,
  },
];

// What members do in the app besides getting in. Each one is shown with its real screen.
const FEATURES = [
  { title: 'Your trainer’s plan', text: 'Workouts written for you, exercise by exercise, with sets, reps and rest times.', image: appWorkouts },
  { title: 'Progress you can see', text: 'Every saved workout adds up: weeks in a row, kilos lifted and hours trained.', image: appProgress },
  { title: 'Food scanner', text: 'Take a photo of your meal and get an estimate of its calories, protein, carbs and fat.', image: appFood },
  { title: 'Points for showing up', text: '10 points for every visit. Silver, Gold and Platinum take 5 to 15% off your next membership.', image: appRewards },
];

// Answers follow how GymFlow really works (see the README "Membership rules" and "Class and booking rules").
const FAQ = [
  {
    q: 'Do I need a membership card?',
    a: 'No. After you join, the app shows your personal QR code. Staff scan it at the entrance, and it also works at the partner gyms with Premium.',
  },
  {
    q: 'Does my membership renew automatically?',
    a: 'No. A membership simply ends on its last day, and nothing is charged after that. You can renew in the app; the new membership starts the day after the old one ends.',
  },
  {
    q: 'Can I take classes with Basic?',
    a: 'Yes. Basic members book a class and pay for that one class. Premium includes 10 classes a month, and extra classes after that cost 30% less.',
  },
  {
    q: 'What if I cannot make it to a class I booked?',
    a: 'Cancel it in the app any time before it starts. A cancelled class goes back to your monthly allowance, and a paid class is refunded.',
  },
  {
    q: 'How do I pay?',
    a: 'By card in the app, or at the front desk. You see the dates and the price before you pay, and every payment has a receipt in the app.',
  },
];

// The class types, in the order members see them in the app.
const CLASS_TYPES = ['RUNNING', 'YOGA', 'HIIT', 'CYCLING', 'PILATES', 'BOXING', 'STRENGTH', 'MOBILITY'];

function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
      <div className={`${WRAP} flex h-16 items-center justify-between gap-4`}>
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-2 md:flex" aria-label="Page sections">
          <a href="#how" className="transition hover:text-ink">How it works</a>
          <a href="#classes" className="transition hover:text-ink">Classes</a>
          <a href="#plans" className="transition hover:text-ink">Plans</a>
          <a href="#network" className="transition hover:text-ink">Our gyms</a>
          <a href="#faq" className="transition hover:text-ink">FAQ</a>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button as={Link} to="/login" variant="ghost">Log in</Button>
          <Button as={Link} to="/register">Join</Button>
        </div>
      </div>
    </header>
  );
}

// A phone outline around a real app screen.
function Phone({ src, alt, className = '' }) {
  return (
    <div className={`rounded-[2.4rem] bg-slate-900 p-2 shadow-2xl ring-1 ring-white/10 ${className}`}>
      <img src={src} alt={alt} width="600" height="1298" className="block w-full rounded-[1.9rem]" />
    </div>
  );
}

// Short facts under the hero buttons, taken from the gym's real details.
function HeroFacts() {
  const weekday = OPENING_HOURS[0];
  const facts = [
    { icon: Clock, text: `Open 7 days, weekdays ${weekday.open}–${weekday.close}` },
    { icon: CalendarDays, text: `${CLASS_TYPES.length} kinds of classes every week` },
    { icon: MapPin, text: '6 gyms with one QR code' },
  ];
  return (
    <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-300">
      {facts.map((fact) => (
        <li key={fact.text} className="flex items-center gap-2">
          <fact.icon className="size-4 text-brand-400" aria-hidden="true" />
          {fact.text}
        </li>
      ))}
    </ul>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <img src={heroPhoto} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover object-[70%_center] brightness-150 saturate-125" />
      {/* Darken the left where the text sits so it stays legible; the right keeps more of the photo. */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-slate-950 from-25% via-slate-950/75 via-50% to-slate-950/10" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent via-40% to-transparent" />

      <div className={`${WRAP} relative grid items-center gap-14 py-16 sm:py-20 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.2fr_0.8fr] lg:py-16`}>
        <div>
          <m.p variants={reveal} initial="hidden" animate="show" custom={0} className="text-sm font-medium tracking-wide text-brand-300">
            A modern gym in Kadıköy, Istanbul
          </m.p>

          <m.h1
            variants={reveal}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-4 font-display text-6xl font-bold uppercase leading-[0.88] tracking-tight text-white sm:text-7xl lg:text-[6.75rem]"
          >
            Train smarter.
            <span className="block text-brand-400">Feel stronger.</span>
          </m.h1>

          <m.p variants={reveal} initial="hidden" animate="show" custom={2} className="mt-7 max-w-xl text-lg leading-relaxed text-slate-200">
            Your whole gym in one app. Membership, check-in, classes and progress — handled with a single QR code, no plastic card
            and no paper schedule.
          </m.p>

          <m.div variants={reveal} initial="hidden" animate="show" custom={3} className="mt-9 flex flex-wrap items-center gap-3">
            <Button as={Link} to="/register" className="px-6 py-3 text-base">Join GymFlow</Button>
            <Link to="/login" className={ON_DARK_OUTLINE}>Log in</Link>
          </m.div>

          <m.div variants={reveal} initial="hidden" animate="show" custom={4}>
            <HeroFacts />
          </m.div>
        </div>

        <m.div variants={reveal} initial="hidden" animate="show" custom={3} className="mx-auto w-full max-w-[13rem] sm:max-w-[17rem] lg:max-w-[19rem]">
          <Phone src={appHome} alt="The GymFlow app on a phone: a member's home screen with the QR code button, class booking and gym numbers" className="rotate-2" />
        </m.div>
      </div>

      <a href="#how" className={`${WRAP} relative flex w-full items-center gap-2 pb-8 text-sm text-slate-300 transition hover:text-white`}>
        See how it works
        <ArrowDownRight className="size-4" aria-hidden="true" />
      </a>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className={`${SECTION} bg-canvas`}>
      <div className={WRAP}>
        <h2 className={`${H2} max-w-2xl`}>From the street to your first workout in three steps</h2>
        <ol className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <div className="flex items-baseline gap-4">
                <span className="font-display text-5xl font-bold leading-none text-brand-600 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                <span className="h-px flex-1 translate-y-[-0.6rem] bg-line" aria-hidden="true" />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <step.icon className="size-6 text-ink-2" aria-hidden="true" />
                <h3 className="font-display text-2xl font-bold tracking-tight text-ink">{step.title}</h3>
              </div>
              <p className="mt-2 max-w-xs leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Classes() {
  return (
    <section id="classes" className={`${SECTION} bg-surface`}>
      <div className={WRAP}>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 className={H2}>Classes for every way you like to train</h2>
          <p className="max-w-lg text-lg leading-relaxed text-muted">
            Small groups led by certified trainers, from calm yoga to boxing. Book a spot in the app and see how many places are left.
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CLASS_TYPES.map((key) => {
            const category = CATEGORY_DISPLAY[key];
            return (
              <li key={key} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-900 sm:aspect-[4/3] lg:aspect-[4/5]">
                <img src={category.photo} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-4 text-white">
                  <category.icon className="size-5 shrink-0 text-brand-300" aria-hidden="true" />
                  <span className="font-display text-2xl font-bold tracking-tight">{category.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function OneCode() {
  return (
    <section className={`${SECTION} bg-canvas`}>
      <div className={`${WRAP} grid items-center gap-14 lg:grid-cols-2`}>
        <div className="order-2 lg:order-1">
          <h2 className={`${H2} max-w-md`}>One code opens everything</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Your GymFlow QR code is your key to the whole network. There is nothing else to remember, and nothing to lose at the
            bottom of your bag. Lost your phone? Make a new code in the app and the old one stops working.
          </p>
          <ul className="mt-8 space-y-4">
            {USES.map((use) => (
              <li key={use.label} className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  <use.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-lg font-medium text-ink-2">{use.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* A representative member card – the same shape members carry in the app. */}
        <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <div className="w-full max-w-xs rotate-1 overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-br from-brand-600 to-brand-900 px-6 py-5 text-white">
              <Logo inverted />
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">Premium</span>
            </div>
            <div className="flex flex-col items-center gap-4 px-6 py-8">
              <div className="rounded-2xl bg-white p-4 shadow-inner">
                <QRCodeSVG value="https://gymflow-bw46.onrender.com" size={168} level="M" bgColor="#ffffff" fgColor="#0f172a" title="Example member QR code" />
              </div>
              <p className="font-mono text-sm tracking-wider text-muted">GF-00042</p>
              <p className="text-lg font-semibold text-ink">Your name here</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className={`${SECTION} bg-surface`}>
      <div className={WRAP}>
        <h2 className={`${H2} max-w-2xl`}>Everything after the door is in the app too</h2>
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:mt-12 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              {/* Only the top of each screen is shown, so four phones fit side by side. */}
              <div className="aspect-[4/5] overflow-hidden rounded-t-[1.4rem] bg-slate-900 px-1.5 pt-1.5 sm:rounded-t-[2rem] sm:px-2 sm:pt-2 dark:ring-1 dark:ring-line">
                <img src={feature.image} alt={`GymFlow app screen: ${feature.title.toLowerCase()}`} loading="lazy" decoding="async" width="600" height="1298" className="block w-full rounded-t-[1.1rem] sm:rounded-t-[1.6rem]" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-ink sm:mt-5 sm:text-2xl">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-base">{feature.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Plans() {
  return (
    <section id="plans" className={`${SECTION} bg-canvas`}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className={`${H2} max-w-2xl`}>Pick the plan that fits how you train</h2>
        <p className="mt-4 max-w-xl text-lg text-muted">Monthly, with no automatic renewal. Three- and twelve-month plans save more, and you can see them all after you join.</p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-2xl p-8 ${
                plan.featured
                  ? 'bg-slate-950 text-white shadow-xl ring-1 ring-brand-600/40 dark:bg-slate-900'
                  : 'border border-line bg-surface text-ink'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-3xl font-bold tracking-tight">{plan.name}</h3>
                {plan.featured && <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-300">Most popular</span>}
              </div>
              <p className={`mt-2 ${plan.featured ? 'text-slate-300' : 'text-muted'}`}>{plan.pitch}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-bold tracking-tight">₺{plan.price}</span>
                <span className={plan.featured ? 'text-slate-400' : 'text-faint'}>/ month</span>
              </p>
              <ul className="mt-7 flex-1 space-y-3">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5">
                    <Check className={`mt-0.5 size-5 shrink-0 ${plan.featured ? 'text-brand-400' : 'text-brand-600'}`} aria-hidden="true" />
                    <span className={plan.featured ? 'text-slate-200' : 'text-ink-2'}>{perk}</span>
                  </li>
                ))}
              </ul>
              <Button as={Link} to="/register" className="mt-8 w-full py-3 text-base">
                Join with {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// A simple drawing of Istanbul: Europe on the left, Asia on the right, the Bosphorus between them and
// the Sea of Marmara at the bottom. Positions follow the real districts, roughly.
const GYM_PINS = [
  { name: 'Kadıköy', x: 368, y: 262, home: true, label: 'right' },
  { name: 'Üsküdar', x: 378, y: 182, label: 'right' },
  { name: 'Ataşehir', x: 452, y: 214, label: 'right' },
  { name: 'Beşiktaş', x: 296, y: 150, label: 'left' },
  { name: 'Şişli', x: 248, y: 104, label: 'left' },
  { name: 'Bakırköy', x: 86, y: 252, label: 'right' },
];

function IstanbulMap() {
  return (
    <svg
      viewBox="0 0 560 360"
      role="img"
      aria-label="Map of Istanbul: our gym in Kadıköy and partner gyms in Üsküdar, Ataşehir, Beşiktaş, Şişli and Bakırköy"
      className="w-full rounded-2xl border border-line bg-surface"
    >
      {/* Sea of Marmara, the Golden Horn and the Bosphorus */}
      <path d="M0 290 C120 275 230 300 300 268 C330 254 345 250 360 290 C390 320 470 300 560 312 L560 360 L0 360 Z" className="fill-sky-100 dark:fill-sky-500/15" />
      <path d="M330 0 C322 60 340 95 318 140 C302 175 330 205 322 240 C318 255 300 262 300 268 L360 290 C352 262 350 240 356 215 C366 170 345 130 360 80 C368 50 360 20 366 0 Z" className="fill-sky-100 dark:fill-sky-500/15" />
      <path d="M318 196 C290 190 262 198 236 186 L232 194 C262 210 292 206 320 210 Z" className="fill-sky-100 dark:fill-sky-500/15" />
      <text x="40" y="40" className="fill-faint text-[16px]">Europe</text>
      <text x="480" y="40" className="fill-faint text-[16px]">Asia</text>
      <text x="200" y="335" className="fill-sky-700/70 text-[14px] italic dark:fill-sky-300/60">Sea of Marmara</text>
      {GYM_PINS.map((pin) => (
        <g key={pin.name}>
          {pin.home && <circle cx={pin.x} cy={pin.y} r="15" className="fill-brand-500/20" />}
          <circle cx={pin.x} cy={pin.y} r={pin.home ? 8 : 6} className={pin.home ? 'fill-brand-600' : 'fill-surface stroke-brand-600'} strokeWidth="3" />
          <text
            x={pin.label === 'left' ? pin.x - 14 : pin.x + 14}
            y={pin.y + 5}
            textAnchor={pin.label === 'left' ? 'end' : 'start'}
            className={`text-[17px] ${pin.home ? 'fill-ink font-semibold' : 'fill-ink-2'}`}
          >
            {pin.home ? `${pin.name} – our gym` : pin.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Network() {
  return (
    <section id="network" className={`${SECTION} bg-surface`}>
      <div className={`${WRAP} grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]`}>
        <div>
          <h2 className={H2}>Six gyms, one membership</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Premium members train at our Kadıköy gym and at five partner gyms on both sides of the Bosphorus, all with the same QR code.
            The app shows the nearest one that is open right now.
          </p>
          <p className="mt-6 flex items-center gap-3 text-sm text-muted">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-brand-600" aria-hidden="true" />Our gym</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-full border-[3px] border-brand-600" aria-hidden="true" />Partner gym</span>
          </p>
        </div>
        <IstanbulMap />
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className={`${SECTION} bg-canvas`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className={H2}>Questions before you join</h2>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {FAQ.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus className="size-5 shrink-0 text-brand-600 transition group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="max-w-2xl pb-6 leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="bg-canvas pb-16 sm:pb-24">
      <div className={WRAP}>
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 px-6 py-14 text-center text-white sm:px-16 sm:py-16">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-6xl">Your first workout is a few taps away</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-brand-50">Join today and check in with your QR code on your very first visit.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className={ON_GREEN_SOLID}>Join GymFlow</Link>
            <Link to="/login" className={ON_DARK_OUTLINE}>Log in</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className={`${WRAP} grid gap-10 py-14 sm:grid-cols-3`}>
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">{GYM.tagline}</p>
          <ul className="mt-4 flex gap-2" aria-label="Social media">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.platform}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="flex size-10 items-center justify-center rounded-xl border border-line text-ink-3 transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                >
                  <SocialIcon platform={social.platform} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-ink">Opening hours</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {OPENING_HOURS.map((row) => (
              <li key={row.label} className="flex justify-between gap-4">
                <span>{row.label}</span>
                <span className="tabular-nums text-ink-3">{row.open}–{row.close}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-ink">Visit us</h3>
          <address className="mt-3 space-y-1.5 text-sm text-muted not-italic">
            <p>{GYM.address[0]}</p>
            <p>{GYM.address[1]}</p>
            <p>
              <a href={`mailto:${GYM.email}`} className="text-brand-700 hover:underline dark:text-brand-300">{GYM.email}</a>
            </p>
          </address>
        </div>
      </div>
      <div className="border-t border-line-soft py-5 text-center text-xs text-faint">© {YEAR} {GYM.name}. All rights reserved.</div>
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <TopBar />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Classes />
        <OneCode />
        <Features />
        <Plans />
        <Network />
        <Faq />
        <ClosingCta />
      </main>
      <LandingFooter />
    </div>
  );
}

export default LandingPage;
