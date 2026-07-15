import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "synaprh_access_token";

export type AuthenticatedUser = {
  userId: string;
  employeeId: string;
  username: string;
  roles: Array<"SUPER_ADMIN" | "ADMIN" | "HR_MANAGER" | "MANAGER" | "EMPLOYEE">;
};

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const apiUrl = process.env.NEST_API_URL;

  if (!apiUrl) {
    console.error("NEST_API_URL n'est pas configurée.");
    return null;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAME)?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const user = (await response.json()) as AuthenticatedUser;

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"] as const;

    const hasAllowedRole = user.roles.some((role) =>
      allowedRoles.includes(role as (typeof allowedRoles)[number]),
    );

    return hasAllowedRole ? user : null;
  } catch {
    return null;
  }
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/authentication");
  }

  return user;
}
