import type { NodeProgressMap, NodeType, PayloadTypeMap } from '@gonasi/database/lessons';

// Function that returns the correct payload type based on the provided node type
export function getPayloadByUuidAndType<T extends NodeType>(
  data: NodeProgressMap | undefined,
  uuid: string,
  type: T,
): PayloadTypeMap[T] | null {
  const entry = data?.[uuid];
  if (entry && entry.type === type) {
    return entry.payload as PayloadTypeMap[T];
  }
  return null;
}
