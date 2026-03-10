/**
 * SupportPage — In-app support, links to contact page and help resources.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../config/branding';
import {
  HelpCircle, Mail, MessageSquare, BookOpen, ExternalLink,
} from 'lucide-react';

const SupportPage: React.FC = () => (
  <div className="page-container">
    <h1 className="page-title">TableTryb Support</h1>
    <p className="page-subtitle">Need help? We're here for you.</p>

    <div className="support-grid">
      <Link to="/contact" className="support-card" target="_blank">
        <MessageSquare size={28} />
        <h3>Contact Us</h3>
        <p>Send us a message and we'll respond within 1 business day.</p>
        <span className="support-link">Open contact form <ExternalLink size={14} /></span>
      </Link>

      <a href={`mailto:${BRAND.supportEmail}`} className="support-card">
        <Mail size={28} />
        <h3>Email Support</h3>
        <p>Reach us directly at {BRAND.supportEmail}</p>
        <span className="support-link">Send email <ExternalLink size={14} /></span>
      </a>

      <div className="support-card">
        <BookOpen size={28} />
        <h3>Getting Started</h3>
        <p>Import recipes, invite your family, and start planning meals together.</p>
        <span className="support-link">Coming soon</span>
      </div>

      <div className="support-card">
        <HelpCircle size={28} />
        <h3>FAQ</h3>
        <p>Answers to the most common questions about TableTryb.</p>
        <span className="support-link">Coming soon</span>
      </div>
    </div>
  </div>
);

export default SupportPage;
