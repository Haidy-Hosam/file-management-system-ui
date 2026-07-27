export type NotificationType = 'MANUAL_FORWARD' | 'DEPARTMENT_UPLOAD';

export interface FileForwardResponse {
  id: number;
  fileId: number;
  fileName: string;
  extension: string;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  message: string;
  isRead: boolean;
  forwardedAt: string;
  readAt: string | null;
  type?: NotificationType;
}