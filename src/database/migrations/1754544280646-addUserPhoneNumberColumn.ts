import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPhoneNumberColumn1754544280646 implements MigrationInterface {
    name = 'AddUserPhoneNumberColumn1754544280646'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "phoneNumber" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneNumber"`);
    }

}
