export enum SUBSCRIPTION_PLAN {
  FREE = 'free',
  COACH_PRO = 'coach_pro',
  ORG_BASIC = 'org_basic',
  ORG_PRO = 'org_pro',
  ENTERPRISE = 'enterprise',
}

export enum SUBSCRIPTION_STATUS {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  FOUNDING = 'founding',
}

export enum BILLING_CYCLE {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum ADDON_TYPE {
  FEATURED_JOB = 'featured_job',
  SPONSORED_JOB = 'sponsored_job',
  EMAIL_BLAST = 'email_blast',
  HOMEPAGE_SPONSORSHIP = 'homepage_sponsorship',
}
