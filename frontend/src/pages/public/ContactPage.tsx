/**
 * ContactPage — Professional SaaS contact page.
 * Two-column layout: form on left, company info + quick-links on right.
 * Form submits to POST /v1/contact which sends via SES.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../config/branding';
import {
  Mail, MessageSquare, Clock, HelpCircle,
  Send, CheckCircle, AlertCircle, BookOpen,
  CreditCard, Users, ArrowRight,
} from 'lucide-react';

type ContactSubject =
  | ''
  | 'general'
  | 'support'
  | 'billing'
  | 'feature-request'
  | 'bug-report'
  | 'partnership';

const SUBJECTS: { value: ContactSubject; label: string }[] = [
  { value: '', label: 'Select a topic...' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Technical Support' },
  { value: 'billing', label: 'Billing & Subscription' },
  { value: 'feature-request', label: 'Feature Request' },
  { value: 'bug-report', label: 'Bug Report' },
  { value: 'partnership', label: 'Partnership / Business' },
];

const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<ContactSubject>('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const res = await fetch(`${apiUrl}/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to send message');
      }

      setStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="contact-page">
      {/* Header */}
      <div className="contact-header">
        <h1>Get in touch</h1>
        <p>
          Have a question, suggestion, or just want to say hello?
          We'd love to hear from you.
        </p>
      </div>

      <div className="contact-grid">
        {/* ================================================================
           LEFT — Contact form
           ================================================================ */}
        <div className="contact-form-card">
          {status === 'success' ? (
            <div className="contact-success">
              <CheckCircle size={48} />
              <h3>Message sent!</h3>
              <p>
                Thanks for reaching out. We'll get back to you
                within 1 business day.
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => setStatus('idle')}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-name">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    className="form-input"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-email">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-subject">
                  Topic
                </label>
                <select
                  id="contact-subject"
                  className="form-input form-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as ContactSubject)}
                  required
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value} disabled={!s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-message">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  className="form-input form-textarea"
                  placeholder="Tell us how we can help..."
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={10}
                />
              </div>

              {status === 'error' && (
                <div className="contact-error">
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={status === 'sending'}
                style={{ width: '100%' }}
              >
                {status === 'sending' ? (
                  'Sending...'
                ) : (
                  <>
                    Send Message
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* ================================================================
           RIGHT — Info sidebar
           ================================================================ */}
        <aside className="contact-sidebar">
          {/* Direct email */}
          <div className="contact-info-card">
            <div className="contact-info-icon">
              <Mail size={22} />
            </div>
            <div>
              <h4>Email Us Directly</h4>
              <a href={`mailto:${BRAND.supportEmail}`}>
                {BRAND.supportEmail}
              </a>
            </div>
          </div>

          {/* Response time */}
          <div className="contact-info-card">
            <div className="contact-info-icon">
              <Clock size={22} />
            </div>
            <div>
              <h4>Response Time</h4>
              <p>We typically respond within 24 hours on business days.</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="contact-quick-links">
            <h4>Common Questions</h4>

            <Link to="/pricing" className="contact-quick-link">
              <CreditCard size={18} />
              <span>Pricing & billing</span>
              <ArrowRight size={14} />
            </Link>

            <a href={`mailto:${BRAND.supportEmail}?subject=Account Help`} className="contact-quick-link">
              <Users size={18} />
              <span>Account & household help</span>
              <ArrowRight size={14} />
            </a>

            <a href={`mailto:${BRAND.supportEmail}?subject=Recipe Import Help`} className="contact-quick-link">
              <BookOpen size={18} />
              <span>Recipe import issues</span>
              <ArrowRight size={14} />
            </a>

            <a href={`mailto:${BRAND.supportEmail}?subject=Feature Request`} className="contact-quick-link">
              <MessageSquare size={18} />
              <span>Request a feature</span>
              <ArrowRight size={14} />
            </a>

            <a href={`mailto:${BRAND.supportEmail}?subject=Bug Report`} className="contact-quick-link">
              <HelpCircle size={18} />
              <span>Report a bug</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Company info */}
          <div className="contact-company">
            <p>&copy; {new Date().getFullYear()} {BRAND.company}</p>
            <p>Austin, Texas</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ContactPage;
