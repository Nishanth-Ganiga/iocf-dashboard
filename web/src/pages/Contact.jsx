import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../context/DashboardContext'
import { LoadingState, ErrorState } from '../components/StateViews'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import { IconBoard, IconPlayer, IconStadium, IconTrophy, IconChampion } from '../lib/icons'
import './Contact.css'

// Contact the Federation — static info page. There is no backend endpoint
// for form submission, so the form below never claims to send anything
// anywhere; it only shows an honest local confirmation on submit. The
// "board contacts" directory is the closest real thing the workbook has
// to a contact list (chairman per board).
export default function Contact() {
  const { data, loading, error } = useDashboard()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  const boards = data?.boards || []
  const stats = data?.stats

  return (
    <div className="page-enter">
      <div className="container">
        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Get in Touch</p>
              <h2>Contact the Federation</h2>
            </div>
          </div>

          <div className="contact-grid">
            <div className="glass-panel contact-form-panel">
              <h3 className="contact-form-panel__title">Send a Message</h3>
              <p className="text-dim contact-form-panel__note">
                This is a demo form — there is no backend wired up to receive submissions. Nothing
                you type here is emailed or sent anywhere; it only shows a local confirmation.
              </p>

              {submitted ? (
                <div className="contact-confirmation">
                  <p className="contact-confirmation__message">
                    <IconChampion className="contact-confirmation__icon" /> Thanks, {form.name || 'friend'} — this is a
                    demo form, no message was actually sent.
                  </p>
                  <button type="button" className="btn btn-ghost" onClick={() => setSubmitted(false)}>
                    Send another
                  </button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <label className="contact-form__field">
                    <span className="text-faint">Name</span>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                    />
                  </label>
                  <label className="contact-form__field">
                    <span className="text-faint">Email</span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                  <label className="contact-form__field">
                    <span className="text-faint">Message</span>
                    <textarea
                      name="message"
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="What's on your mind?"
                      required
                    />
                  </label>
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                </form>
              )}
            </div>

            <div className="glass-panel contact-glance-panel">
              <h3 className="contact-form-panel__title">IOCF at a Glance</h3>
              {loading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} />
              ) : stats ? (
                <div className="stat-grid contact-stat-grid">
                  <StatCard label="Total Boards" value={stats.totalBoards} icon={<IconBoard />} accent="gold" />
                  <StatCard label="Total Players" value={stats.totalPlayers} icon={<IconPlayer />} accent="neon" />
                  <StatCard label="Total Stadiums" value={stats.totalStadiums} icon={<IconStadium />} accent="gold" />
                  <StatCard label="Total Tournaments" value={stats.totalTournaments} icon={<IconTrophy />} accent="neon" />
                </div>
              ) : (
                <div className="empty-state">No summary stats available.</div>
              )}
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="section-header">
            <div>
              <p className="section-header__eyebrow">Board Leadership Directory</p>
              <h2>Who to Reach at Each Board</h2>
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : boards.length === 0 ? (
            <div className="empty-state">No boards recorded yet.</div>
          ) : (
            <div className="card-grid">
              {boards.map((b) => (
                <Link key={b.id} to={`/boards/${b.id}`} className="entity-card glass-panel contact-board-card">
                  <div className="entity-card__top">
                    <Badge name={b.name} size={44} />
                    <div>
                      <p className="entity-card__title">{b.name}</p>
                      <p className="entity-card__meta">Chairman: {b.chairman || '—'}</p>
                      {b.ceo && <p className="entity-card__meta">CEO: {b.ceo}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
