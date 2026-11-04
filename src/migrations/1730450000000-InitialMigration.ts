import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class InitialMigration1730450000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. users table (camelCase columns)
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "bigint",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "name",
            type: "varchar",
            length: "150",
            isNullable: true,
          },
          {
            name: "email",
            type: "varchar",
            length: "150",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "password",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "role",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "status",
            type: "varchar",
            length: "20",
            default: "'Active'",
            isNullable: false,
          },
          {
            name: "createdAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updatedAt",
            type: "datetime",
            isNullable: true,
          },
        ],
      }),
      true
    );

    // 2. merchants table (camelCase columns)
    await queryRunner.createTable(
      new Table({
        name: "merchants",
        columns: [
          {
            name: "id",
            type: "bigint",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "merchantCode",
            type: "varchar",
            length: "50",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "businessName",
            type: "varchar",
            length: "150",
            isNullable: false,
          },
          {
            name: "businessEmail",
            type: "varchar",
            length: "150",
            isNullable: false,
          },
          {
            name: "contactPerson",
            type: "varchar",
            length: "150",
            isNullable: true,
          },
          {
            name: "phoneNumber",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          {
            name: "businessType",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "countryMarket",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "registrationNumber",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "website",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "addressLine1",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "addressLine2",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "city",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "postalCode",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          {
            name: "status",
            type: "varchar",
            length: "20",
            default: "'Active'",
            isNullable: false,
          },
          {
            name: "createdAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updatedAt",
            type: "datetime",
            isNullable: true,
          },
        ],
      }),
      true
    );

    // 3. staff table (camelCase columns)
    await queryRunner.createTable(
      new Table({
        name: "staff",
        columns: [
          {
            name: "staffId",
            type: "bigint",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "userId",
            type: "bigint",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "fullName",
            type: "varchar",
            length: "150",
            isNullable: false,
          },
          {
            name: "merchantId",
            type: "bigint",
            isNullable: false,
          },
          {
            name: "countryCode",
            type: "varchar",
            length: "10",
            default: "'+971'",
            isNullable: false,
          },
          {
            name: "mobileNumber",
            type: "varchar",
            length: "20",
            isUnique: true,
            isNullable: false,
          },
          {
            name: "createdAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updatedAt",
            type: "datetime",
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Foreign keys for staff -> users, merchants
    await queryRunner.createForeignKey(
      "staff",
      new TableForeignKey({
        columnNames: ["userId"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "staff",
      new TableForeignKey({
        columnNames: ["merchantId"],
        referencedTableName: "merchants",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("staff", true);
    await queryRunner.dropTable("merchants", true);
    await queryRunner.dropTable("users", true);
  }
}
