import { MigrationInterface, QueryRunner } from "typeorm";

export class MakePhoneNumbersUnique1754560097921 implements MigrationInterface {
    name = 'MakePhoneNumbersUnique1754560097921'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293" UNIQUE ("phoneNumber")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293"`);
    }

}
