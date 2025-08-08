export enum PostType {
  News = 'news',
  Job = 'job',
}

export enum AdStatus {
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
}

export enum ApplicationStatus {
  Pending = 'pending',
  Reviewed = 'reviewed',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

export enum DocumentType {
  CV = 'cv',
  CoverLetter = 'cover_letter',
  Certificate = 'certificate',
  Other = 'other',
}

export enum UserType {
  User = 'user',
  Business = 'business',
}

export enum NotificationType {
  APPLICATION_STATUS = 'application_status',
  NEW_APPLICATION = 'new_application',
  INTERACTION = 'interaction',
} 