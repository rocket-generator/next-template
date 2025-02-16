import { z } from "zod";
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
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data as T;
    } catch (error) {
      throw new Error(`Failed to read JSON file: ${error}`);
    }
  }

  private getPublicPath(filePath: string): string {
    // Remove 'public' from the path if it exists
    const pathWithoutPublic = filePath.replace(/^public\//, "");
    
    // Convert the file path to a URL path that can be fetched
    const normalizedPath = pathWithoutPublic.replace(/\\/g, "/");
    
    // Ensure the path starts with a forward slash
    const urlPath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
    
    // Get the base URL from environment variable or construct it from request URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    return `${baseUrl}${urlPath}`;
  }

  async get(
    offset: number = 0,
    limit: number = 20,
    order?: string,
    direction?: string,
    query?: string
  ): Promise<{ data: z.infer<T>[]; count: number }> {
    try {
      // First, fetch the index file that contains the list of all available files
      const indexPath = this.getPublicPath(path.join(this.directory, "index.json"));
      const { data } = await this.readJsonFile<{ data: z.infer<T>[] }>(indexPath);
      
      const allData: z.infer<T>[] = [];
      for (const item of data) {
          allData.push(this.schema.parse(item));
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
      const filePath = this.getPublicPath(path.join(this.directory, `${id}.json`));
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
