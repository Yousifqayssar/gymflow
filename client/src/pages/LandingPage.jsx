import { Link } from 'react-router';
import { m } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownRight, CalendarCheck, Check, DoorOpen, MapPin, ScanLine, TrendingUp } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import Button from '../components/ui/Button.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';
import SocialIcon from '../components/ui/SocialIcon.jsx';
import { GYM, OPENING_HOURS, SOCIAL_LINKS } from '../config/gym.js';
import heroPhoto from '../assets/classes/strength.jpg';

// The year shown in the footer; set once when the page loads.
const YEAR = new Date().getFullYear();

// The public front page, shown to visitors who are not logged in (see App.jsx).
// Its job: explain GymFlow in a glance and lead to Join / Log in.
// Design note: the condensed display font (Barlow Condensed) is used large and tight, like gym
// signage, as the spine of the page; emerald is the only bold colour. See the frontend-design pass.

// One single page-load reveal for the hero; nothing else animates on its own. Reduced motion is
// respected automatically (MotionConfig reducedMotion="user" in main.jsx).
const reveal = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] } }),
};

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
    perks: ['Unlimited gym access', 'QR check-in at the door', 'Loyalty points on every visit'],
    featured: false,
  },
  {
    name: 'Premium',
    price: '1,500',
    pitch: 'The gym plus classes and the whole network.',
    perks: ['Everything in Basic', '10 group classes every month', 'Train at all 6 partner gyms', 'A free intro session with a trainer'],
    featured: true,
  },
];

function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-2 md:flex" aria-label="Page sections">
          <a href="#how" className="transition hover:text-ink">How it works</a>
          <a href="#plans" className="transition hover:text-ink">Plans</a>
          <a href="#network" className="transition hover:text-ink">Our gyms</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button as={Link} to="/login" variant="ghost">Log in</Button>
          <Button as={Link} to="/register">Join</Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      {/* object-right keeps the lifter out from under the signage, so the photo reads as a real gym. */}
      <img src={heroPhoto} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover object-[78%_center] opacity-80" />
      {/* Darken the left where the signage sits, so the type stays legible; let the right breathe. */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-slate-950 from-15% via-slate-950/75 to-transparent" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/30" />

      <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8">
        <m.p variants={reveal} initial="hidden" animate="show" custom={0} className="max-w-xl text-sm font-medium tracking-wide text-brand-300">
          A modern gym in Kadıköy, Istanbul
        </m.p>

        <m.h1
          variants={reveal}
          initial="hidden"
          animate="show"
          custom={1}
          className="mt-4 max-w-4xl font-display text-6xl font-bold uppercase leading-[0.88] tracking-tight text-white sm:text-7xl lg:text-[7.5rem]"
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
          <Button as={Link} to="/login" variant="secondary" className="border-white/25 bg-white/5 px-6 py-3 text-base text-white hover:bg-white/10">
            Log in
          </Button>
        </m.div>

        <a href="#how" className="mt-16 inline-flex w-fit items-center gap-2 text-sm text-slate-300 transition hover:text-white">
          See how it works
          <ArrowDownRight className="size-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 bg-canvas py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">From the street to your first workout in three steps</h2>
        <ol className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-5xl font-bold leading-none text-brand-600 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                <span className="h-px flex-1 translate-y-[-0.6rem] bg-line" aria-hidden="true" />
              </div>
              <step.icon className="mt-6 size-7 text-ink-2" aria-hidden="true" />
              <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">{step.title}</h3>
              <p className="mt-2 max-w-xs leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function OneCode() {
  return (
    <section className="bg-surface-2 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="order-2 lg:order-1">
          <h2 className="max-w-md font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">One code opens everything</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Your GymFlow QR code is your key to the whole network. There is nothing else to remember, and nothing to lose at the
            bottom of your bag.
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
                <QRCodeSVG value="https://gymflow-bw46.onrender.com" size={168} level="M" bgColor="#ffffff" fgColor="#0f172a" />
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

function Plans() {
  return (
    <section id="plans" className="scroll-mt-16 bg-canvas py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Pick the plan that fits how you train</h2>
        <p className="mt-4 max-w-xl text-lg text-muted">Monthly, with no long commitment. Three- and twelve-month plans save more, and you can see them all after you join.</p>

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
              <Button
                as={Link}
                to="/register"
                className={`mt-8 w-full py-3 text-base ${plan.featured ? '' : 'bg-brand-700 hover:bg-brand-800'}`}
              >
                Join with {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Network() {
  const districts = ['Kadıköy (our gym)', 'Beşiktaş', 'Üsküdar', 'Şişli', 'Ataşehir', 'Bakırköy'];
  return (
    <section id="network" className="scroll-mt-16 bg-surface-2 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Six gyms, one membership</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Premium members train at our Kadıköy gym and five partner gyms across Istanbul, all with the same QR code. Find the
            nearest one that is open right from your home screen.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
          {districts.map((district) => (
            <li key={district} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3">
              <MapPin className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
              <span className="font-medium text-ink-2">{district}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="bg-canvas pb-8 pt-20 sm:pt-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 px-8 py-16 text-center text-white sm:px-16">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-6xl">Your first workout is a few taps away</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-brand-50">Join today and check in with your QR code on your very first visit.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button as={Link} to="/register" variant="secondary" className="border-transparent bg-white px-6 py-3 text-base text-brand-800 hover:bg-brand-50">
              Join GymFlow
            </Button>
            <Button as={Link} to="/login" variant="ghost" className="px-6 py-3 text-base text-white hover:bg-white/10">
              Log in
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:grid-cols-3 lg:px-8">
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
                <span className="font-mono text-ink-3">{row.open}–{row.close}</span>
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
      <main>
        <Hero />
        <HowItWorks />
        <OneCode />
        <Plans />
        <Network />
        <ClosingCta />
      </main>
      <LandingFooter />
    </div>
  );
}

export default LandingPage;
