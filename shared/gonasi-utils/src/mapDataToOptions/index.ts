/**
 * Maps an array of objects to an array of option objects with customizable keys.
 *
 * @template T - The type of objects in the input array.
 * @template K - The key in each object used as the `value` in the output.
 * @template V - The key in each object used for the `label` in the output.
 * @template S - An optional key for an extra single field in the output.
 * @template ExtraKeys - Additional optional keys to include in the output.
 *
 * @param {T[]} data - The array of objects to map.
 * @param {K} valueKey - The key used for the `value` field in the output.
 * @param {V} optionKey - The key used for the `label` field in the output.
 * @param {S} [extraSingleKey] - An optional single key to include in the output.
 * @param {ExtraKeys[]} [extraKeys] - Optional array of additional keys to include in the output.
 *
 * @returns {Array<Object>} An array of objects with `value`, `label`, and optional properties.
 *
 * @example
 * const data = [
 *   { id: 1, name: 'Item 1', category_id: 10, description: 'Desc 1' },
 *   { id: 2, name: 'Item 2', category_id: 20, description: 'Desc 2' },
 * ];
 *
 * const options = mapDataToOptions(data, 'id', 'name', 'category_id', ['description']);
 * console.log(options);
 * // Output:
 * // [
 * //   { value: 1, label: 'Item 1', categoryId: 10, description: 'Desc 1' },
 * //   { value: 2, label: 'Item 2', categoryId: 20, description: 'Desc 2' }
 * // ]
 */
export const mapDataToOptions = <
  T,
  K extends keyof T,
  V extends keyof T,
  S extends keyof T,
  ExtraKeys extends keyof T,
>(
  data: T[],
  valueKey: K,
  optionKey: V,
  extraSingleKey?: S,
  extraKeys?: ExtraKeys[],
) => {
  const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());

  return data.map((item) => ({
    value: item[valueKey],
    label: item[optionKey],
    ...(extraSingleKey ? { [toCamelCase(extraSingleKey as string)]: item[extraSingleKey] } : {}),
    ...(extraKeys
      ? Object.fromEntries(extraKeys.map((key) => [toCamelCase(key as string), item[key]]))
      : {}),
  }));
};
