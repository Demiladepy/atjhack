export interface Merchant {
  id: string;
  phone: string;
  name: string | null;
  business_type: string | null;
  location: string | null;
  currency: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  merchant_id: string;
  type: "sale" | "expense" | "purchase" | "payment_received";
  item: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total_amount: number;
  customer_name: string | null;
  payment_status: "paid" | "partial" | "credit" | "pending";
  amount_paid: number;
  amount_owed: number;
  category: string | null;
  raw_message: string | null;
  created_at: string;
}

export interface Debt {
  id: string;
  merchant_id: string;
  customer_name: string;
  total_owed: number;
  status: "active" | "settled" | "overdue";
  last_transaction_at: string;
}

export interface CreditScoreFactors {
  transaction_consistency: number;
  revenue_trend: number;
  debt_repayment_rate: number;
  business_diversity: number;
  overall_score: number;
  rating: "Excellent" | "Good" | "Fair" | "Building";
}

export interface MerchantWithStats {
  merchant: Merchant;
  stats: {
    weekly: Transaction[];
    monthly: Transaction[];
    debts: Debt[];
  };
}
