# Rendezvous IL Admin Dashboard

*Managed by [Braddcorp.com](https://braddcorp.com)*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/adins-projects-d2644952/rendezvous-il-admin)
[![Made by Braddcorp](https://img.shields.io/badge/Made%20by-Braddcorp.com-black?style=for-the-badge)](https://braddcorp.com)

## Overview

This repository contains the Rendezvous IL Admin Dashboard, a modern administrative interface for managing Rendezvous IL operations. The application is continuously deployed and maintained by Braddcorp.com.

## Deployment

Your project is live at:

**[https://vercel.com/adins-projects-d2644952/rendezvous-il-admin](https://vercel.com/adins-projects-d2644952/rendezvous-il-admin)**

## Transactional email (SendKit)

All outbound email goes through **SendKit** (`https://api.sendkit.dev`). This replaced
Resend in August 2026 — the `resend` npm package is gone and the old `Resend_API`
environment variable is no longer read anywhere.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SENDKIT_API_KEY` | Yes, to send anything | SendKit API key, sent as `Authorization: Bearer <key>`. If it is missing, every send is skipped and reported as a failure — nothing is emailed. |
| `EMAIL_FROM` | No | Default sender, e.g. `Rendezvous IL <noreply@braddcorp.com>`. Falls back to exactly that value when unset. Must be on a SendKit-verified domain. |

Set both in the Vercel project `v0-ren-dash` (Production + Preview). `braddcorp.com`
is the verified sending domain for this project; verify new domains in the SendKit
dashboard under Domains before using them in `EMAIL_FROM`.

### How sending is wired up

- `lib/sendkit.ts` is the whole client. It exposes `sendkit.emails.send({ from, to,
  subject, html, text, cc, bcc, replyTo, headers, attachments })` and deliberately
  **never throws** on an API error — it returns `{ data, error }`, where `error` has
  `name`, `message`, and `statusCode`. Always check `error` at call sites.
  It also exports `emailFrom()` (default sender) and `emailConfigured()` (is the key set).
- `lib/email.tsx` holds the HTML templates plus `sendBatch()`, a rate-limit-aware
  sender: batches of 4, a 300 ms pause between batches, and one retry after 1.2 s
  when SendKit returns `statusCode === 429`. Bulk sends (check-in QR emails,
  volunteer schedules, lesson reminders) should go through `sendBatch()`, not
  `sendkit.emails.send()` directly.
- SendKit rejects more than 50 recipients per request (`SENDKIT_MAX_RECIPIENTS`), so
  `sendCustomEmail()` in `lib/email.tsx` will fail if handed a longer `to` array.

Note: the words "Resend"/"Resend Email Lists" still appear in the UI for
**resending** a confirmation and for mailing-list **CSV exports**. Those are unrelated
to the old email provider — do not rename them.

## About Braddcorp

Visit us at **[https://braddcorp.com](https://braddcorp.com)** for more information about our services and projects.

## How It Works

1. Code is developed and maintained in this repository
2. Changes are automatically deployed via Vercel
3. The latest version is always available at the deployment URL
4. Continuous integration ensures code quality and reliability