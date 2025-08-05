import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBufferColumn1754371250898 implements MigrationInterface {
    name = 'AddBufferColumn1754371250898'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "apps" ("id" SERIAL NOT NULL, "http_path" character varying NOT NULL, "is_active" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c5121fda0f8268f1f7f84134e19" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "app-events" ("id" SERIAL NOT NULL, "recording" character varying NOT NULL, "locale" character varying NOT NULL, "uiData" character varying NOT NULL, "isComplete" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "appId" integer, CONSTRAINT "PK_0ec7accd2ea3cbae49582c62a87" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user-events" ("id" SERIAL NOT NULL, "recording" bytea NOT NULL, "locale" character varying NOT NULL, "transcription" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_b27c080069d341369dc8455935e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "mini-lessons" ("id" SERIAL NOT NULL, "appEventId" integer NOT NULL, "userId" integer NOT NULL, "word" character varying NOT NULL, "locale" character varying NOT NULL, "state" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "phonemeId" integer, CONSTRAINT "PK_a0b5ab8e1337a1fe389615983c1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "phoneme" ("id" SERIAL NOT NULL, "letter" character varying NOT NULL, "example_noun" character varying NOT NULL, "example_image" character varying NOT NULL, "is_active" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_707c2b27c95b5cd74663a96c2e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "app-events" ADD CONSTRAINT "FK_e366f859792b765e064c4ab23e4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "app-events" ADD CONSTRAINT "FK_20e6f9b959a23c9c6a58f69ddef" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user-events" ADD CONSTRAINT "FK_33885b48021c8d63569e5eb780f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mini-lessons" ADD CONSTRAINT "FK_f7eae3c39038d1dec8c08fc2b8f" FOREIGN KEY ("phonemeId") REFERENCES "phoneme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mini-lessons" DROP CONSTRAINT "FK_f7eae3c39038d1dec8c08fc2b8f"`);
        await queryRunner.query(`ALTER TABLE "user-events" DROP CONSTRAINT "FK_33885b48021c8d63569e5eb780f"`);
        await queryRunner.query(`ALTER TABLE "app-events" DROP CONSTRAINT "FK_20e6f9b959a23c9c6a58f69ddef"`);
        await queryRunner.query(`ALTER TABLE "app-events" DROP CONSTRAINT "FK_e366f859792b765e064c4ab23e4"`);
        await queryRunner.query(`DROP TABLE "phoneme"`);
        await queryRunner.query(`DROP TABLE "mini-lessons"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user-events"`);
        await queryRunner.query(`DROP TABLE "app-events"`);
        await queryRunner.query(`DROP TABLE "apps"`);
    }

}
