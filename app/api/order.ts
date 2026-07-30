import instance from "./axiosInstance";
import { CreateOrderRequest, CreateOrderResponse, OrderDetails, OrderSummary } from "@/app/types/order";

export const createOrder = (payload: CreateOrderRequest) =>
  instance.post<CreateOrderResponse>("/user/orders/create", payload);

export const getOrderDetails = (orderId: string) =>
  instance.get<OrderDetails>(`/user/orders/${orderId}`);

export const getOrderHistory = (userId: number) =>
  instance.get<OrderSummary[]>(`/user/orders/${userId}/history`);

export const toOrderDetails = (order: OrderSummary | OrderDetails): OrderDetails => ({
  orderId: String(order.orderId),
  orderStatus: order.orderStatus || "",
  orderValue: Number(order.orderValue || 0),
  hasRefunds: Boolean(order.hasRefunds),
  deliveryCode: order.deliveryCode || "",
  address: order.address || "",
  expectedDeliveryDate: order.expectedDeliveryDate || "",
  createdAt: order.createdAt || "",
  updatedAt: order.updatedAt || "",
  fulfilledBy: order.fulfilledBy || "",
  fulfilledAt: order.fulfilledAt || "",
  deliveredBy: order.deliveredBy || "",
  deliveredAt: order.deliveredAt || "",
  orderItems: "orderItems" in order && Array.isArray(order.orderItems) ? order.orderItems : [],
  orderStatusHistory:
    "orderStatusHistory" in order && Array.isArray(order.orderStatusHistory) ? order.orderStatusHistory : [],
});
