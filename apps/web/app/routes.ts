import { index, layout, prefix, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  layout('routes/layouts/public/public-layout.tsx', [index('routes/public/home.tsx')]),

  layout('routes/layouts/auth/auth-layout.tsx', [
    route('login', 'routes/auth/login.tsx'),
    route('signup', 'routes/auth/signup.tsx'),
  ]),

  ...prefix('onboarding', [
    layout('routes/layouts/onboarding/onboarding-layout.tsx', [
      route(':userId/basic-information', 'routes/onboarding/basic-information.tsx'),
      route(':userId/contact-information', 'routes/onboarding/contact-information.tsx'),
    ]),
  ]),

  ...prefix('go', [
    layout('routes/layouts/go/go-layout.tsx', [
      index('routes/go/go.tsx'),
      route('feedback', 'routes/go/feedback.tsx'),
      // route('courses', 'routes/go/courses.tsx', [
      //   route(':courseId', 'routes/go/go-course-details.tsx'),
      // ]),
    ]),
  ]),

  // change team
  ...prefix('dashboard', [
    layout('routes/layouts/dashboard/dashboard-plain-team.tsx', [
      route('/change-team', 'routes/dashboard/team-management/change-team.tsx', [
        route('leave-team/:companyId', 'routes/dashboard/team-management/leave-team.tsx'),
      ]),
    ]),
  ]),

  route('sign-out', 'routes/sign-out.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
