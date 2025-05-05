export function getPaginationRange(page: number, limit: number) {
  if (page < 1 || limit < 1) {
    throw new Error('Page and limit must be positive integers');
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit - 1;

  return { startIndex, endIndex };
}
