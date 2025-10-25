export type AppSessionUser = {
  id: string;
  email?: string;
  name?: string;
  permissions: string[];
};

export type AppSession = {
  user: AppSessionUser | null;
  accessToken?: string;
  expiresAt?: string | Date;
  sessionToken?: string;
};

export type SessionState = {
  session: AppSession | null;
  isAuthenticated: boolean;
};

declare global {
  // Better Auth のセッションに追加フィールドを持たせるためのカスタム型
  // 実装側で `AppSession` を利用し Session 型を統一する。
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace AppAuth {
    type Session = AppSession;
    type SessionUser = AppSessionUser;
  }
}

export {};
