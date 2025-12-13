# DatumPilot Deployment Guide

This guide covers deploying DatumPilot to production on Vercel.

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are configured in Vercel:

#### Required Variables

| Variable | Description | Format |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | `eyJ...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` or `pk_test_...` |

#### Recommended Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key for AI features | - |
| `OPENAI_API_KEY` | OpenAI API key (fallback) | - |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe price ID for Pro monthly | - |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Stripe price ID for Pro yearly | - |
| `STRIPE_TEAM_MONTHLY_PRICE_ID` | Stripe price ID for Team monthly | - |
| `STRIPE_TEAM_YEARLY_PRICE_ID` | Stripe price ID for Team yearly | - |
| `SENTRY_DSN` | Sentry error reporting DSN | - |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps | - |

### 2. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run all migrations in `infra/supabase/migrations/` in order:
   ```bash
   # Connect to your Supabase project
   supabase link --project-ref your-project-ref

   # Push migrations
   supabase db push
   ```
3. Verify RLS policies are enabled on all tables
4. Create OAuth providers in Supabase Dashboard → Authentication → Providers

### 3. Stripe Setup

1. Create products and prices in Stripe Dashboard:
   - Pro Monthly ($29/month)
   - Pro Yearly ($290/year)
   - Team Monthly ($99/month)
   - Team Yearly ($990/year)

2. Configure webhook endpoint:
   ```
   https://your-domain.com/api/stripe/webhook
   ```

3. Select webhook events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## Deployment Steps

### Deploy to Vercel

1. Push to the main branch for staging, or create a `v*` tag for production:
   ```bash
   # Staging deployment
   git push origin main

   # Production deployment
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. The GitHub Actions workflow (`.github/workflows/ci.yml`) will:
   - Run linting and type checking
   - Run unit tests
   - Deploy to Vercel

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Post-Deployment Verification

### 1. Health Check

Verify the deployment is healthy:

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 123,
  "checks": {
    "database": { "status": "pass" },
    "stripe": { "status": "pass" }
  }
}
```

### 2. Smoke Tests

Run these manual tests after deployment:

1. **Landing Page**: Visit `/` and verify page loads
2. **Authentication**: Test OAuth login with Google/GitHub
3. **Protected Routes**: Verify `/app` redirects to login when unauthenticated
4. **FCF Builder**: Create a test FCF and verify preview renders
5. **Billing**: Visit `/pricing` and verify plans display correctly
6. **Checkout**: Test Stripe checkout flow (use test mode)

### 3. Webhook Verification

Test Stripe webhooks are working:

```bash
# Using Stripe CLI
stripe trigger checkout.session.completed \
  --add checkout_session:metadata[supabase_user_id]=test-user-id
```

## Rollback Procedures

### Vercel Rollback

1. Go to Vercel Dashboard → Deployments
2. Find the previous working deployment
3. Click "..." → "Promote to Production"

### Database Rollback

If a migration caused issues:

```bash
# Connect to Supabase
supabase db remote commit

# Identify problematic migration
supabase migration list

# Manually revert changes in Supabase Dashboard SQL Editor
```

⚠️ **Warning**: Database rollbacks may cause data loss. Always backup before running migrations in production.

## Monitoring

### Error Tracking

- Sentry Dashboard: https://sentry.io
- Filter by environment: `production` or `preview`

### Logs

- Vercel Dashboard → Functions → Select function → View Logs
- Filter by level: `error`, `warn`, `info`

### Metrics

- Health endpoint: `/api/health?detailed=true` (includes latency metrics)
- Vercel Analytics: Dashboard → Analytics

## Troubleshooting

### Common Issues

#### 1. "Missing environment variables" error

**Solution**: Ensure all required variables are set in Vercel Dashboard → Settings → Environment Variables.

#### 2. Stripe webhooks failing

**Solutions**:
- Verify `STRIPE_WEBHOOK_SECRET` matches the webhook in Stripe Dashboard
- Check webhook endpoint URL is correct
- Verify webhook events are selected

#### 3. Database connection errors

**Solutions**:
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase project is active
- Verify RLS policies aren't blocking service role

#### 4. AI features not working

**Solutions**:
- Verify `ANTHROPIC_API_KEY` is set
- Check API key has sufficient credits
- Verify key format starts with `sk-ant-`

### Debug Mode

Enable detailed logging for debugging:

```bash
# In Vercel environment variables
LOG_LEVEL=debug
```

## Security Checklist

- [ ] All API keys are stored as environment variables
- [ ] Service role key is only used server-side
- [ ] RLS is enabled on all database tables
- [ ] Webhook signatures are verified
- [ ] CORS is configured correctly
- [ ] Security headers are set (see `vercel.json`)
- [ ] OAuth redirect URIs are restricted to production domain

## Performance Optimization

### Function Configuration

The `vercel.json` configures function resources:
- Export functions: 60s timeout, 2GB memory
- AI functions: 60s timeout, 1GB memory
- Standard API: 30s timeout, 1GB memory

### Edge Caching

Static assets are automatically cached by Vercel's edge network.

For API routes that can be cached, add cache headers:
```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
  }
});
```

## Support

For deployment issues:
1. Check this guide first
2. Review Vercel deployment logs
3. Check Sentry for errors
4. Contact: support@datumpilot.com
