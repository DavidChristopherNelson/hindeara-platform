import { MigrationInterface, QueryRunner } from "typeorm";

export class DropUniqueUserPhoneme1759326138916 implements MigrationInterface {
    name = 'DropUniqueUserPhoneme1759326138916'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_phoneme_score" DROP CONSTRAINT "uq_user_phoneme"`);
        await queryRunner.query(`ALTER TABLE "user_phoneme_score" ALTER COLUMN "value" SET DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_phoneme_score" ALTER COLUMN "value" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user_phoneme_score" ADD CONSTRAINT "uq_user_phoneme" UNIQUE ("userId", "phonemeId")`);
    }

}
