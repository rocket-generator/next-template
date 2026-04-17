jest.mock("@/repositories/user_repository", () => ({
  __esModule: true,
  UserRepository: jest.fn(),
}));

jest.mock("next-intl/server", () => ({
  __esModule: true,
  getTranslations: jest.fn(async () => (key: string) => key),
}));

jest.mock("next/navigation", () => ({
  __esModule: true,
  notFound: jest.fn(() => "__NOT_FOUND__"),
  redirect: jest.fn(),
}));

jest.mock("@/components/molecules/AdminPageHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="admin-page-header" />,
}));

jest.mock("@/components/organisms/DataView", () => ({
  __esModule: true,
  default: () => <div data-testid="data-view" />,
}));

jest.mock("@/components/organisms/DataForm", () => ({
  __esModule: true,
  default: () => <div data-testid="data-form" />,
}));

jest.mock("@/libraries/metadata", () => ({
  __esModule: true,
  createMetadata: jest.fn(),
}));

import DetailPage from "@/app/(site)/(authorized)/admin/users/[id]/page";
import EditPage from "@/app/(site)/(authorized)/admin/users/[id]/edit/page";
import {
  getLoggedEntries,
  installTestLoggerAdapters,
  resetTestLoggerState,
} from "../helpers/logger";

type UserRepositoryModule = {
  UserRepository: jest.Mock;
};

type NextNavigationModule = {
  notFound: jest.Mock;
};

const getUserRepositoryMock = () =>
  (jest.requireMock("@/repositories/user_repository") as UserRepositoryModule)
    .UserRepository;

const getNotFoundMock = () =>
  (jest.requireMock("next/navigation") as NextNavigationModule).notFound;

describe("admin user pages", () => {
  let repository: {
    findById: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    installTestLoggerAdapters();

    repository = {
      findById: jest.fn(),
    };

    getUserRepositoryMock().mockImplementation(() => repository);
  });

  afterEach(() => {
    resetTestLoggerState();
  });

  it("detail page should log and return notFound when user loading fails", async () => {
    repository.findById.mockRejectedValue(new Error("boom"));

    const result = await DetailPage({
      params: Promise.resolve({ id: "user-1" }),
    });

    expect(getNotFoundMock()).toHaveBeenCalled();
    expect(result).toBe("__NOT_FOUND__");
    expect(getLoggedEntries()).toEqual([
      expect.objectContaining({
        level: "error",
        scope: "admin_user_page",
        event: "admin_user_page.load_failed",
        context: expect.objectContaining({
          userId: "user-1",
        }),
      }),
    ]);
  });

  it("edit page should log and return notFound when user loading fails", async () => {
    repository.findById.mockRejectedValue(new Error("boom"));

    const result = await EditPage({
      params: Promise.resolve({ id: "user-1" }),
    });

    expect(getNotFoundMock()).toHaveBeenCalled();
    expect(result).toBe("__NOT_FOUND__");
    expect(getLoggedEntries()).toEqual([
      expect.objectContaining({
        level: "error",
        scope: "admin_user_edit_page",
        event: "admin_user_edit_page.load_failed",
        context: expect.objectContaining({
          userId: "user-1",
        }),
      }),
    ]);
  });
});
