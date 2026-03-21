import { renderHook } from "@testing-library/react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useSession } from "@/libraries/auth-client";

jest.mock("@/libraries/auth-client", () => ({
  __esModule: true,
  useSession: jest.fn(),
}));

describe("useAuthSession", () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("data.user 直下のユーザー情報を返す", () => {
    const refetch = jest.fn();
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          permissions: ["admin", "editor"],
        },
        session: {
          expiresAt: "2026-03-22T10:00:00.000Z",
        },
      },
      isPending: false,
      isRefetching: false,
      error: null,
      refetch,
    } as unknown as ReturnType<typeof useSession>);

    const { result } = renderHook(() => useAuthSession());

    expect(result.current.user).toEqual({
      id: "user-1",
      permissions: ["admin", "editor"],
    });
    expect(result.current.session).toEqual({
      expiresAt: "2026-03-22T10:00:00.000Z",
    });
    expect(result.current.permissions).toEqual(["admin", "editor"]);
    expect(result.current.refetch).toBe(refetch);
  });

  it("data.user がない場合は data.session.user を利用する", () => {
    mockUseSession.mockReturnValue({
      data: {
        session: {
          user: {
            id: "user-2",
            name: "Viewer",
            permissions: ["viewer"],
          },
          expiresAt: "2026-03-22T11:00:00.000Z",
        },
      },
      isPending: false,
      isRefetching: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const { result } = renderHook(() => useAuthSession());

    expect(result.current.user).toEqual({
      id: "user-2",
      name: "Viewer",
      permissions: ["viewer"],
    });
    expect(result.current.permissions).toEqual(["viewer"]);
  });

  it("permissions が配列でない場合は空配列を返す", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "user-3",
          permissions: "admin",
        },
      },
      isPending: true,
      isRefetching: false,
      error: new Error("loading"),
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const { result } = renderHook(() => useAuthSession());

    expect(result.current.permissions).toEqual([]);
    expect(result.current.isPending).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
