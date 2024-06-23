import { difference, uniq } from 'lodash';
import {
    DeepPartial,
    EntityManager,
    EntityTarget,
    FindOptionsRelations,
    FindOptionsWhere,
    In,
    ObjectLiteral,
} from 'typeorm';

interface Options<
    RelationEntity extends ObjectLiteral,
    CurrentEntityKey extends Exclude<keyof RelationEntity, SideEntityKey>,
    SideEntityKey extends string, // Exclude<keyof RelationEntity, CurrentEntityKey>
> {
    entityManager: EntityManager;

    SideEntityClass: EntityTarget<RelationEntity[SideEntityKey]>;
    currentEntityPK?: keyof RelationEntity[CurrentEntityKey];
    sideEntityPK?: keyof RelationEntity[SideEntityKey];

    RelationEntityClass: EntityTarget<RelationEntity>;
    currentEntityKey: CurrentEntityKey;
    sideEntityKey: SideEntityKey;

    currentId: number;
    sideIds: number[] | undefined;

    ignoreNotExistErrors?: boolean;
}

export async function relink<
    RelationEntity extends ObjectLiteral,
    CurrentEntityKey extends Exclude<keyof RelationEntity, SideEntityKey>,
    SideEntityKey extends string, // Exclude<keyof RelationEntity, CurrentEntityKey>
>({
    entityManager,

    SideEntityClass,
    currentEntityPK = 'id',
    sideEntityPK = 'id',

    RelationEntityClass,
    currentEntityKey,
    sideEntityKey,

    currentId,
    sideIds,
    ignoreNotExistErrors = false,
}: Options<RelationEntity, CurrentEntityKey, SideEntityKey>) {
    type SideEntity = RelationEntity[SideEntityKey];

    if (Array.isArray(sideIds)) {
        let uniqIds = uniq(sideIds);

        if (uniqIds.length) {
            const items = await entityManager.find(SideEntityClass, {
                where: {
                    [sideEntityPK]: In(uniqIds),
                } as FindOptionsWhere<SideEntity>,
            });

            const notExistItems = uniqIds.filter(
                (uniqId) => !items.some((item) => item.id === uniqId),
            );

            if (!ignoreNotExistErrors && notExistItems.length) {
                throw new Error(
                    `Item ${notExistItems.join(', ')} do not exist`,
                );
            } else {
                uniqIds = items.map((item) => item.id);
            }
        }

        const linkedSideItemIds = (
            await entityManager.find(RelationEntityClass, {
                where: {
                    [currentEntityKey]: { [currentEntityPK]: currentId },
                } as FindOptionsWhere<RelationEntity>,
                relations: {
                    [sideEntityKey]: {},
                } as FindOptionsRelations<RelationEntity>,
            })
        ).map(
            (relationItems) =>
                relationItems[sideEntityKey as keyof RelationEntity][
                    sideEntityPK
                ],
        );

        const idsToDelete = difference(linkedSideItemIds, uniqIds);
        const idsToCreate = difference(uniqIds, linkedSideItemIds);

        if (idsToDelete.length) {
            await entityManager.delete(RelationEntityClass, {
                [currentEntityKey]: { [currentEntityPK]: currentId },
                [sideEntityKey]: { [sideEntityPK]: In(idsToDelete) },
            });
        }

        if (idsToCreate.length) {
            await entityManager.save(
                idsToCreate.map((idToCreate) =>
                    entityManager.create(RelationEntityClass, {
                        [currentEntityKey]: { [currentEntityPK]: currentId },
                        [sideEntityKey]: { [sideEntityPK]: idToCreate },
                    } as DeepPartial<RelationEntity>),
                ),
            );
        }

        return {
            deletedIds: idsToDelete as number[],
            createdIds: idsToCreate as number[],
        };
    }

    return {
        deletedIds: [] as number[],
        createdIds: [] as number[],
    };
}

const entities = {
    relink,
};

export default entities;
