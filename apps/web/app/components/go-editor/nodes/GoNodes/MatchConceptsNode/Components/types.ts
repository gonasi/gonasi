export interface LeftItem {
  id: string;
  content: string;
  matchedWith: string | null;
}

export interface RightItem {
  id: string;
  content: string;
  isPlaced: boolean;
}
