import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  layout('routes/layouts/public/public-layout.tsx', [index('routes/public/home.tsx')]),

  layout('routes/layouts/auth/auth-layout.tsx', [
    route('login', 'routes/auth/login.tsx'),
    route('signup', 'routes/auth/signup.tsx'),
  ]),

  route('sign-out', 'routes/sign-out.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
