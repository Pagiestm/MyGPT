import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModelCapabilities1791360000000 implements MigrationInterface {
  name = 'ModelCapabilities1791360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ai_models" ADD "parameters" character varying`);
    await queryRunner.query(
      `ALTER TABLE "ai_models" ADD "strengths" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_models" ADD "limitations" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(`ALTER TABLE "ai_models" ADD "contextWindow" integer`);
    await queryRunner.query(
      `ALTER TABLE "ai_models" ADD "lowResource" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_models" ADD "requiredFeatures" text array NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ai_models" DROP COLUMN "requiredFeatures"`);
    await queryRunner.query(`ALTER TABLE "ai_models" DROP COLUMN "lowResource"`);
    await queryRunner.query(`ALTER TABLE "ai_models" DROP COLUMN "contextWindow"`);
    await queryRunner.query(`ALTER TABLE "ai_models" DROP COLUMN "limitations"`);
    await queryRunner.query(`ALTER TABLE "ai_models" DROP COLUMN "strengths"`);
    await queryRunner.query(`ALTER TABLE "ai_models" DROP COLUMN "parameters"`);
  }
}
