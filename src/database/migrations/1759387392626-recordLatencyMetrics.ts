import { MigrationInterface, QueryRunner } from "typeorm";

export class RecordLatencyMetrics1759387392626 implements MigrationInterface {
    name = 'RecordLatencyMetrics1759387392626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user-events" ADD "previousRequestReceivedByFrontendAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user-events" ADD "requestSentFromFrontendAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user-events" ADD "requestReceivedByBackendAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user-events" DROP COLUMN "requestReceivedByBackendAt"`);
        await queryRunner.query(`ALTER TABLE "user-events" DROP COLUMN "requestSentFromFrontendAt"`);
        await queryRunner.query(`ALTER TABLE "user-events" DROP COLUMN "previousRequestReceivedByFrontendAt"`);
    }

}
