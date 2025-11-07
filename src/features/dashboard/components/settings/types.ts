export interface UserData {
  id: string;
  fullNameEn: string;
  fullNameAr: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  taskNotifications?: boolean;
}

export interface UserSettings {
  fullNameEn: string;
  fullNameAr: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskNotifications: boolean;
}

export interface Position {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  level: number;
  isActive: boolean;
}

export interface PositionFormState {
  name: string;
  nameAr: string;
  description: string;
  level: number;
  isActive: boolean;
}

export interface BackupFileInfo {
  fileName: string;
  size: number;
  sizeLabel: string;
  createdAt: string;
  downloadUrl: string;
}

export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
