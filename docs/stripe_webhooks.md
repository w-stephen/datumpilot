# Stripe Webhook Setup (Step 4)

Use this guide to configure webhook delivery for the existing Stripe subscription handler at `/api/stripe/webhook`.

## Local development

1) Install Stripe CLI (macOS): `brew install stripe/stripe-cli/stripe`
2) Authenticate: `stripe login`
3) Start forwarding to Next dev server: `pnpm stripe:listen`
4) Copy the printed signing secret (`whsec_...`) into `apps/web/.env.local` as `STRIPE_WEBHOOK_SECRET`.
5) Keep the `stripe listen` process running while testing checkout/subscription flows.

## Production

1) In Stripe Dashboard: Developers → Webhooks → Add endpoint.
2) Endpoint URL: `https://<your-domain>/api/stripe/webhook`.
3) Select events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
4) Save and copy the signing secret to your production environment variable `STRIPE_WEBHOOK_SECRET`.

## Notes

- The handler already verifies the Stripe signature; the secret must match the environment (`test` vs `live`).
- Ensure your Next app is reachable at the URL you forward to (e.g., `localhost:3000`).
- If you rotate the webhook secret, update the environment variable and redeploy.
