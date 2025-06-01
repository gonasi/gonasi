import { useLocation } from 'react-router';

export function useRouteMatch(to: string): boolean {
  const { pathname } = useLocation();

  // Ensure leading slash and remove trailing slashes
  const normalize = (path: string) => `/${path.replace(/^\/+|\/+$/g, '')}`;

  const normalizedTo = normalize(to);
  const normalizedPath = normalize(pathname);

  const toSegments = normalizedTo.split('/');
  const pathSegments = normalizedPath.split('/');

  // For exact root-level paths (like /username), require exact match
  if (toSegments.length === 2 && toSegments[1] !== '') {
    return normalizedTo === normalizedPath;
  }

  // For deeper paths, use prefix matching
  return toSegments.every((seg, idx) => seg === pathSegments[idx]);
}
