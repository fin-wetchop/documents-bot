import { isUndefined } from 'lodash';
import { EntityManager, In } from 'typeorm';
import TagEntity from '../orm/entities/Tag';
import Order from '../types/Order';
import FindResult from '../types/FindResult';

class Tag {
    private entityManager: EntityManager;

    constructor(options: Tag.Options) {
        this.entityManager = options.entityManager;
    }

    private makeQuery(options: Tag.FindOptions) {
        const documentRepository = this.entityManager.getRepository(Tag.Entity);

        const queryBuilder = documentRepository.createQueryBuilder('document');

        if (!isUndefined(options.name)) {
            queryBuilder.andWhere('"document"."name" ILIKE :name', {
                name: `%${options.name}%`,
            });
        }

        if (!isUndefined(options.names)) {
            queryBuilder.andWhere('"document"."name" IN (:...names)', {
                names: options.names,
            });
        }

        queryBuilder.addGroupBy('"document"."id"');

        if (!isUndefined(options.order)) {
            options.order.forEach((order) => {
                queryBuilder.addOrderBy(
                    `"document"."${order.key}"`,
                    order.direction.toUpperCase() as 'ASC' | 'DESC',
                );
            });
        } else {
            queryBuilder.orderBy('"document"."id"');
        }

        queryBuilder.offset(options.offset).limit(options.limit);

        return queryBuilder;
    }

    public async get(id: number) {
        const documentRepository = this.entityManager.getRepository(Tag.Entity);

        const document = await documentRepository.findOneBy({ id });

        return document;
    }

    public async find(
        options: Tag.FindOptions,
    ): Promise<FindResult<Tag.Entity>> {
        const queryBuilder = this.makeQuery(options);

        const [documents, total] = await queryBuilder.getManyAndCount();

        return {
            pagination: {
                offset: options.offset ?? 0,
                limit: options.limit,
                total,
            },
            items: documents,
        };
    }

    public async create(options: Tag.CreateOptions) {
        const tag = await this.entityManager.transaction(
            async (transaction) => {
                const tagRepository = transaction.getRepository(Tag.Entity);

                const tag = await tagRepository.save(
                    tagRepository.create({
                        name: options.name,
                    }),
                );

                return tag;
            },
        );

        return tag;
    }

    public async createIfNotExists(options: Tag.CreateOptions) {
        const tagRepository = this.entityManager.getRepository(Tag.Entity);

        const tag = await tagRepository.findOne({
            where: { name: options.name },
        });

        if (tag) {
            return tag;
        }

        return this.create(options);
    }

    public async createMany(options: Tag.CreateOptions[]) {
        const tags = await this.entityManager.transaction(
            async (transaction) => {
                const tagRepository = transaction.getRepository(Tag.Entity);

                const tags = await tagRepository.save(
                    tagRepository.create(
                        options.map((option) => ({ name: option.name })),
                    ),
                );

                return tags;
            },
        );

        return tags;
    }

    public async createManyIfNotExists(options: Tag.CreateOptions[]) {
        const tagRepository = this.entityManager.getRepository(Tag.Entity);

        const tagNames = options.map((option) => option.name);

        const tags = await tagRepository.find({
            where: { name: In(tagNames) },
        });

        const existingTagNames = tags.map((tag) => tag.name);

        const newTagOptions = options.filter(
            (option) => !existingTagNames.includes(option.name),
        );

        return this.createMany(newTagOptions);
    }

    public async update(id: number, options: Tag.UpdateOptions) {
        await this.entityManager.transaction(async (manager) => {
            const tagRepository = manager.getRepository(Tag.Entity);

            const exists = await tagRepository.exists({ where: { id } });

            if (!exists) {
                throw new Error(`The document with id "${id}" is not found`);
            }

            await tagRepository.update(id, {
                name: options.name,
            });
        });

        return this.get(id);
    }

    public async delete(id: number) {
        const tagRepository = this.entityManager.getRepository(Tag.Entity);

        const exists = await tagRepository.exists({ where: { id } });

        if (!exists) {
            throw new Error(`The document with id "${id}" is not found`);
        }

        await tagRepository.delete(id);
    }
}

namespace Tag {
    export type Entity = TagEntity;
    export const Entity = TagEntity;

    export interface Options {
        entityManager: EntityManager;
    }

    export interface CreateOptions {
        name: string;
    }

    export interface FindOptions {
        offset?: number;
        limit?: number;

        name?: string;
        names?: string[];

        order?: Order<'id' | 'name' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
    }

    export type UpdateOptions = Partial<CreateOptions>;
}

export default Tag;
