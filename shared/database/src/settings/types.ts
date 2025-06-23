export interface PaystackBank {
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaystackBanksResponse {
  status: boolean;
  message: string;
  data: PaystackBank[];
  meta?: {
    next?: string | null;
    previous?: string | null;
    perPage?: number;
  };
}
