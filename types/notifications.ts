import { NotificationType } from './enums';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    body: string;
    type: string; // Using string to match the database schema
    data?: any;
    read: boolean;
    created_at: string;
}

export interface NotificationData {
    type: string;
    postId?: string;
    commentId?: string;
    applicationId?: string;
    companyId?: string;
    [key: string]: any;
} 