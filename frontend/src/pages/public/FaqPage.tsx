/**
 * FaqPage — Public FAQ with accordion sections.
 * Categories: General, Pricing & Billing, Recipe Import & AI,
 *             Family Voting, Grocery Lists, Account & Privacy.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../config/branding';
import {
  ChevronDown, HelpCircle, CreditCard, Camera,
  ThumbsUp, ShoppingCart, Shield, ArrowRight,
} from 'lucide-react';

/* ----------------------------------------------------------------
   FAQ Data
   ---------------------------------------------------------------- */
interface FaqItem {
  q: string;
  a: string | React.ReactNode;
}

interface FaqCategory {
  id: string;
  icon: React.ElementType;
  title: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqCategory[] = [
  {
    id: 'general',
    icon: HelpCircle,
    title: 'General',
    items: [
      {
        q: 'What is TableTryb?',
        a: `${BRAND.name} is a meal planning app built for families and households. Import recipes from anywhere, vote on what to eat each week, and get a smart grocery list you can take to the store — or push directly to your Kroger cart.`,
      },
      {
        q: 'Who is TableTryb for?',
        a: 'Any household that wants to plan meals together — families, roommates, couples, or anyone tired of the nightly "what\'s for dinner?" debate.',
      },
      {
        q: 'What devices does it work on?',
        a: `${BRAND.name} is a web app that works on any device with a modern browser — laptops, tablets, and phones. Plan meals on your computer and pull up your grocery list on your phone at the store.`,
      },
      {
        q: 'Do I need to download an app?',
        a: 'No download needed. TableTryb runs in your browser. You can add it to your phone\'s home screen for an app-like experience.',
      },
    ],
  },
  {
    id: 'pricing',
    icon: CreditCard,
    title: 'Pricing & Billing',
    items: [
      {
        q: 'How much does TableTryb cost?',
        a: '$4.99/month or $49.99/year (save 17%). One plan includes everything — unlimited recipes, unlimited household members, AI recipe import, smart grocery lists, and store integrations.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes! Every account starts with a 14-day free trial with full access to all features. You\'ll enter a payment method upfront, but won\'t be charged until the trial ends.',
      },
      {
        q: 'What happens when the free trial ends?',
        a: 'Your selected plan (monthly or annual) begins automatically. You\'ll receive an email reminder before your trial ends so there are no surprises.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Absolutely. You can cancel from your billing portal at any time. If you cancel, you\'ll keep access through the end of your current billing period. After that, your account becomes read-only — you can still view and export your recipes and lists, but can\'t create new ones or vote.',
      },
      {
        q: 'How do I manage my subscription?',
        a: 'The account holder can manage billing — update payment methods, switch between monthly and annual, view invoices, or cancel — from the Profile page inside the app.',
      },
    ],
  },
  {
    id: 'recipes',
    icon: Camera,
    title: 'Recipe Import & AI',
    items: [
      {
        q: 'How do I add recipes?',
        a: 'Three ways: snap a photo of a recipe card or cookbook page, paste a website address (URL), or type it in manually. Our AI extracts the ingredients and instructions automatically from photos and URLs.',
      },
      {
        q: 'What does the AI actually do?',
        a: 'When you import a recipe by photo or URL, AI reads the content and extracts the structured data — title, ingredients with quantities, and step-by-step instructions. You can review and edit everything at anytime.',
      },
      {
        q: 'How accurate is the AI import?',
        a: 'It handles most recipes very well, especially clearly formatted ones. We always show you the extracted result so you can correct anything before saving. Handwritten recipe cards and unusual layouts may need a little editing depending upon the quality of the handwriting.',
      },
      {
        q: 'Is there a limit on recipes?',
        a: 'No — you can save unlimited recipes on any plan, including during the free trial.',
      },
      {
        q: 'Can I edit a recipe after importing it?',
        a: 'Yes. You can edit the title, ingredients, instructions, and other details at any time from your recipe library.',
      },
    ],
  },
  {
    id: 'voting',
    icon: ThumbsUp,
    title: 'Family Voting & Meal Planning',
    items: [
      {
        q: 'How does voting work?',
        a: 'Each week, a set of meals is generated from your recipe library. Every household member can vote thumbs up or thumbs down on each option. The primary account holder then reviews the results and finalizes the week\'s meals.',
      },
      {
        q: 'Who can vote?',
        a: 'All household members can vote — everyone gets a voice in what\'s for dinner.',
      },
      {
        q: 'Who finalizes the meal plan?',
        a: 'Primary account holders (the person who created the household and other designated members) reviews the vote results and selects which meals make the final plan for the week. This keeps one person in charge of the final decision while giving everyone input.',
      },
      {
        q: 'Can I change my vote?',
        a: 'Yes, you can update your votes anytime before the meal plan is finalized for the week.',
      },
      {
        q: 'How many meals are in a weekly plan?',
        a: 'The meal plan generates options from your recipe library for the week (default), or period established in settings. A primary user selects which ones to finalize — you choose how many dinners to plan.',
      },
    ],
  },
  {
    id: 'grocery',
    icon: ShoppingCart,
    title: 'Grocery Lists & Store Integrations',
    items: [
      {
        q: 'How is the grocery list generated?',
        a: 'Once meals are finalized for the week, TableTryb automatically combines all the ingredients into a single grocery list, organized by store aisle. Pantry staples are separated so you only buy what you actually need.',
      },
      {
        q: 'Which stores are supported?',
        a: 'Kroger offers full cart-push integration — your grocery list goes directly into your Kroger online cart. For H-E-B, Walmart, Target, Costco, Whole Foods, Publix, Aldi, Trader Joe\'s, Safeway, and Albertsons, we provide quick search links that open each item on the store\'s website. You can also copy or share your list to use anywhere.',
      },
      {
        q: 'What is "cart push"?',
        a: 'Cart push sends your grocery list items directly to your Kroger online shopping cart via their API. You connect your Kroger account once, then each week you can push your list with one tap — no manual searching needed.',
      },
      {
        q: 'Can I use a store that isn\'t listed?',
        a: 'Yes! Every grocery list can be copied to your clipboard, shared via your phone\'s share sheet, or pasted into Apple Notes (where items automatically become checkboxes). The list works at any store.',
      },
      {
        q: 'Can I edit the grocery list?',
        a: 'The grocery list is generated from your finalized meals. If you need to adjust, you can modify the finalized meals and the list will update accordingly.',
      },
    ],
  },
  {
    id: 'account',
    icon: Shield,
    title: 'Account & Privacy',
    items: [
      {
        q: 'How do I invite family members?',
        a: 'The primary account holder can invite members by email from the Users page inside the app. Invitees receive a link to join the household.',
      },
      {
        q: 'What\'s the difference between "primary" and "member" roles?',
        a: 'All users can browse recipes, vote on meals, and view the grocery list. A primary user has additional permissions: finalizing the meal plan, managing the grocery list, inviting or removing members, and adjusting household settings. Primary users are designated by the account holder (the person who created the household) and can assign other members as primary if desired.',
      },
      {
        q: 'Who manages billing?',
        a: 'Only the account holder (the person who originally created the household) can access billing. This prevents household members from accidentally modifying the subscription.',
      },
      {
        q: 'Is my data private?',
        a: 'Your recipes, meal plans, and household data are private to your household. We don\'t sell your data or share it with third parties. Recipe photos are stored securely and only accessible to household members.',
      },
      {
        q: 'Can I delete my account?',
        a: `You can cancel your subscription at any time. If you wish to delete your account, contact us at ${BRAND.supportEmail} to request account deletion. If you're the account holder, this will also remove the household and all associated data.`,
      },
    ],
  },
];

/* ----------------------------------------------------------------
   Accordion Item Component
   ---------------------------------------------------------------- */
interface AccordionItemProps {
  question: string;
  answer: string | React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  question, answer, isOpen, onToggle,
}) => (
  <div className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
    <button
      className="faq-accordion-trigger"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <span className="faq-accordion-question">{question}</span>
      <ChevronDown size={20} className="faq-accordion-chevron" />
    </button>
    <div className="faq-accordion-content">
      <div className="faq-accordion-answer">
        {typeof answer === 'string' ? <p>{answer}</p> : answer}
      </div>
    </div>
  </div>
);

/* ----------------------------------------------------------------
   FAQ Page Component
   ---------------------------------------------------------------- */
const FaqPage: React.FC = () => {
  // Track which items are open: { 'general-0': true, 'pricing-2': true, ... }
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="faq-page">
      {/* Header */}
      <div className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about {BRAND.name}. Can't find your answer? <Link to="/contact">Get in touch</Link>.</p>
      </div>

      {/* Category sections */}
      <div className="faq-sections">
        {FAQ_DATA.map((category) => (
          <section key={category.id} className="faq-section" id={`faq-${category.id}`}>
            <div className="faq-section-header">
              <category.icon size={24} />
              <h2>{category.title}</h2>
            </div>
            <div className="faq-accordion">
              {category.items.map((item, idx) => {
                const key = `${category.id}-${idx}`;
                return (
                  <AccordionItem
                    key={key}
                    question={item.q}
                    answer={item.a}
                    isOpen={!!openItems[key]}
                    onToggle={() => toggleItem(key)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="faq-cta">
        <h3>Still have questions?</h3>
        <p>We're happy to help. Reach out and we'll get back to you within one business day.</p>
        <Link to="/contact" className="btn btn-primary">
          Contact Us
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};

export default FaqPage;
