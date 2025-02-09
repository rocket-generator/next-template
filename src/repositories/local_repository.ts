import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { BaseRepository } from "./base_repository";

interface LocalConfig {
  directory: string;
}

export abstract class LocalRepository<
  T extends z.ZodObject<z.ZodRawShape, "strip">
> extends BaseRepository<T> {
  private readonly directory: string;

  protected constructor(
    schema: T,
    endpoint: string,
    config: LocalConfig,
    accessToken?: string
  ) {
    super(schema, endpoint, accessToken);
    this.directory = config.directory;
  }

  private async readJsonFile<T>(filePath: string): Promise<T> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Failed to read JSON file: ${error}`);
    }
  }

  async get(
    offset: number = 0,
    limit: number = 20,
    order?: string,
    direction?: string,
    query?: string
  ): Promise<{ data: z.infer<T>[]; count: number }> {
    console.log(query);
    try {
      const files = await fs.readdir(this.directory);
      const jsonFiles = files.filter((file) => file.endsWith(".json"));

      const allData: z.infer<T>[] = [];
      for (const file of jsonFiles) {
        const filePath = path.join(this.directory, file);
        const data = await this.readJsonFile<z.infer<T>>(filePath);
        allData.push(this.schema.parse(data));
      }

      // Apply search if query is specified
      let filteredData = allData;
      if (query) {
        filteredData = allData.filter((item) => {
          return Object.values(item).some((value) =>
            String(value).toLowerCase().includes(query.toLowerCase())
          );
        });
      }

      // Apply sorting if order is specified
      if (order && direction) {
        filteredData.sort((a, b) => {
          const factor = direction === "desc" ? -1 : 1;
          const aValue = a[order as keyof z.infer<T>];
          const bValue = b[order as keyof z.infer<T>];
          if (aValue === undefined || bValue === undefined) return 0;
          return factor * (aValue > bValue ? 1 : -1);
        });
      }

      // Apply pagination
      const paginatedData = filteredData.slice(offset, offset + limit);

      return {
        data: paginatedData,
        count: filteredData.length,
      };
    } catch (error) {
      throw new Error(`Failed to get data: ${error}`);
    }
  }

  async findById(id: string): Promise<z.infer<T>> {
    try {
      const filePath = path.join(this.directory, `${id}.json`);
      const data = await this.readJsonFile<z.infer<T>>(filePath);
      return this.schema.parse(data);
    } catch (error) {
      throw new Error(`Failed to find item by ID: ${error}`);
    }
  }

  // Create operation - returns mock success without actual file creation
  async create(item: Omit<z.infer<T>, "id">): Promise<z.infer<T>> {
    const mockId = "mock-" + Date.now();
    return this.schema.parse({
      id: mockId,
      ...item,
    });
  }

  // Update operation - returns mock success without actual file modification
  async update(id: string, item: Partial<z.infer<T>>): Promise<z.infer<T>> {
    try {
      const existingData = await this.findById(id);
      return this.schema.parse({
        ...existingData,
        ...item,
      });
    } catch (error) {
      throw new Error(`Failed to update item: ${error}`);
    }
  }

  // Delete operation - returns mock success without actual file deletion
  async delete(id: string): Promise<void> {
    try {
      // Just verify the file exists
      await this.findById(id);
      return;
    } catch (error) {
      throw new Error(`Failed to delete item: ${error}`);
    }
  }
}
