import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintToPhonemeLetter1756173368759 implements MigrationInterface {
    name = 'AddUniqueConstraintToPhonemeLetter1756173368759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "phoneme" ADD CONSTRAINT "UQ_13f094feb3d77e5c6ac1b7fe315" UNIQUE ("letter")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "phoneme" DROP CONSTRAINT "UQ_13f094feb3d77e5c6ac1b7fe315"`);
    }

}
