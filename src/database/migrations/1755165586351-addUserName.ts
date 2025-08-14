import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserName1755165586351 implements MigrationInterface {
    name = 'AddUserName1755165586351'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    }

}
