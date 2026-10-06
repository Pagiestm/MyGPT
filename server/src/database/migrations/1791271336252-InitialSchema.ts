import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791271336252 implements MigrationInterface {
  name = 'InitialSchema1791271336252';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "pseudo" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "customInstructions" text, "preferredModel" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_c18dc5127c28389fb4ca1d8fb3c" UNIQUE ("pseudo"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "folders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "instructions" text, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8578bd31b0e7f6d6c2480dbbca8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "userId" uuid NOT NULL, "sharedFrom" character varying, "isPublic" boolean NOT NULL DEFAULT false, "shareLink" character varying, "shareExpiresAt" TIMESTAMP, "pinned" boolean NOT NULL DEFAULT false, "archived" boolean NOT NULL DEFAULT false, "titleLocked" boolean NOT NULL DEFAULT false, "folderId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f95a86392e28916f7fe1e92750e" UNIQUE ("shareLink"), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversationId" uuid NOT NULL, "content" text NOT NULL, "isFromAi" boolean NOT NULL DEFAULT false, "model" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" integer NOT NULL, "data" bytea NOT NULL, "userId" uuid NOT NULL, "messageId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "knowledge_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" integer NOT NULL, "chunkCount" integer NOT NULL DEFAULT '0', "embeddingModel" character varying NOT NULL, "userId" uuid NOT NULL, "folderId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_402a3c43fb263aa5289670e4e21" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "knowledge_chunks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "documentId" uuid NOT NULL, "position" integer NOT NULL, "content" text NOT NULL, "embedding" vector(768) NOT NULL, CONSTRAINT "PK_81af684d79d321813c41019a5cd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5bc9d5f407ed0e5ce7fa8be697" ON "knowledge_chunks"  ("documentId", "position") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_models" ("id" character varying NOT NULL, "label" character varying NOT NULL, "description" character varying NOT NULL, "vramMb" integer NOT NULL, "position" integer NOT NULL DEFAULT '0', "enabled" boolean NOT NULL DEFAULT true, "revision" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3d254744f0bcf6f35be5826e25e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "folders" ADD CONSTRAINT "FK_5caa05c855e82b975c8c438cf68" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_a9b3b5d51da1c75242055338b59" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_407a55172fab879f7c60677705c" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_35138b11d46d53c48ed932afa47" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_d25de32d1398e398a082f4f5d2a" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_documents" ADD CONSTRAINT "FK_a3adeafc92a4a0cf6da7c5a2a01" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_documents" ADD CONSTRAINT "FK_9cb875ed75d66514fe3c195fee0" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "FK_25808cd05336ffe2df9ce8ac832" FOREIGN KEY ("documentId") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "knowledge_chunks" DROP CONSTRAINT "FK_25808cd05336ffe2df9ce8ac832"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_documents" DROP CONSTRAINT "FK_9cb875ed75d66514fe3c195fee0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_documents" DROP CONSTRAINT "FK_a3adeafc92a4a0cf6da7c5a2a01"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_d25de32d1398e398a082f4f5d2a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_35138b11d46d53c48ed932afa47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_407a55172fab879f7c60677705c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_a9b3b5d51da1c75242055338b59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "folders" DROP CONSTRAINT "FK_5caa05c855e82b975c8c438cf68"`,
    );
    await queryRunner.query(`DROP TABLE "ai_models"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5bc9d5f407ed0e5ce7fa8be697"`);
    await queryRunner.query(`DROP TABLE "knowledge_chunks"`);
    await queryRunner.query(`DROP TABLE "knowledge_documents"`);
    await queryRunner.query(`DROP TABLE "attachments"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TABLE "folders"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
