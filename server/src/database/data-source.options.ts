import { config } from 'dotenv';
import type { DataSourceOptions } from 'typeorm';

config({ path: `${__dirname}/../../../.env` });

const isProduction = process.env.NODE_ENV === 'production';

export interface PostgresConnection {
  url?: string;
  host?: string;
  port: number;
  username?: string;
  password: string;
  database?: string;
  ssl: boolean;
}

export function postgresConnection(): PostgresConnection {
  const url = process.env.DATABASE_URL;
  const ssl = url ? !url.includes('sslmode=disable') : process.env.DB_SSL === 'true';

  return url
    ? { url, port: 5432, password: '', ssl }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USERNAME,
        password: String(process.env.DB_PASSWORD),
        database: process.env.DB_DATABASE,
        ssl,
      };
}

const connection = postgresConnection();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...(connection.url
    ? { url: connection.url }
    : {
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        database: connection.database,
      }),
  ssl: connection.ssl ? { rejectUnauthorized: false } : false,
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`, `${__dirname}/../**/*.orm-entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: !isProduction,
  migrationsRun: isProduction,
};
