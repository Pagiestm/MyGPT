import { MigrationInterface, QueryRunner } from 'typeorm';

export class PasswordRecovery1791400000000 implements MigrationInterface {
  name = 'PasswordRecovery1791400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "resetTokenHash" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "resetTokenExpiresAt" TIMESTAMP`);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_resetTokenHash" ON "users" ("resetTokenHash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_resetTokenHash"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetTokenExpiresAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetTokenHash"`);
  }
}
