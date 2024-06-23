import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import Document from './Document';

@Entity({ name: 'files' })
export default class File {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    minioId: string;

    @Column()
    name: string;

    @Column()
    extension: string;

    @Column({ type: 'bigint', nullable: true })
    size?: number | null;

    @Column({ type: 'text', nullable: true })
    mimeType?: string | null;

    @Column({ type: 'varchar', nullable: true })
    hash?: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date | null;

    @OneToMany(() => Document, (document) => document.file)
    documents: Document[];
}
