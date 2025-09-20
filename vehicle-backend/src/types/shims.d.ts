// Augment Express to carry the authenticated user
export type Role = "admin" | "dealer" | "consumer";
export type RequestUser = {
  id: number;
  email: string;
  role: Role;
  dealerId?: number | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}
