---
name: email-provider-extension
description: Use when changing this template's mail delivery backend, reviewing email env setup, switching between `ses` and `smtp`, or adding a new provider such as Resend, SendGrid, Postmark, or Mailgun.
---

# Email Provider Extension

Read [`docs/guides/email-provider.md`](../../../docs/guides/email-provider.md) first.

## Current State

- Implemented providers: `ses`, `smtp`
- Provider selection: `EMAIL_PROVIDER`
- Sender address resolution is provider-agnostic:
  - prefer `EMAIL_FROM`
  - fallback `SES_FROM_EMAIL` with deprecation warning
- SES credentials use `SYSTEM_AWS_*`

## Current Env Map

### `ses`

Use:

- `EMAIL_PROVIDER=ses`
- `SYSTEM_AWS_SES_REGION`
- `SYSTEM_AWS_ACCESS_KEY_ID`
- `SYSTEM_AWS_SECRET_ACCESS_KEY`
- `LOCALSTACK_ENDPOINT`
- `EMAIL_FROM`

### `smtp`

Use:

- `EMAIL_PROVIDER=smtp`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

## Workflow

1. Inspect `src/libraries/email.ts` first. Keep `EmailProvider` / `EmailService` contracts stable unless there is a concrete reason to change them.
2. When adding a provider:
   - add provider config interface
   - add provider class
   - add env loader / validation
   - extend `createEmailServiceInstance()`
3. Keep sender resolution provider-agnostic. New providers should continue to use `EMAIL_FROM`; do not introduce a new provider-specific sender env unless there is an unavoidable external API reason.
4. Update config/docs:
   - `.env.example`
   - `README.md`
   - `docs/guides/email-provider.md`
   - `.cursor/rules/add-email-provider.mdc` when guidance changed
5. Update tests:
   - `__tests__/libraries/email.test.ts`
   - `__tests__/libraries/auth.test.ts` for Better Auth callback smoke coverage

## Rules

- `EMAIL_PROVIDER` typos should throw; do not silently fallback.
- Node-only SDKs or clients should be loaded with `await import()` when practical.
- `EMAIL_FROM` is the primary sender env. `SES_FROM_EMAIL` is legacy compatibility only.
- If the task changes HTML email markup rather than delivery backends, use `html-email` as well if available.

## Files To Touch

- `src/libraries/email.ts`
- `src/libraries/auth.ts` when consumer wiring changes
- `__tests__/libraries/email.test.ts`
- `__tests__/libraries/auth.test.ts`
- `.env.example`
- `README.md`
- `docs/guides/email-provider.md`
- `.cursor/rules/add-email-provider.mdc`

## Quick Decisions

- SES on LocalStack: keep `EMAIL_PROVIDER=ses` and point SES traffic at `LOCALSTACK_ENDPOINT`
- Mailhog / Mailtrap / plain SMTP relay: use `EMAIL_PROVIDER=smtp`
- Resend / SendGrid / Postmark: usually dedicated provider
- Template/body polish is separate from provider switching
