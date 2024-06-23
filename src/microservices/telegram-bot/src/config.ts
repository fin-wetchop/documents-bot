import * as dotenv from 'dotenv';
import { envSchema, JSONSchemaType } from 'env-schema';
import jsonSchema from 'fluent-json-schema';

dotenv.config();

interface ENV {
    TELEGRAM_BOT_TOKEN: string;

    MQ_HOST: string;
    MQ_API_PORT: number;
    MQ_GRPC_PORT: number;
    MQ_REST_PORT: number;

    DB_HOST: string;
    DB_PORT: number;
    DB_DIALECT: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_DATABASE: string;

    MINIO_HOST: string;
    MINIO_PORT: number;
    MINIO_USERNAME: string;
    MINIO_PASSWORD: string;
}

const schema: JSONSchemaType<ENV> = jsonSchema
    .object()
    .prop('TELEGRAM_BOT_TOKEN', jsonSchema.string().required())

    .prop('MQ_HOST', jsonSchema.string().required())
    .prop('MQ_API_PORT', jsonSchema.number().required())
    .prop('MQ_GRPC_PORT', jsonSchema.number().required())
    .prop('MQ_REST_PORT', jsonSchema.number().required())

    .prop('DB_HOST', jsonSchema.string().required())
    .prop('DB_PORT', jsonSchema.number().required())
    .prop(
        'DB_DIALECT',
        jsonSchema
            .enum(['mysql', 'postgres', 'sqlite', 'mariadb', 'mssql'])
            .required(),
    )
    .prop('DB_USERNAME', jsonSchema.string().required())
    .prop('DB_PASSWORD', jsonSchema.string().required())
    .prop('DB_DATABASE', jsonSchema.string().required())

    .prop('MINIO_HOST', jsonSchema.string().required())
    .prop('MINIO_PORT', jsonSchema.number().required())
    .prop('MINIO_USERNAME', jsonSchema.string().required())
    .prop('MINIO_PASSWORD', jsonSchema.string().required()) as any;

const env = envSchema({
    schema,
});

export default {
    botToken: env.TELEGRAM_BOT_TOKEN,

    mq: {
        host: env.MQ_HOST,
        apiPort: env.MQ_API_PORT,
        grpcPort: env.MQ_GRPC_PORT,
        restPort: env.MQ_REST_PORT,
    },

    database: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        dialect: env.DB_DIALECT,
        username: env.DB_USERNAME,
        password: env.DB_PASSWORD,
        database: env.DB_DATABASE,
    },

    minio: {
        host: env.MINIO_HOST,
        port: env.MINIO_PORT,
        username: env.MINIO_USERNAME,
        password: env.MINIO_PASSWORD,
    },
};
