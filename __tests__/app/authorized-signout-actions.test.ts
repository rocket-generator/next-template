const mockSignOut = jest.fn();
const mockRedirect = jest.fn();

const createRedirectError = (url: string) => {
  const error = new Error("NEXT_REDIRECT") as Error & { digest: string };
  error.digest = `NEXT_REDIRECT;replace;${url};307;`;
  return error;
};

jest.mock("@/libraries/auth", () => ({
  __esModule: true,
  auth: jest.fn(),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

jest.mock("next/headers", () => ({
  __esModule: true,
  cookies: jest.fn(),
}));

jest.mock("next/cache", () => ({
  __esModule: true,
  revalidatePath: jest.fn(),
}));

jest.mock("@/i18n/routing", () => ({
  __esModule: true,
  routing: {
    locales: ["ja", "en"],
  },
}));

jest.mock("@/repositories/user_repository", () => ({
  __esModule: true,
  UserRepository: jest.fn(),
}));

import { signOutAction as appSignOutAction } from "@/app/(site)/(authorized)/(app)/actions";
import { signOutAction as adminSignOutAction } from "@/app/(site)/(authorized)/admin/actions";

describe("authorized sign out actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
    mockRedirect.mockImplementation((url: string) => {
      // Next.js redirect throws a control-flow error whose digest starts with NEXT_REDIRECT.
      throw createRedirectError(url);
    });
  });

  it("should redirect to top after app sign out", async () => {
    await expect(appSignOutAction()).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      digest: expect.stringContaining("NEXT_REDIRECT;replace;/"),
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("should redirect to top after admin sign out", async () => {
    await expect(adminSignOutAction()).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      digest: expect.stringContaining("NEXT_REDIRECT;replace;/"),
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("should not redirect when sign out fails", async () => {
    mockSignOut.mockRejectedValue(new Error("signout_failed"));

    await expect(appSignOutAction()).rejects.toThrow("signout_failed");

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
