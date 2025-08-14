import { MigrationInterface, QueryRunner } from "typeorm";

export class UserPhonemeScoreTable1755082071476 implements MigrationInterface {
    name = 'UserPhonemeScoreTable1755082071476'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_phoneme_score" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "phonemeId" integer NOT NULL, "value" numeric(6,3) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_user_phoneme" UNIQUE ("userId", "phonemeId"), CONSTRAINT "PK_f187f6d963142ba7ac3a2ed0fc0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2e4cc41251da8df0d5233cde76" ON "user_phoneme_score" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8d948a48ecb5360afa5ca0c598" ON "user_phoneme_score" ("phonemeId") `);
        await queryRunner.query(`ALTER TABLE "user_phoneme_score" ADD CONSTRAINT "FK_2e4cc41251da8df0d5233cde769" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_phoneme_score" ADD CONSTRAINT "FK_8d948a48ecb5360afa5ca0c598f" FOREIGN KEY ("phonemeId") REFERENCES "phoneme"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_phoneme_score" DROP CONSTRAINT "FK_8d948a48ecb5360afa5ca0c598f"`);
        await queryRunner.query(`ALTER TABLE "user_phoneme_score" DROP CONSTRAINT "FK_2e4cc41251da8df0d5233cde769"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8d948a48ecb5360afa5ca0c598"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2e4cc41251da8df0d5233cde76"`);
        await queryRunner.query(`DROP TABLE "user_phoneme_score"`);
    }

}
