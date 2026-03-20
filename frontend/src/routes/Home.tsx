import { Link } from "react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  LayoutDashboard,
  MessageCircle,
  TrendingUp,
  Shield,
  ArrowRight,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneSimulator } from "@/components/PhoneSimulator";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const opacityFade = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="relative min-h-screen bg-(--bg-primary) text-(--text-primary) overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 w-[800px] h-[600px] -translate-x-1/2 rounded-[100%] bg-(--green-500)/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 w-[600px] h-[600px] -translate-y-1/2 rounded-[100%] bg-blue-500/10 blur-[120px]" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-1.5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-(--green-600) to-(--green-400) opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-[1px] bg-(--bg-tertiary) rounded-[10px]" />
              <img src="/logo.png" alt="SMB Bookkeeper" className="relative h-full w-full object-contain filter invert z-10" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              StarkZap SMB
            </span>
          </div>
          <Link to="/login">
            <Button className="gap-2 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-(--green-500) to-(--green-400) opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <LayoutDashboard className="h-4 w-4 relative z-10" />
              <span className="relative z-10 font-semibold text-sm">Open Dashboard</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 pb-32 pt-16 lg:pt-24 z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            className="text-left"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-(--green-500)/30 bg-(--green-500)/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-(--green-400) mb-8">
              <Zap className="h-3.5 w-3.5" />
              <span>AI for Informal Economy</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.05]">
              Bookkeeping
              <br />
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-(--green-400) via-(--green-500) to-teal-400 pb-2 inline-block">
                simplified.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-(--text-secondary) leading-relaxed">
              Send sales and expenses via WhatsApp in plain English or Nigerian Pidgin. We automatically log, categorize, and organize your finances.
            </p>

            <ul className="space-y-4 mt-8">
              {["No complex apps to learn", "Automatic debt tracking", "Generates credit scores instantly"].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm font-medium text-(--text-primary)/80">
                  <CheckCircle2 className="h-5 w-5 text-(--green-500)" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <Link to="/login">
                <Button size="lg" className="h-14 px-8 text-base shadow-(--shadow-glow-green) transition-shadow hover:shadow-none hover:scale-[1.02]">
                  Login / Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a
                href="https://wa.me"
                target="_blank"
                rel="noreferrer"
                className="group relative inline-flex h-14 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 text-base font-medium text-white transition-all hover:bg-white/10 backdrop-blur-md"
              >
                <MessageCircle className="h-5 w-5 text-(--green-400) transition-transform group-hover:scale-110" />
                Connect WhatsApp
              </a>
            </div>
          </motion.div>

          <motion.div
            className="flex justify-center lg:justify-end perspective-[1200px]"
            initial={{ opacity: 0, y: 40, rotateY: 10, rotateX: 5 }}
            animate={{ opacity: 1, y: 0, rotateY: -10, rotateX: 5 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative group">
              <div className="absolute -inset-1 rounded-[3.5rem] bg-gradient-to-tr from-(--green-500) to-teal-500 opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-1000" />
              <div className="relative transform-gpu transition-transform duration-700 ease-out hover:rotate-y-0 hover:rotate-x-0">
                <PhoneSimulator />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.section
          className="mt-32 border-t border-white/5 pt-24"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Enterprise power, consumer simplicity.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                title: "WhatsApp-Native",
                desc: "Send a voice note or type naturally. Our NLP engine instantly parses the data into structured financial records.",
                color: "text-(--green-400)",
                bg: "bg-(--green-500)/10",
              },
              {
                icon: TrendingUp,
                title: "Live Dashboard",
                desc: "Watch your numbers update in real-time as texts arrive. Visualize revenue, cash flow, and top products seamlessly.",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                icon: Shield,
                title: "FairScale Score",
                desc: "Build verifiable, on-chain credit history based on cash flows. Instantly approved for microfinance loans.",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:bg-white/[0.04] hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg} ${item.color} mb-6 transition-transform group-hover:scale-110`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white/90">{item.title}</h3>
                  <p className="mt-4 text-sm text-(--text-secondary) leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.section>
      </main>
    </div>
  );
}
