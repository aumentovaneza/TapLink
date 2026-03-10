import { useState } from "react";
import { Link } from "react-router";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ArrowRight, HelpCircle, Shield, Tag, User, BarChart3 } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const faqSections: Array<{ title: string; icon: typeof HelpCircle; items: FaqItem[] }> = [
  {
    title: "Getting Started",
    icon: Tag,
    items: [
      {
        question: "How do I get started with Taparoo?",
        answer:
          "Start by choosing your hardware type in Hardware Setup, then customize color and details, and link it to your profile before activating.",
      },
      {
        question: "What hardware types can I order?",
        answer:
          "Taparoo supports multiple NFC form factors such as tags and cards. Available options are shown in the hardware setup flow.",
      },
      {
        question: "Do scanners need an app to view my profile?",
        answer:
          "No. Anyone with an NFC-enabled phone can tap and open your profile directly in their browser.",
      },
    ],
  },
  {
    title: "Profiles & Ownership",
    icon: User,
    items: [
      {
        question: "Can I update my profile after ordering?",
        answer:
          "Yes. You can edit your profile any time and changes are reflected instantly when people tap your NFC hardware.",
      },
      {
        question: "Can one account manage multiple tags?",
        answer:
          "Yes. You can manage multiple tags and linked profiles from your account dashboard.",
      },
      {
        question: "What happens if a team member leaves?",
        answer:
          "You can reassign ownership and re-link the hardware to another profile without replacing the physical tag/card.",
      },
    ],
  },
  {
    title: "Analytics & Security",
    icon: BarChart3,
    items: [
      {
        question: "What analytics do I get?",
        answer:
          "Taparoo provides tap and engagement visibility so you can track activity and profile interactions over time.",
      },
      {
        question: "Can I disable a tag if it is lost?",
        answer:
          "Yes. You can deactivate hardware from your account controls and reactivate or reassign later.",
      },
      {
        question: "How is profile access controlled?",
        answer:
          "Profiles are tied to account ownership and hardware linkage so management actions are controlled by authorized users.",
      },
    ],
  },
  {
    title: "Support",
    icon: Shield,
    items: [
      {
        question: "Where can I preview templates before buying?",
        answer:
          "Open the template gallery to preview profile styles and choose the one that matches your use case.",
      },
      {
        question: "Who should I contact for order issues?",
        answer:
          "Use your account order page first, then contact support through your workspace/admin support channel for payment or fulfillment issues.",
      },
      {
        question: "Can I upgrade or change my setup later?",
        answer:
          "Yes. You can update profile content, switch templates, and order additional hardware as your needs grow.",
      },
    ],
  },
];

export function Faq() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [openId, setOpenId] = useState<string>("0-0");

  const bg = isDark ? "bg-slate-950 text-white" : "bg-[#FAFAFA] text-[#1C0500]";
  const card = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const heading = isDark ? "text-white" : "text-[#1C0500]";

  return (
    <div className={bg}>
      <section className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 15%, rgba(220,38,38,0.15) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-sm"
              style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.18)", color: "#DC2626" }}
            >
              <HelpCircle size={13} />
              <span style={{ fontWeight: 600 }}>Frequently Asked Questions</span>
            </div>

            <h1
              className={`mb-4 ${heading}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2rem, 4.8vw, 3.4rem)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em" }}
            >
              Everything you need to know
              <br />
              about Taparoo
            </h1>

            <p className={`max-w-2xl mx-auto ${muted}`} style={{ fontSize: "1.03rem", lineHeight: 1.75 }}>
              Find answers on ordering hardware, profile setup, ownership controls, and tap analytics.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {faqSections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIndex * 0.06 }}
                className={`rounded-3xl border ${card}`}
              >
                <div className="px-6 py-5 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(220,38,38,0.11)" }}>
                      <Icon size={15} style={{ color: "#DC2626" }} />
                    </div>
                    <h2 className={heading} style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "-0.01em" }}>
                      {section.title}
                    </h2>
                  </div>
                </div>

                <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {section.items.map((item, itemIndex) => {
                    const id = `${sectionIndex}-${itemIndex}`;
                    const isOpen = openId === id;
                    return (
                      <div key={item.question} className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setOpenId(isOpen ? "" : id)}
                          className="w-full text-left flex items-start justify-between gap-4"
                        >
                          <span className={heading} style={{ fontWeight: 600, lineHeight: 1.45 }}>{item.question}</span>
                          <ChevronDown
                            size={18}
                            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
                            style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen ? (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`overflow-hidden mt-3 pr-8 ${muted}`}
                              style={{ lineHeight: 1.7 }}
                            >
                              {item.answer}
                            </motion.p>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}

          <div className="pt-2 text-center">
            <Link
              to="/hardware-setup"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)", fontWeight: 700, boxShadow: "0 8px 28px rgba(220,38,38,0.32)" }}
            >
              Start Your One-Tap Setup
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
