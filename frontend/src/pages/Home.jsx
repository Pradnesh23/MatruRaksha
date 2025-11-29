import React from 'react'
import motherImg from '../assets/mother-child.jpeg'
import { HeartPulse, FileText, Users, AlertTriangle, Pill, MessageSquare, PlayCircle, Building2, ShieldCheck, Workflow, BrainCircuit, Github } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

function SectionTitle({ title, subtitle }) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
    </div>
  )
}

function CTAButton({ children, variant = 'primary', href = '#' }) {
  const base = 'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2'
  const styles = variant === 'primary'
    ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-600'
    : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 focus:ring-indigo-600'
  return <a href={href} className={`${base} ${styles}`}>{children}</a>
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-6 h-6 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  )
}

function DemoCard({ id, src, caption }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <img id={id} src={src} alt={caption} className="w-full h-56 object-cover rounded-md" />
      <p className="text-sm text-gray-700 mt-3">{caption}</p>
    </div>
  )
}

function AudienceCard({ title, desc, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-6 h-6 ${color}`} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center">
      <div className="text-3xl font-bold text-indigo-600">{value}</div>
      <div className="text-sm text-gray-700 mt-2">{label}</div>
    </div>
  )
}

export default function Home() {
  const { i18n } = useTranslation()
  const changeLang = (e) => i18n.changeLanguage(e.target.value)
  return (
    <main className="bg-gradient-to-b from-indigo-50 via-white to-pink-50">
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">AI-Powered 24/7 Maternal Health Monitoring for Mothers in Low-Resource Settings.</h1>
            <p className="mt-4 text-lg text-gray-700">MatruRaksha-AI automates maternal risk assessment, report analysis, and care coordination using multi-agent AI and chat-first interfaces—no app required.</p>
            <div className="mt-6 flex flex-wrap gap-4">
              <CTAButton href="https://t.me/MatruRaksha_AI_Bot">Start a Chat on Telegram</CTAButton>
              <CTAButton variant="secondary" href="/auth/login"><PlayCircle className="w-5 h-5" /> View Dashboard</CTAButton>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
              <img id="hero-visual" src={motherImg} alt="Telegram bot + dashboard screenshot" className="w-full h-80 object-cover rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <SectionTitle title="The Problem" />
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <p className="text-gray-800">Every two minutes, a woman dies from preventable pregnancy complications. Frontline ASHA workers lack tools, real-time insights, and automated coordination, leading to late referrals and avoidable emergencies.</p>
          <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
            <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /> Fragmented medical records</li>
            <li className="flex items-center gap-2"><FileText className="w-4 h-4 text-yellow-600" /> Reports are unanalyzed PDFs</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-600" /> No proactive alerts</li>
            <li className="flex items-center gap-2"><Users className="w-4 h-4 text-green-600" /> High workload for ASHAs</li>
          </ul>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <SectionTitle title="The Solution – MatruRaksha-AI" />
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <p className="text-gray-800">A multi-agent AI platform that detects maternal risk early, analyzes medical documents instantly, and coordinates care across Telegram, WhatsApp, and web dashboards.</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="text-sm text-gray-700">Mother → Chatbot → Risk Score → Alerts → ASHA Dashboard → Escalation</div>
            <img id="flow-diagram" src={motherImg} alt="Flow Diagram: Mother → Chatbot → Risk Score → Alerts → ASHA Dashboard → Escalation" className="w-full h-56 object-cover rounded-md" />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <SectionTitle title="Key Features" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard icon={HeartPulse} title="AI Risk Agent — automated maternal risk scoring" desc="" />
          <FeatureCard icon={FileText} title="Document Analyzer — extract vitals & insights from PDFs/images" desc="" />
          <FeatureCard icon={Users} title="ASHA Dashboard — manage mothers, tasks, and follow-ups" desc="" />
          <FeatureCard icon={AlertTriangle} title="Emergency Agent — triage & escalation workflows" desc="" />
          <FeatureCard icon={Pill} title="Nutrition & Medication Guidance — personalized recommendations" desc="" />
          <FeatureCard icon={MessageSquare} title="No-App Adoption — available on Telegram & WhatsApp in multiple languages" desc="" />
        </div>
      </section>

      <section id="demo" className="max-w-7xl mx-auto px-6 py-12">
        <SectionTitle title="Demo / Screenshots" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DemoCard id="demo-telegram" src={motherImg} caption="Telegram bot flow" />
          <DemoCard id="demo-risk-dashboard" src={motherImg} caption="Risk dashboard" />
          <DemoCard id="demo-report-summary" src={motherImg} caption="AI-generated report summary" />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <SectionTitle title="Who It's For" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AudienceCard icon={MessageSquare} color="text-pink-600" title="Mothers — health reminders & summaries" desc="" />
          <AudienceCard icon={Users} color="text-green-600" title="ASHAs — automated tasks & simplified workflows" desc="" />
          <AudienceCard icon={Building2} color="text-indigo-600" title="Clinics / Govt Programs — population-level monitoring" desc="" />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <SectionTitle title="Impact Metrics" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard value="40%" label="reduction in manual risk evaluation time" />
          <StatCard value="5x" label="faster report processing" />
          <StatCard value="Low-bandwidth" label="deployment in rural India" />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <SectionTitle title="Why MatruRaksha Wins (Competitive Advantage)" />
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <ul className="space-y-2 text-gray-800">
            <li className="flex items-center gap-2"><Workflow className="w-4 h-4 text-indigo-600" /> Multi-agent orchestration</li>
            <li className="flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-pink-600" /> Report intelligence powered by Gemini</li>
            <li className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-green-600" /> Chat-first UX lowers literacy barriers</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-600" /> Designed for Bharat-scale healthcare systems</li>
          </ul>
        </div>
      </section>

      

      <footer id="contact" className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-pink-600" />
              <span className="font-bold text-gray-900">MatruRaksha AI</span>
            </div>
            <div className="text-sm text-gray-700">
              <Link to="/" className="hover:underline">Home</Link>
              <span className="mx-2">·</span>
              <Link to="/auth/login" className="hover:underline">Login</Link>
              <span className="mx-2">·</span>
              <Link to="/auth/signup" className="hover:underline">Signup</Link>
              <span className="mx-2">·</span>
              <a href="#privacy" className="hover:underline">Privacy Policy</a>
              <span className="mx-2">·</span>
              <a href="#terms" className="hover:underline">Terms</a>
            </div>
            <a href="https://t.me/MatruRaksha_AI_Bot" className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
              Start Chat on Telegram <span className="text-white/80">@MatruRaksha_AI_Bot</span>
            </a>
            <select aria-label="Language" onChange={changeLang} defaultValue={i18n.language || 'en'} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="mr">MR</option>
            </select>
            <div className="text-xs text-gray-600">© 2025 MatruRaksha AI · React · FastAPI · Supabase · Gemini</div>
          </div>
        </div>
      </footer>
    </main>
  )
}

