export const launchTierLimits = {
  tier: 'launch',
  max_organizations_per_user: 3,
  storage_limit_mb_per_org: 1000,
  max_members_per_org: 2,
  max_collaborators_per_course: 5,
  max_free_courses_per_org: 3,
  max_students_per_course: 50,
  ai_tools_enabled: false,
  ai_usage_limit_monthly: null,
  custom_domains_enabled: false,
  max_custom_domains: null,
  analytics_level: 'basic',
  support_level: 'community',
  platform_fee_percentage: 15.0,
  white_label_enabled: false,
};

export const scaleTierLimits = {
  tier: 'scale',
  max_organizations_per_user: 10,
  storage_limit_mb_per_org: 10000,
  max_members_per_org: 5,
  max_collaborators_per_course: 15,
  max_free_courses_per_org: 5,
  max_students_per_course: 200,
  ai_tools_enabled: true,
  ai_usage_limit_monthly: 1000,
  custom_domains_enabled: true,
  max_custom_domains: 3,
  analytics_level: 'intermediate',
  support_level: 'email',
  platform_fee_percentage: 10.0,
  white_label_enabled: false,
};

export const enterpriseTierLimits = {
  tier: 'enterprise',
  max_organizations_per_user: -1, // Unlimited
  storage_limit_mb_per_org: 100000,
  max_members_per_org: 20,
  max_collaborators_per_course: 50,
  max_free_courses_per_org: 10,
  max_students_per_course: 1000,
  ai_tools_enabled: true,
  ai_usage_limit_monthly: null, // Unlimited
  custom_domains_enabled: true,
  max_custom_domains: 10,
  analytics_level: 'enterprise',
  support_level: 'dedicated',
  platform_fee_percentage: 5.0,
  white_label_enabled: true,
};
