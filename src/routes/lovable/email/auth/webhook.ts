import * as React from 'react'
import { render } from '@react-email/render'
import { parseEmailWebhookPayload } from '@lovable.dev/email-js'
import { WebhookError, verifyWebhookRequest } from '@lovable.dev/webhooks-js'
import { createFileRoute } from '@tanstack/react-router'
import { SignupEmail } from '@/lib/email-templates/signup'
import { InviteEmail } from '@/lib/email-templates/invite'
import { MagicLinkEmail } from '@/lib/email-templates/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/email-change'
import { ReauthenticationEmail } from '@/lib/email-templates/reauthentication'

// Auth email sender for Cloud Auth. Mirrors supabase/functions/auth-email-hook:
// verify signature, render the MeasureWise templates, send directly through the
// Resend connector gateway from noreply@measurewise.org, and log pending/sent/failed
// rows to email_send_log. No platform queue, no notify.measurewise.org sending.

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SITE_NAME = 'MeasureWise'
const ROOT_DOMAIN = 'measurewise.org'
const FROM_DOMAIN = 'measurewise.org'
const RESEND_GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend/emails'

function redactEmail(email: string | null | undefined): string {
  if (!email) return '***'
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '***'
  return `${localPart[0]}***@${domain}`
}

export const Route = createFileRoute('/lovable/email/auth/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY']
        if (!apiKey) {
          console.error('LOVABLE_API_KEY not configured')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        // Verify signature + timestamp, then parse payload.
        let payload: any
        let run_id = ''
        try {
          const verified = await verifyWebhookRequest({
            req: request,
            secret: apiKey,
            parser: parseEmailWebhookPayload,
          })
          payload = verified.payload
          run_id = payload.run_id
        } catch (error) {
          if (error instanceof WebhookError) {
            switch (error.code) {
              case 'invalid_signature':
              case 'missing_timestamp':
              case 'invalid_timestamp':
              case 'stale_timestamp':
                console.error('Invalid webhook signature', { error: error.message })
                return Response.json({ error: 'Invalid signature' }, { status: 401 })
              case 'invalid_payload':
              case 'invalid_json':
                console.error('Invalid webhook payload', { error: error.message })
                return Response.json({ error: 'Invalid webhook payload' }, { status: 400 })
            }
          }
          console.error('Webhook verification failed', { error })
          return Response.json({ error: 'Invalid webhook payload' }, { status: 400 })
        }

        if (!run_id) {
          console.error('Webhook payload missing run_id')
          return Response.json({ error: 'Invalid webhook payload' }, { status: 400 })
        }

        if (payload.version !== '1') {
          console.error('Unsupported payload version', { version: payload.version, run_id })
          return Response.json(
            { error: `Unsupported payload version: ${payload.version}` },
            { status: 400 },
          )
        }

        const emailType = payload.data.action_type
        console.log('Received auth event', {
          emailType,
          email_redacted: redactEmail(payload.data.email),
          run_id,
        })

        const EmailTemplate = EMAIL_TEMPLATES[emailType]
        if (!EmailTemplate) {
          console.error('Unknown email type', { emailType, run_id })
          return Response.json({ error: `Unknown email type: ${emailType}` }, { status: 400 })
        }

        const templateProps = {
          siteName: SITE_NAME,
          siteUrl: `https://${ROOT_DOMAIN}`,
          recipient: payload.data.email,
          confirmationUrl: payload.data.url,
          token: payload.data.token,
          email: payload.data.email,
          oldEmail: payload.data.old_email,
          newEmail: payload.data.new_email,
        }

        const element = React.createElement(EmailTemplate, templateProps)
        const html = await render(element)
        const text = await render(element, { plainText: true })

        // Service-role client, loaded inside the handler after the caller is verified.
        let supabaseAdmin: any
        try {
          ;({ supabaseAdmin } = await import('@/integrations/supabase/client.server'))
        } catch (err) {
          console.error('Supabase service-role client unavailable', {
            error: (err as Error)?.message,
            run_id,
          })
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const messageId = crypto.randomUUID()

        // Log pending BEFORE sending so we have a record even if the send crashes.
        await supabaseAdmin.from('email_send_log').insert({
          message_id: messageId,
          template_name: emailType,
          recipient_email: payload.data.email,
          status: 'pending',
        })

        const RESEND_API_KEY = process.env['RESEND_API_KEY']
        if (!RESEND_API_KEY) {
          console.error('RESEND_API_KEY is not configured')
          await supabaseAdmin.from('email_send_log').insert({
            message_id: messageId,
            template_name: emailType,
            recipient_email: payload.data.email,
            status: 'failed',
            error_message: 'RESEND_API_KEY is not configured',
          })
          return Response.json({ error: 'Email transport not configured' }, { status: 500 })
        }

        let resendStatus = 0
        let resendBody = ''
        try {
          const resp = await fetch(RESEND_GATEWAY_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
              'X-Connection-Api-Key': RESEND_API_KEY,
            },
            body: JSON.stringify({
              from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
              to: [payload.data.email],
              reply_to: `hello@${ROOT_DOMAIN}`,
              subject: EMAIL_SUBJECTS[emailType] || 'Notification',
              html,
              text,
              tags: [{ name: 'category', value: String(emailType).replace(/_/g, '-') }],
            }),
          })
          resendStatus = resp.status
          resendBody = await resp.text().catch(() => '')
        } catch (err) {
          console.error('Auth email send threw', {
            error: (err as Error)?.message,
            run_id,
            emailType,
          })
          await supabaseAdmin.from('email_send_log').insert({
            message_id: messageId,
            template_name: emailType,
            recipient_email: payload.data.email,
            status: 'failed',
            error_message: `Exception: ${(err as Error)?.message ?? String(err)}`.slice(0, 500),
          })
          return Response.json({ error: 'Failed to send email' }, { status: 502 })
        }

        if (resendStatus < 200 || resendStatus >= 300) {
          console.error('Auth email rejected by provider', {
            resendStatus,
            resendBody,
            run_id,
            emailType,
          })
          await supabaseAdmin.from('email_send_log').insert({
            message_id: messageId,
            template_name: emailType,
            recipient_email: payload.data.email,
            status: 'failed',
            error_message: `Resend ${resendStatus}: ${resendBody}`.slice(0, 500),
          })
          return Response.json(
            { error: 'Failed to send email', status: resendStatus, details: resendBody },
            { status: 502 },
          )
        }

        let resendId: string | null = null
        try {
          resendId = JSON.parse(resendBody)?.id ?? null
        } catch {
          /* keep null */
        }

        await supabaseAdmin.from('email_send_log').insert({
          message_id: messageId,
          template_name: emailType,
          recipient_email: payload.data.email,
          status: 'sent',
          metadata: { provider: 'resend', resend_id: resendId, run_id },
        })

        console.log('Auth email sent', {
          emailType,
          email_redacted: redactEmail(payload.data.email),
          run_id,
          resendId,
        })

        return Response.json({ success: true, sent: true })
      },
    },
  },
})
