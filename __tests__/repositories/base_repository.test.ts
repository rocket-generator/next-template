import { z } from "zod";
import {
  BaseRepository,
  SearchCondition,
  SearchOperator,
} from "@/repositories/base_repository";

// Create a concrete implementation for testing
const TestSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  age: z.number(),
});

type TestModel = z.infer<typeof TestSchema>;

class TestRepository extends BaseRepository<typeof TestSchema> {
  protected searchFields = ["name", "email"];
  private mockData: TestModel[] = [
    { id: "1", name: "Test User 1", email: "test1@example.com", age: 25 },
    { id: "2", name: "Test User 2", email: "test2@example.com", age: 30 },
    { id: "3", name: "Another User", email: "another@example.com", age: 35 },
  ];

  constructor() {
    super(TestSchema);
  }

  async get(
    offset: number = 0,
    limit: number = 20,
    order?: string,
    direction?: string,
    query?: string,
    conditions?: SearchCondition[]
  ): Promise<{ data: TestModel[]; count: number }> {
    let filteredData = [...this.mockData];

    // Apply query filter
    if (query) {
      filteredData = filteredData.filter((item) =>
        this.searchFields.some((field) =>
          String(item[field as keyof TestModel])
            .toLowerCase()
            .includes(query.toLowerCase())
        )
      );
    }

    // Apply conditions
    if (conditions) {
      filteredData = filteredData.filter((item) =>
        conditions.every((condition) => {
          const value = item[condition.column as keyof TestModel];
          const operator = condition.operator || "=";

          switch (operator) {
            case "=":
              return value === condition.value;
            case "!=":
              return value !== condition.value;
            case "contains":
              return String(value)
                .toLowerCase()
                .includes(String(condition.value).toLowerCase());
            case ">":
              return (
                typeof value === "number" &&
                typeof condition.value === "number" &&
                value > condition.value
              );
            case ">=":
              return (
                typeof value === "number" &&
                typeof condition.value === "number" &&
                value >= condition.value
              );
            case "<":
              return (
                typeof value === "number" &&
                typeof condition.value === "number" &&
                value < condition.value
              );
            case "<=":
              return (
                typeof value === "number" &&
                typeof condition.value === "number" &&
                value <= condition.value
              );
            case "in":
              return Array.isArray(condition.value)
                ? condition.value.includes(value)
                : false;
            default:
              return false;
          }
        })
      );
    }

    // Apply sorting
    if (order) {
      filteredData.sort((a, b) => {
        const aValue = a[order as keyof TestModel];
        const bValue = b[order as keyof TestModel];
        const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return direction === "desc" ? -result : result;
      });
    }

    // Apply pagination
    const paginatedData = filteredData.slice(offset, offset + limit);

    return {
      data: paginatedData,
      count: filteredData.length,
    };
  }

  async findById(id: string): Promise<TestModel> {
    const item = this.mockData.find((item) => item.id === id);
    if (!item) {
      throw new Error(`Item with id ${id} not found`);
    }
    return item;
  }

  async create(item: Omit<TestModel, "id">): Promise<TestModel> {
    const newItem: TestModel = {
      ...item,
      id: String(this.mockData.length + 1),
    };
    this.mockData.push(newItem);
    return newItem;
  }

  async update(id: string, item: Partial<TestModel>): Promise<TestModel> {
    const index = this.mockData.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }

    this.mockData[index] = { ...this.mockData[index], ...item };
    return this.mockData[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.mockData.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }
    this.mockData.splice(index, 1);
  }
}

describe("BaseRepository", () => {
  let repository: TestRepository;

  beforeEach(() => {
    repository = new TestRepository();
  });

  describe("SearchOperator and SearchCondition Types", () => {
    it("should define valid search operators", () => {
      const operators: SearchOperator[] = [
        "=",
        "!=",
        "contains",
        ">",
        ">=",
        "<",
        "<=",
        "in",
      ];

      operators.forEach((operator) => {
        expect(typeof operator).toBe("string");
      });
    });

    it("should create valid search conditions", () => {
      const condition: SearchCondition = {
        column: "name",
        value: "test",
        operator: "contains",
      };

      expect(condition.column).toBe("name");
      expect(condition.value).toBe("test");
      expect(condition.operator).toBe("contains");
    });

    it("should allow optional operator in search condition", () => {
      const condition: SearchCondition = {
        column: "id",
        value: "123",
      };

      expect(condition.operator).toBeUndefined();
    });
  });

  describe("get", () => {
    it("should return all data when no filters applied", async () => {
      const result = await repository.get();

      expect(result.data).toHaveLength(3);
      expect(result.count).toBe(3);
      expect(result.data[0]).toEqual({
        id: "1",
        name: "Test User 1",
        email: "test1@example.com",
        age: 25,
      });
    });

    it("should apply pagination correctly", async () => {
      const result = await repository.get(1, 1);

      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(3);
      expect(result.data[0].id).toBe("2");
    });

    it("should filter by query string", async () => {
      const result = await repository.get(
        0,
        20,
        undefined,
        undefined,
        "Test User"
      );

      expect(result.data).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.data.every((item) => item.name.includes("Test User"))).toBe(
        true
      );
    });

    it("should apply search conditions with equals operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "name", value: "Test User 1", operator: "=" },
      ];
      const result = await repository.get(
        0,
        20,
        undefined,
        undefined,
        undefined,
        conditions
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Test User 1");
    });

    it("should apply search conditions with not equals operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "name", value: "Test User 1", operator: "!=" },
      ];
      const result = await repository.get(
        0,
        20,
        undefined,
        undefined,
        undefined,
        conditions
      );

      expect(result.data).toHaveLength(2);
      expect(result.data.every((item) => item.name !== "Test User 1")).toBe(
        true
      );
    });

    it("should apply search conditions with contains operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "email", value: "test", operator: "contains" },
      ];
      const result = await repository.get(
        0,
        20,
        undefined,
        undefined,
        undefined,
        conditions
      );

      expect(result.data).toHaveLength(2);
      expect(result.data.every((item) => item.email.includes("test"))).toBe(
        true
      );
    });

    it("should apply search conditions with greater than operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "age", value: 30, operator: ">" },
      ];
      const result = await repository.get(
        0,
        20,
        undefined,
        undefined,
        undefined,
        conditions
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].age).toBe(35);
    });

    it("should apply search conditions with in operator", async () => {
      const conditions: SearchCondition[] = [
        { column: "age", value: [25, 35], operator: "in" },
      ];
      const result = await repository.get(
        0,
        20,
        undefined,
        undefined,
        undefined,
        conditions
      );

      expect(result.data).toHaveLength(2);
      expect(result.data.some((item) => item.age === 25)).toBe(true);
      expect(result.data.some((item) => item.age === 35)).toBe(true);
    });

    it("should sort data ascending", async () => {
      const result = await repository.get(0, 20, "age", "asc");

      expect(result.data[0].age).toBe(25);
      expect(result.data[1].age).toBe(30);
      expect(result.data[2].age).toBe(35);
    });

    it("should sort data descending", async () => {
      const result = await repository.get(0, 20, "age", "desc");

      expect(result.data[0].age).toBe(35);
      expect(result.data[1].age).toBe(30);
      expect(result.data[2].age).toBe(25);
    });

    it("should combine multiple search conditions", async () => {
      const conditions: SearchCondition[] = [
        { column: "age", value: 20, operator: ">=" },
        { column: "name", value: "Test", operator: "contains" },
      ];
      const result = await repository.get(
        0,
        20,
        undefined,
        undefined,
        undefined,
        conditions
      );

      expect(result.data).toHaveLength(2);
      expect(
        result.data.every(
          (item) => item.age >= 20 && item.name.includes("Test")
        )
      ).toBe(true);
    });
  });

  describe("findById", () => {
    it("should find item by id", async () => {
      const result = await repository.findById("1");

      expect(result).toEqual({
        id: "1",
        name: "Test User 1",
        email: "test1@example.com",
        age: 25,
      });
    });

    it("should throw error when item not found", async () => {
      await expect(repository.findById("999")).rejects.toThrow(
        "Item with id 999 not found"
      );
    });
  });

  describe("create", () => {
    it("should create new item", async () => {
      const newItem = {
        name: "New User",
        email: "new@example.com",
        age: 40,
      };

      const result = await repository.create(newItem);

      expect(result).toEqual({
        id: "4",
        name: "New User",
        email: "new@example.com",
        age: 40,
      });

      // Verify it was added to the collection
      const allItems = await repository.get();
      expect(allItems.count).toBe(4);
    });
  });

  describe("update", () => {
    it("should update existing item", async () => {
      const updates = {
        name: "Updated User",
        age: 26,
      };

      const result = await repository.update("1", updates);

      expect(result).toEqual({
        id: "1",
        name: "Updated User",
        email: "test1@example.com",
        age: 26,
      });
    });

    it("should throw error when updating non-existent item", async () => {
      await expect(repository.update("999", { name: "Test" })).rejects.toThrow(
        "Item with id 999 not found"
      );
    });
  });

  describe("delete", () => {
    it("should delete existing item", async () => {
      await repository.delete("1");

      const allItems = await repository.get();
      expect(allItems.count).toBe(2);
      expect(allItems.data.find((item) => item.id === "1")).toBeUndefined();
    });

    it("should throw error when deleting non-existent item", async () => {
      await expect(repository.delete("999")).rejects.toThrow(
        "Item with id 999 not found"
      );
    });
  });

  describe("schema validation", () => {
    it("should have access to schema", () => {
      expect(repository["schema"]).toBeDefined();
      expect(repository["schema"]).toBe(TestSchema);
    });

    it("should have defined search fields", () => {
      expect(repository["searchFields"]).toEqual(["name", "email"]);
    });
  });
});
