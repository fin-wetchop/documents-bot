import * as dotenv from 'dotenv';
import { envSchema, JSONSchemaType } from 'env-schema';
import jsonSchema from 'fluent-json-schema';

dotenv.config();

interface ENV {
    DB_HOST: string;
    DB_PORT: number;
    DB_DIALECT: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_DATABASE: string;
}

const schema: JSONSchemaType<ENV> = jsonSchema
    .object()
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
    .prop('DB_DATABASE', jsonSchema.string().required()) as any;

const env = envSchema({
    schema,
});

export default {
    database: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        dialect: env.DB_DIALECT,
        username: env.DB_USERNAME,
        password: env.DB_PASSWORD,
        database: env.DB_DATABASE,
    },
};
