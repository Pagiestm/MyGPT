import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConversationTrash1791410000000 implements MigrationInterface {
  name = 'ConversationTrash1791410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "conversations" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(
      `CREATE INDEX "IDX_conversations_deletedAt" ON "conversations" ("deletedAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_conversations_deletedAt"`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "deletedAt"`);
  }
}
