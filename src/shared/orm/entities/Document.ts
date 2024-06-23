import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    RelationId,
    UpdateDateColumn,
} from 'typeorm';
import Tag from './Tag';
import File from './File';
import Permission from './Permission';

@Entity({ name: 'documents' })
export default class Document {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;

    @ManyToOne(() => File, (file) => file.documents)
    file: File;

    @RelationId((document: Document) => document.file)
    fileId: number;

    @ManyToMany(() => Tag, (tag) => tag.documents)
    @JoinTable()
    tags: Tag[];

    @RelationId((document: Document) => document.tags)
    tagIds: number[];

    @OneToMany(() => Permission, (permission) => permission.document)
    permissions: Permission[];

    @RelationId((document: Document) => document.permissions)
    permissionIds: number[];
}
