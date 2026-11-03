import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Staff } from "./staff.entity";
import { MerchantStatus } from "../constants";

@Entity("merchants")
export class Merchant extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  merchantCode: string;

  @Column({ type: "varchar", length: 150 })
  businessName: string;

  @Column({ type: "varchar", length: 150 })
  businessEmail: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  contactPerson: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  businessType: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  countryMarket: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  registrationNumber: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  website: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  addressLine1: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  addressLine2: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  city: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  postalCode: string | null;

  @Column({ type: "varchar", length: 20, default: MerchantStatus.ACTIVE })
  status: string;

  // Incentive percentage (e.g. 5.50 = 5.5%) applied to submitted transactions
  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | null) =>
        value === null || value === undefined ? value : Number(value),
    },
  })
  incentivePercentage: number;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", nullable: true })
  updatedAt: Date | null;

  @OneToMany(() => Staff, (staff) => staff.merchant)
  staff: Staff[];
}
