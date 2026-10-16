export type OrderStatus = "Pending" | "Paid" | "Shipped" | "Delivered" | "Cancelled";

export interface LineItem {
  product: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  number: string;
  customer: string;
  status: OrderStatus;
  placedAt: string;
  total: number;
  lineItems: LineItem[];
}
