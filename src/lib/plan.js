/**
 * Реальна система тарифів.
 *
 * У застосунку немає окремої підписки — є гаманець і поповнення (top-up).
 * Тому тариф ("Creator" / "Studio") виводиться з того, скільки користувач
 * коли-небудь поповнив у сумі (lifetime top-ups у USD), а не з окремого
 * платіжного/subscription-флоу. Це відповідає тому, як тарифи описані на
 * сторінці /pricing: "$29 / deposit min", "$79 / deposit min".
 *
 * "Enterprise" не виводиться автоматично — це завжди "Contact Sales" і
 * встановлюється вручну (user.planOverride = 'enterprise'), коли реальний
 * платіж/угоду проведе інший розробник/менеджер.
 *
 * Коли в проєкті з'явиться справжня оплата (Stripe тощо), досить буде або
 * писати top-up транзакції як зараз, або одразу виставляти planOverride —
 * решта коду (generate route, UI) вже орієнтується на getUserPlan().
 */

export const PLAN_THRESHOLDS_USD = {
  studio: 79,
  creator: 29,
};

export const PLAN_LIMITS = {
  free: {
    maxImagesPerGeneration: 2,
    premiumModels: false,
    commercialLicense: false,
    advancedUpscale: false,
  },
  creator: {
    maxImagesPerGeneration: 4,
    premiumModels: false,
    commercialLicense: true,
    advancedUpscale: false,
  },
  studio: {
    maxImagesPerGeneration: 8,
    premiumModels: true,
    commercialLicense: true,
    advancedUpscale: true,
  },
  enterprise: {
    maxImagesPerGeneration: 10,
    premiumModels: true,
    commercialLicense: true,
    advancedUpscale: true,
  },
};

export const PLAN_LABELS = {
  free: 'Free',
  creator: 'Creator',
  studio: 'Studio',
  enterprise: 'Enterprise',
};

// Моделі (стилі), доступні лише з плану Studio і вище.
export const PREMIUM_MODELS = ['Cinema 4K'];

export function getLifetimeTopUpUSD(user) {
  return (user?.transactions || [])
    .filter((tx) => tx.type === 'top_up' && tx.currency === 'USD' && tx.status === 'completed')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
}

export function getUserPlan(user) {
  if (user?.planOverride === 'enterprise') return 'enterprise';

  const lifetime = getLifetimeTopUpUSD(user);
  if (lifetime >= PLAN_THRESHOLDS_USD.studio) return 'studio';
  if (lifetime >= PLAN_THRESHOLDS_USD.creator) return 'creator';
  return 'free';
}

export function getPlanInfo(user) {
  const plan = getUserPlan(user);
  const lifetimeTopUpUSD = getLifetimeTopUpUSD(user);

  const nextPlan = plan === 'free' ? 'creator' : plan === 'creator' ? 'studio' : null;
  const nextThreshold = nextPlan ? PLAN_THRESHOLDS_USD[nextPlan] : null;

  return {
    plan,
    label: PLAN_LABELS[plan],
    limits: PLAN_LIMITS[plan],
    lifetimeTopUpUSD,
    nextPlan,
    nextPlanLabel: nextPlan ? PLAN_LABELS[nextPlan] : null,
    amountToNextPlan: nextThreshold ? Math.max(0, nextThreshold - lifetimeTopUpUSD) : 0,
  };
}
