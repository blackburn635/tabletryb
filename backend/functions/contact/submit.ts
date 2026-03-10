/**
 * POST /v1/contact
 * Public endpoint (no auth) — processes contact form submissions.
 * Sends an email to the support address via SES and a confirmation to the sender.
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { BRAND } from '@tabletryb/shared';

const ses = new SESClient({});

const VALID_SUBJECTS = [
  'general',
  'support',
  'billing',
  'feature-request',
  'bug-report',
  'partnership',
];

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  support: 'Technical Support',
  billing: 'Billing & Subscription',
  'feature-request': 'Feature Request',
  'bug-report': 'Bug Report',
  partnership: 'Partnership / Business',
};

interface ContactFormBody {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.STAGE === 'prod'
    ? (process.env.ALLOWED_ORIGIN || 'https://tabletryb.com')
    : 'http://localhost:3000',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  // Handle CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'MISSING_BODY', message: 'Request body is required' }),
      };
    }

    const body: ContactFormBody = JSON.parse(event.body);

    // Validate
    if (!body.name?.trim()) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'VALIDATION', message: 'Name is required' }) };
    }
    if (!body.email?.trim() || !body.email.includes('@')) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'VALIDATION', message: 'Valid email is required' }) };
    }
    if (!VALID_SUBJECTS.includes(body.subject)) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'VALIDATION', message: 'Please select a topic' }) };
    }
    if (!body.message?.trim() || body.message.trim().length < 10) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'VALIDATION', message: 'Message must be at least 10 characters' }) };
    }

    const subjectLabel = SUBJECT_LABELS[body.subject] || body.subject;
    const timestamp = new Date().toISOString();

    // Send notification to support team
    await ses.send(
      new SendEmailCommand({
        Source: BRAND.noReplyEmail,
        Destination: {
          ToAddresses: [BRAND.supportEmail],
        },
        Message: {
          Subject: {
            Data: `[${BRAND.name}] ${subjectLabel}: ${body.name}`,
          },
          Body: {
            Html: {
              Data: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px;">
                  <h2 style="color: #1B1B1B; margin-bottom: 4px;">New Contact Form Submission</h2>
                  <p style="color: #6B7280; margin-top: 0;">Received ${timestamp}</p>
                  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6B7280; width: 100px; vertical-align: top;">Name</td>
                      <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(body.name)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6B7280; vertical-align: top;">Email</td>
                      <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(body.email)}">${escapeHtml(body.email)}</a></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6B7280; vertical-align: top;">Topic</td>
                      <td style="padding: 8px 0;">${escapeHtml(subjectLabel)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6B7280; vertical-align: top;">Message</td>
                      <td style="padding: 8px 0; white-space: pre-wrap;">${escapeHtml(body.message)}</td>
                    </tr>
                  </table>
                  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
                  <p style="color: #9CA3AF; font-size: 13px;">
                    Reply directly to this email to respond to ${escapeHtml(body.name)}.
                  </p>
                </div>
              `,
            },
          },
          ReplyToAddresses: [body.email],
        },
      })
    );

    // Send confirmation to the user
    await ses.send(
      new SendEmailCommand({
        Source: BRAND.noReplyEmail,
        Destination: {
          ToAddresses: [body.email],
        },
        Message: {
          Subject: {
            Data: `We received your message — ${BRAND.name}`,
          },
          Body: {
            Html: {
              Data: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px;">
                  <h2 style="color: #1B1B1B;">Thanks for reaching out, ${escapeHtml(body.name)}!</h2>
                  <p style="color: #374151; line-height: 1.6;">
                    We received your message about <strong>${escapeHtml(subjectLabel)}</strong>
                    and will get back to you within 1 business day.
                  </p>
                  <p style="color: #374151; line-height: 1.6;">
                    In the meantime, if you need immediate help, you can reply directly to this email.
                  </p>
                  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
                  <p style="color: #9CA3AF; font-size: 13px;">
                    ${BRAND.name} by ${BRAND.company}<br/>
                    <a href="https://${BRAND.domain}" style="color: #6B7280;">${BRAND.domain}</a>
                  </p>
                </div>
              `,
            },
          },
          ReplyToAddresses: [BRAND.supportEmail],
        },
      })
    );

    console.log(`Contact form: name=${body.name}, email=${body.email}, subject=${body.subject}`);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Message sent successfully' }),
    };
  } catch (err) {
    console.error('Contact form error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'INTERNAL_ERROR', message: 'Failed to send message. Please try again.' }),
    };
  }
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
