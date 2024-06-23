import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    RelationId,
    UpdateDateColumn,
} from 'typeorm';
import Document from './Document';

@Entity({ name: 'permissions' })
class Permission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'bigint' })
    userId: number;

    @Column({ type: 'varchar' })
    type: Permission.Type;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;

    @ManyToOne(() => Document, (document) => document.permissions)
    document: Document;

    @RelationId((permission: Permission) => permission.document)
    documentId: number;
}

namespace Permission {
    export enum Type {
        Owner = 'owner',

        All = 'all',

        Read = 'read',
        Update = 'update',
        Delete = 'delete',
    }
}

export default Permission;
