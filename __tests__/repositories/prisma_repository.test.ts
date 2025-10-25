import { PrismaRepository, getPrismaModel } from "@/repositories/prisma_repository";
import { SearchCondition } from "@/repositories/base_repository";
import { z } from "zod";

// Mock Prisma client
jest.mock("@/libraries/prisma", () => {
  const mockPrismaModel = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  return {
    prisma: {
      testModel: mockPrismaModel,
      user: mockPrismaModel,
      post: mockPrismaModel,
    },
  };
});

// Test schema for testing purposes
const TestSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  age: z.number().optional(),
  active: z.boolean().default(true),
});

type TestType = z.infer<typeof TestSchema>;

// Create a concrete implementation for testing
class TestPrismaRepository extends PrismaRepository<typeof TestSchema> {
  constructor() {
    super(
      TestSchema,
      "testModel",
      (data: any) => ({ ...data }), // Simple transform function
      ["name", "email"]
    );
  }
}

describe("PrismaRepository", () => {
  let repository: TestPrismaRepository;
  let mockPrismaModel: any;

  beforeEach(() => {
    repository = new TestPrismaRepository();
    mockPrismaModel = require("@/libraries/prisma").prisma.testModel;
    jest.clearAllMocks();
  });

  describe("getPrismaModel", () => {
    it("should return correct Prisma model", () => {
      const model = getPrismaModel("testModel");
      expect(model).toBeDefined();
      expect(model).toBe(mockPrismaModel);
    });

    it("should return different models for different names", () => {
      const userModel = getPrismaModel("user");
      const postModel = getPrismaModel("post");
      
      expect(userModel).toBeDefined();
      expect(postModel).toBeDefined();
      expect(userModel).toBe(mockPrismaModel);
      expect(postModel).toBe(mockPrismaModel);
    });
  });

  describe("get", () => {
    it("should fetch data with default parameters", async () => {
      const mockData = [
        { id: "1", name: "Test 1", email: "test1@example.com", active: true },
        { id: "2", name: "Test 2", email: "test2@example.com", active: false },
      ];

      mockPrismaModel.findMany.mockResolvedValue(mockData);
      mockPrismaModel.count.mockResolvedValue(2);

      const result = await repository.get();

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: undefined,
        where: {},
      });
      expect(mockPrismaModel.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        data: mockData,
        count: 2,
      });
    });

    it("should fetch data with pagination parameters", async () => {
      const mockData = [
        { id: "3", name: "Test 3", email: "test3@example.com", active: true },
      ];

      mockPrismaModel.findMany.mockResolvedValue(mockData);
      mockPrismaModel.count.mockResolvedValue(10);

      const result = await repository.get(5, 1, "name", "desc");

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 1,
        orderBy: { name: "desc" },
        where: {},
      });
      expect(result).toEqual({
        data: mockData,
        count: 10,
      });
    });

    it("should fetch data with query search", async () => {
      const mockData = [
        { id: "1", name: "John Doe", email: "john@example.com", active: true },
      ];

      mockPrismaModel.findMany.mockResolvedValue(mockData);
      mockPrismaModel.count.mockResolvedValue(1);

      await repository.get(0, 20, undefined, undefined, "John");

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: undefined,
        where: {
          OR: [
            { name: { contains: "John", mode: "insensitive" } },
            { email: { contains: "John", mode: "insensitive" } },
          ],
        },
      });
    });

    it("should fetch data with search conditions", async () => {
      const mockData = [
        { id: "1", name: "Active User", email: "active@example.com", active: true },
      ];

      mockPrismaModel.findMany.mockResolvedValue(mockData);
      mockPrismaModel.count.mockResolvedValue(1);

      const conditions: SearchCondition[] = [
        { column: "active", operator: "=", value: true },
      ];

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: undefined,
        where: { active: { equals: true } },
      });
    });

    it("should fetch data with both query and conditions", async () => {
      const mockData: TestType[] = [];

      mockPrismaModel.findMany.mockResolvedValue(mockData);
      mockPrismaModel.count.mockResolvedValue(0);

      const conditions: SearchCondition[] = [
        { column: "active", operator: "=", value: true },
      ];

      await repository.get(0, 20, undefined, undefined, "search", conditions);

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: undefined,
        where: {
          AND: [
            {
              OR: [
                { name: { contains: "search", mode: "insensitive" } },
                { email: { contains: "search", mode: "insensitive" } },
              ],
            },
            { active: { equals: true } },
          ],
        },
      });
    });
  });

  describe("findById", () => {
    it("should find item by id successfully", async () => {
      const mockData: TestType = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        active: true,
        age: undefined,
      };

      mockPrismaModel.findUnique.mockResolvedValue(mockData);

      const result = await repository.findById("1");

      expect(mockPrismaModel.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(result).toEqual(mockData);
    });

    it("should throw error when item not found", async () => {
      mockPrismaModel.findUnique.mockResolvedValue(null);

      await expect(repository.findById("nonexistent")).rejects.toThrow(
        "testModel with id nonexistent not found"
      );
    });
  });

  describe("create", () => {
    it("should create item successfully", async () => {
      const itemData: Omit<TestType, "id"> = {
        name: "New User",
        email: "new@example.com",
        age: undefined,
        active: true,
      };

      const mockCreatedData = {
        id: "new-id",
        ...itemData,
      };

      mockPrismaModel.create.mockResolvedValue(mockCreatedData);

      const result = await repository.create(itemData);

      expect(mockPrismaModel.create).toHaveBeenCalledWith({
        data: itemData,
      });
      expect(result).toEqual(mockCreatedData);
    });

    it("should create item with optional fields", async () => {
      const itemData: Omit<TestType, "id"> = {
        name: "User with Age",
        email: "user@example.com",
        age: 25,
        active: true,
      };

      const mockCreatedData = {
        id: "user-with-age",
        ...itemData,
        active: true, // Default value
      };

      mockPrismaModel.create.mockResolvedValue(mockCreatedData);

      const result = await repository.create(itemData);

      expect(result).toEqual(mockCreatedData);
    });
  });

  describe("update", () => {
    it("should update item successfully", async () => {
      const updateData: Partial<TestType> = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      const mockUpdatedData = {
        id: "1",
        ...updateData,
        active: true,
      };

      mockPrismaModel.update.mockResolvedValue(mockUpdatedData);

      const result = await repository.update("1", updateData);

      expect(mockPrismaModel.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: updateData,
      });
      expect(result).toEqual(mockUpdatedData);
    });

    it("should update partial item data", async () => {
      const updateData: Partial<TestType> = {
        name: "Only Name Updated",
      };

      const mockUpdatedData = {
        id: "1",
        name: "Only Name Updated",
        email: "original@example.com",
        active: true,
      };

      mockPrismaModel.update.mockResolvedValue(mockUpdatedData);

      const result = await repository.update("1", updateData);

      expect(result).toEqual(mockUpdatedData);
    });
  });

  describe("delete", () => {
    it("should delete item successfully", async () => {
      mockPrismaModel.delete.mockResolvedValue({ id: "1" });

      await repository.delete("1");

      expect(mockPrismaModel.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });

  describe("buildSearchQuery", () => {
    it("should build query for equals operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "name", operator: "=", value: "Test" },
      ];

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { equals: "Test" } },
        })
      );
    });

    it("should build query for not equals operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "name", operator: "!=", value: "Excluded" },
      ];

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { not: "Excluded" } },
        })
      );
    });

    it("should build query for contains operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "name", operator: "contains", value: "partial" },
      ];

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: "partial", mode: "insensitive" } },
        })
      );
    });

    it("should build query for greater than operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "age", operator: ">", value: 18 },
      ];

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { age: { gt: 18 } },
        })
      );
    });

    it("should build query for greater than or equal operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "age", operator: ">=", value: 21 },
      ];

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { age: { gte: 21 } },
        })
      );
    });

    it("should build query for less than operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "age", operator: "<", value: 65 },
      ];

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { age: { lt: 65 } },
        })
      );
    });

    it("should build query for less than or equal operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "age", operator: "<=", value: 60 },
      ];

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { age: { lte: 60 } },
        })
      );
    });

    it("should build query for in operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "name", operator: "in", value: ["Alice", "Bob", "Charlie"] },
      ];

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { in: ["Alice", "Bob", "Charlie"] } },
        })
      );
    });

    it("should build query with multiple conditions using AND", async () => {
      const conditions: SearchCondition[] = [
        { column: "active", operator: "=", value: true },
        { column: "age", operator: ">=", value: 18 },
      ];

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { active: { equals: true } },
              { age: { gte: 18 } },
            ],
          },
        })
      );
    });

    it("should handle invalid operator gracefully", async () => {
      const conditions: SearchCondition[] = [
        { column: "name", operator: "invalid" as any, value: "test" },
      ];

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Unsupported operator detected: invalid"
      );
      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );

      consoleSpy.mockRestore();
    });

    it("should handle invalid value type for contains operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "name", operator: "contains", value: 123 as any },
      ];

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Operator 'contains' requires string value for column 'name'. Got number"
      );

      consoleSpy.mockRestore();
    });

    it("should handle invalid value type for in operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "name", operator: "in", value: "not-an-array" as any },
      ];

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      await repository.get(0, 20, undefined, undefined, undefined, conditions);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Operator 'in' requires an array value for column 'name'. Got string"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("buildQuerySearch", () => {
    it("should handle empty query", async () => {
      await repository.get(0, 20, undefined, undefined, "");

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it("should handle whitespace query", async () => {
      await repository.get(0, 20, undefined, undefined, "   ");

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it("should handle single search field", async () => {
      // Create repository with single search field
      class SingleFieldRepository extends PrismaRepository<typeof TestSchema> {
        constructor() {
          super(TestSchema, "testModel", (data: any) => ({ ...data }), ["name"]);
        }
      }

      const singleFieldRepo = new SingleFieldRepository();
      
      await singleFieldRepo.get(0, 20, undefined, undefined, "search");

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: "search", mode: "insensitive" } },
        })
      );
    });

    it("should handle multiple search fields with OR", async () => {
      await repository.get(0, 20, undefined, undefined, "search");

      expect(mockPrismaModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "search", mode: "insensitive" } },
              { email: { contains: "search", mode: "insensitive" } },
            ],
          },
        })
      );
    });
  });
});
