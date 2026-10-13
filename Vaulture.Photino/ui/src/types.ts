export interface PasswordHistoryItem {
  id: number;
  oldPassword: string;
  changedAt: string;
}

export interface VaultEntry {
  id: number;
  folderId: number | null;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
  passwordHistory?: PasswordHistoryItem[];
}

export interface VaultFolder {
  id: number;
  name: string;
  icon?: string | null;
  parentFolderId: number | null;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
  isLinked: boolean;
}
