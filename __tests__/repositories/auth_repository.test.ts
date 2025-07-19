import { AuthRepository } from "@/repositories/auth_repository";
import { AuthSchema, Auth } from "@/models/auth";
import { auth } from "@/libraries/auth";

// Mock the auth function
jest.mock("@/libraries/auth", () => ({
  auth: jest.fn(),
}));

// Create a concrete implementation for testing
class TestAuthRepository extends AuthRepository {
  private mockData: Auth[] = [];

  constructor() {
    super(AuthSchema, "user", (data) => data, ["name", "email"]);
  }

  // Override PrismaRepository methods for testing
  async get(
    offset: number = 0,
    limit: number = 20,
    order?: string,
    direction?: string,
    query?: string,
    conditions?: any[]
  ): Promise<{ data: Auth[]; count: number }> {
    let filteredData = [...this.mockData];

    // Apply conditions filter
    if (conditions && conditions.length > 0) {
      filteredData = filteredData.filter((item) =>
        conditions.every((condition) => {
          const value = item[condition.column as keyof Auth];
          switch (condition.operator) {
            case "=":
            default:
              return value === condition.value;
          }
        })
      );
    }

    return {
      data: filteredData.slice(offset, offset + limit),
      count: filteredData.length,
    };
  }

  async findById(id: string): Promise<Auth> {
    const item = this.mockData.find((item) => item.id === id);
    if (!item) {
      throw new Error(`User with id ${id} not found`);
    }
    return item;
  }

  async create(item: Omit<Auth, "id">): Promise<Auth> {
    const newItem: Auth = {
      ...item,
      id: String(this.mockData.length + 1),
    };
    this.mockData.push(newItem);
    return newItem;
  }

  async update(id: string, item: Partial<Auth>): Promise<Auth> {
    const index = this.mockData.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }

    this.mockData[index] = { ...this.mockData[index], ...item };
    return this.mockData[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.mockData.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    this.mockData.splice(index, 1);
  }

  // Helper method to add mock data
  addMockUser(user: Auth): void {
    this.mockData.push(user);
  }

  clearMockData(): void {
    this.mockData = [];
  }
}

describe("AuthRepository", () => {
  let repository: TestAuthRepository;
  let mockAuth: jest.MockedFunction<typeof auth>;

  beforeEach(() => {
    repository = new TestAuthRepository();
    mockAuth = auth as jest.MockedFunction<typeof auth>;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("getMe", () => {
    it("should return current user when authenticated", async () => {
      const user: Auth = {
        id: "user-1",
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        permissions: ["read", "write"],
      };
      repository.addMockUser(user);

      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
      } as any);

      const result = await repository.getMe();

      expect(mockAuth).toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it("should throw error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      await expect(repository.getMe()).rejects.toThrow("Unauthorized");
      expect(mockAuth).toHaveBeenCalled();
    });

    it("should throw error when session has no user", async () => {
      mockAuth.mockResolvedValue({
        user: null,
      } as any);

      await expect(repository.getMe()).rejects.toThrow("Unauthorized");
      expect(mockAuth).toHaveBeenCalled();
    });

    it("should throw error when session user has no id", async () => {
      mockAuth.mockResolvedValue({
        user: { email: "test@example.com" },
      } as any);

      await expect(repository.getMe()).rejects.toThrow("Unauthorized");
      expect(mockAuth).toHaveBeenCalled();
    });

    it("should throw error when user not found by id", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "nonexistent-user" },
      } as any);

      await expect(repository.getMe()).rejects.toThrow(
        "User with id nonexistent-user not found"
      );
      expect(mockAuth).toHaveBeenCalled();
    });
  });
});
