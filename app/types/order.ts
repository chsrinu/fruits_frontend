export type CreateOrderRequest = {
  cartId: string;
  deliveryAddressId: number;
};

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  fulfillmentStatus: string;
};

export type OrderStatusHistoryItem = {
  id: number;
  orderStatus: string;
  changedAt: string;
};

export type OrderDetails = {
  orderId: string;
  orderStatus: string;
  orderValue: number;
  hasRefunds: boolean;
  deliveryCode: string;
  address: string;
  expectedDeliveryDate: string;
  createdAt: string;
  updatedAt: string;
  fulfilledBy: string;
  fulfilledAt: string;
  deliveredBy: string;
  deliveredAt: string;
  orderItems: OrderItem[];
  orderStatusHistory?: OrderStatusHistoryItem[];
};

export type OrderSummary = {
  orderId: string;
  orderStatus?: string;
  orderValue?: number;
  deliveryCode?: string;
  address?: string;
  expectedDeliveryDate?: string;
  createdAt?: string;
  updatedAt?: string;
  fulfilledBy?: string;
  fulfilledAt?: string;
  deliveredBy?: string;
  deliveredAt?: string;
  hasRefunds?: boolean;
};

export type CreateOrderResponse = {
  orderDetails: OrderDetails;
  updatedWalletBalance: number;
};
