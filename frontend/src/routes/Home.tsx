import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessageCircle,
  TrendingUp,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-(--bg-primary) text-(--text-primary)">
      <header className="border-b border-(--border) bg-(--bg-secondary)/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--border) bg-white p-1.5">
              <img src="/logo.png" alt="SMB Bookkeeper" className="h-full w-full object-contain" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SMB Bookkeeper</span>
          </div>
          <Link to="/dashboard">
            <Button className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Open dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <motion.section
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Bookkeeping for Nigeria&apos;s
            <br />
            <span className="text-(--green-400)">informal economy</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-(--text-secondary) leading-relaxed">
            Send sales and expenses via WhatsApp. Get a clear dashboard, debt tracking,
            and a credit score that microfinance can use.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 text-base">
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a
              href="https://wa.me"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-(--border) bg-(--bg-tertiary)/50 px-5 py-2.5 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-tertiary)"
            >
              <MessageCircle className="h-4 w-4" />
              Connect WhatsApp
            </a>
          </div>
        </motion.section>

        <motion.section
          className="mt-24 grid gap-8 sm:grid-cols-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {[
            {
              icon: MessageCircle,
              title: "WhatsApp-first",
              desc: "Log sales and expenses in Pidgin or English. No app to learn.",
            },
            {
              icon: TrendingUp,
              title: "Dashboard & reports",
              desc: "Revenue vs expenses, top products, debtors, and profit trends.",
            },
            {
              icon: Shield,
              title: "Credit score",
              desc: "90-day financial health profile for microloans and growth.",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-(--border) bg-[rgba(255,255,255,0.03)] p-6 shadow-(--shadow-sm) backdrop-blur transition-shadow hover:shadow-(--shadow-md)"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-(--border) bg-(--bg-tertiary) text-(--green-400)">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm text-(--text-secondary) leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </motion.section>

        <motion.div
          className="mt-24 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-sm text-(--text-tertiary)">
            Built for Nigerian SMBs · ₦2,000/month Pro for credit score &amp; full history
          </p>
        </motion.div>
      </main>
    </div>
  );
}
