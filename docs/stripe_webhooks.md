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

## Testing Checkout Flow

1) Ensure the dev server is running: `pnpm dev`
2) In a separate terminal, start webhook forwarding: `pnpm stripe:listen`
3) Log in to the app and go to `/pricing` or `/app/settings/billing`
4) Click "Upgrade" on a paid plan
5) Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry, any CVC, any billing address
6) After successful payment, you'll be redirected to `/app/settings/billing?success=true`
7) The webhook will update the subscription record in Supabase

## Verifying Success

- Check the `stripe listen` terminal for webhook events
- Verify subscription in Supabase: `subscriptions` table should have `tier: "pro"` or `tier: "team"`
- Or use Stripe MCP: `mcp__stripe__list_subscriptions`

## Notes

- The handler already verifies the Stripe signature; the secret must match the environment (`test` vs `live`).
- Ensure your Next app is reachable at the URL you forward to (e.g., `localhost:3000`).
- If you rotate the webhook secret, update the environment variable and redeploy.
