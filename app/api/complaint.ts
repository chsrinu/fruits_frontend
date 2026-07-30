import instance from "./axiosInstance";

export type BackendComplaintStatus = "OPEN" | "CLOSED";

export type CreateComplaintDetailRequest = {
  orderItemId: number;
  complaintDescription?: string;
  imageProofs: string[];
  reason: "BadQuality" | "MissingItems" | "PendingRefund" | "WrongItemsDelivered";
  quantity?: number;
};

export type CreateComplaintRequest = {
  userId?: number | null;
  responderId?: number | null;
  orderId: string;
  complaintStatus: BackendComplaintStatus;
  complaintDetails: CreateComplaintDetailRequest[];
  responderNotes?: string;
};

export type ComplaintDetailResponse = {
  detailId: number;
  complaintId: number;
  orderItemId: number;
  complaintDescription?: string;
  imageProofs: string[];
  reason: "BadQuality" | "MissingItems" | "PendingRefund" | "WrongItemsDelivered";
  reasonDisplay?: string;
  quantity?: number;
  refundAmount?: number | null;
  refundStatus: string;
  createdAt: string;
};

export type ComplaintResponse = {
  complaintId: number;
  userId: number;
  responderId?: number | null;
  orderId: string;
  complaintStatus: BackendComplaintStatus;
  complaintStatusDisplay?: string;
  complaintDetails: ComplaintDetailResponse[];
  createdAt: string;
  updatedAt: string;
  responderNotes?: string | null;
};

export type UploadComplaintImageResponse = {
  url: string;
};

export const createComplaintApi = (payload: CreateComplaintRequest) =>
  instance.post<ComplaintResponse>("/user/complaints", payload);

export const getComplaintsByOrderIdApi = (orderId: string) =>
  instance.get<ComplaintResponse[]>(`/user/complaints/order/${orderId}`);

export const uploadComplaintImageApi = (file: {
  uri: string;
  name: string;
  type: string;
}) => {
  const formData = new FormData();
  formData.append("file", file as any);
  return instance.post<UploadComplaintImageResponse>("/user/complaints/upload/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
