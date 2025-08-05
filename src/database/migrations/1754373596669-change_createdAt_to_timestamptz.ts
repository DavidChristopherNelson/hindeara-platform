import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeCreatedAtToTimestamptz1754373596669 implements MigrationInterface {
    name = 'ChangeCreatedAtToTimestamptz1754373596669'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "apps" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "apps" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "app-events" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "app-events" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user-events" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user-events" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "mini-lessons" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "mini-lessons" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "phoneme" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "phoneme" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "phoneme" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "phoneme" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "mini-lessons" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "mini-lessons" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user-events" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user-events" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "app-events" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "app-events" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "apps" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "apps" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
