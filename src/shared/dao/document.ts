import { isUndefined, merge } from 'lodash';
import { EntityManager, FindOptionsRelations } from 'typeorm';
import DocumentEntity from '../orm/entities/Document';
import Order from '../types/Order';
import FindResult from '../types/FindResult';
import PermissionEntity from '../orm/entities/Permission';
import TagDAO from './tag';
import Tag from '../orm/entities/Tag';

class Document {
    private entityManager: EntityManager;

    constructor(options: Document.Options) {
        this.entityManager = options.entityManager;
    }

    private makeQuery(options: Document.FindOptions) {
        const documentRepository = this.entityManager.getRepository(
            Document.Entity,
        );

        const queryBuilder = documentRepository.createQueryBuilder('document');

        if (!isUndefined(options.forUserId)) {
            queryBuilder
                .leftJoin('document.permissions', 'permission')
                .andWhere('permission.userId = :forUserId', {
                    forUserId: options.forUserId,
                })
                .andWhere('permission.type IN (:...types)', {
                    types: [
                        PermissionEntity.Type.Owner,
                        PermissionEntity.Type.All,
                        PermissionEntity.Type.Read,
                    ],
                });
        }

        if (!isUndefined(options.query)) {
            queryBuilder.andWhere('"document"."name" ILIKE :query', {
                query: `%${options.query}%`,
            });
        }

        if (!isUndefined(options.tags)) {
            queryBuilder
                .leftJoin('document.tags', 'tag')
                .andWhere('tag.name IN (:...tags)', {
                    tags: options.tags,
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

    public async get(
        id: number,
        relations?: FindOptionsRelations<Document.Entity>,
    ) {
        const documentRepository = this.entityManager.getRepository(
            Document.Entity,
        );

        const document = await documentRepository.findOne({
            where: { id },
            relations,
        });

        return document;
    }

    public async find(
        options: Document.FindOptions,
    ): Promise<FindResult<Document.Entity>> {
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

    public async create(options: Document.CreateOptions) {
        const document = await this.entityManager.transaction(
            async (manager) => {
                const documentRepository = manager.getRepository(
                    Document.Entity,
                );
                const permissionRepository =
                    manager.getRepository(PermissionEntity);

                const tagDAO = new TagDAO({
                    entityManager: manager,
                });

                await tagDAO.createManyIfNotExists(
                    options.tags.map((tag) => ({ name: tag })),
                );

                const tags = await tagDAO.find({
                    names: options.tags,
                });

                const document = await documentRepository.save(
                    documentRepository.create({
                        file: { id: options.fileId },

                        name: options.name,

                        tags: tags.items,
                    }),
                );

                await permissionRepository.save(
                    permissionRepository.create({
                        userId: options.ownerUserId,

                        document: { id: document.id },

                        type: PermissionEntity.Type.Owner,
                    }),
                );

                return document;
            },
        );

        return document;
    }

    public async update(id: number, options: Document.UpdateOptions) {
        const document = await this.entityManager.transaction(
            async (manager) => {
                const documentRepository = manager.getRepository(
                    Document.Entity,
                );

                const exists = await documentRepository.exists({
                    where: { id },
                });

                if (!exists) {
                    throw new Error(
                        `The document with id "${id}" is not found`,
                    );
                }

                const tagDAO = new TagDAO({
                    entityManager: manager,
                });

                let tags: Tag[] | undefined;

                if (options.tags?.length) {
                    await tagDAO.createManyIfNotExists(
                        options.tags.map((tag) => ({ name: tag })),
                    );

                    tags = (
                        await tagDAO.find({
                            names: options.tags,
                        })
                    ).items;
                }

                const originalDocument = await documentRepository.findOne({
                    where: { id },
                    relations: {
                        file: true,
                        tags: true,
                        permissions: true,
                    },
                });

                const document = await documentRepository.save(
                    merge(originalDocument, {
                        file: options.fileId
                            ? { id: options.fileId }
                            : undefined,

                        name: options.name,

                        tags,
                    }),
                );

                return document;
            },
        );

        return document;
    }

    public async delete(id: number) {
        const documentRepository = this.entityManager.getRepository(
            Document.Entity,
        );

        const exists = await documentRepository.exists({ where: { id } });

        if (!exists) {
            throw new Error(`The document with id "${id}" is not found`);
        }

        await documentRepository.softDelete(id);
    }
}

namespace Document {
    export type Entity = DocumentEntity;
    export const Entity = DocumentEntity;

    export interface Options {
        entityManager: EntityManager;
    }

    export interface CreateOptions {
        ownerUserId: number;
        fileId: number;

        name: string;
        tags: string[];
    }

    export interface FindOptions {
        forUserId?: number;

        offset?: number;
        limit?: number;

        query?: string;
        tags?: string[];

        order?: Order<'id' | 'name' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
    }

    export type UpdateOptions = Partial<CreateOptions>;
}

export default Document;
