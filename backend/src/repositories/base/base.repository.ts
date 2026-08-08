/**
 * Repository base interfaces & abstract helpers.
 * Concrete repositories + Mongoose models come later — do NOT add models here.
 */

export interface FindOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

export interface IRepository<T, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  findById(id: string): Promise<T | null>;
  findOne(filter: Partial<T>): Promise<T | null>;
  findMany(filter: Partial<T>, options?: FindOptions): Promise<T[]>;
  count(filter: Partial<T>): Promise<number>;
  create(data: CreateDto): Promise<T>;
  updateById(id: string, data: UpdateDto): Promise<T | null>;
  deleteById(id: string): Promise<boolean>;
}

/**
 * Abstract base — subclasses inject a model/collection adapter.
 * Kept model-agnostic so DI and testing stay clean.
 */
export abstract class BaseRepository<T extends { id: string }, CreateDto = Partial<T>, UpdateDto = Partial<T>>
  implements IRepository<T, CreateDto, UpdateDto>
{
  abstract findById(id: string): Promise<T | null>;
  abstract findOne(filter: Partial<T>): Promise<T | null>;
  abstract findMany(filter: Partial<T>, options?: FindOptions): Promise<T[]>;
  abstract count(filter: Partial<T>): Promise<number>;
  abstract create(data: CreateDto): Promise<T>;
  abstract updateById(id: string, data: UpdateDto): Promise<T | null>;
  abstract deleteById(id: string): Promise<boolean>;

  async exists(id: string): Promise<boolean> {
    const doc = await this.findById(id);
    return doc !== null;
  }
}
