export function countObjectAndChildren(nodes: any[]): number {
  let count = 0;

  function traverse(item: any) {
    // Skip null or undefined items
    if (item == null) return;

    // If item is a node with a type, count it
    if (typeof item === 'object' && 'type' in item) {
      count++;
    }

    // Handle arrays (like children arrays)
    if (Array.isArray(item)) {
      item.forEach((child: any) => traverse(child));
    }
    // Handle objects (nested structure)
    else if (typeof item === 'object') {
      // If this is a node with children, traverse those children
      if ('children' in item && Array.isArray(item.children)) {
        item.children.forEach((child: any) => traverse(child));
      }
    }
  }

  // Start traversal with the array of nodes
  nodes.forEach((node) => traverse(node));

  return count;
}
