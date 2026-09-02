import { Injectable } from '@nestjs/common';
import { PublicationEntity } from './publication.entity';
import { PublicationRepository } from './publication.repository';

@Injectable()
export class PublicationMemoryRepository implements PublicationRepository {
  private readonly publications = new Map<string, PublicationEntity>();

  public async save(entity: PublicationEntity): Promise<PublicationEntity> {
    this.publications.set(entity.id, entity);
    return entity;
  }

  public async findById(id: string): Promise<PublicationEntity | null> {
    return this.publications.get(id) ?? null;
  }

  public async find(): Promise<PublicationEntity[]> {
    return [...this.publications.values()];
  }

  public async delete(id: string): Promise<boolean> {
    return this.publications.delete(id);
  }
}
