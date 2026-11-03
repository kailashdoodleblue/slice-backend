import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Staff } from "./staff.entity";
import { Merchant } from "./merchant.entity";

const decimalTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : Number(value)),
};

@Entity("transactions")
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Index({ unique: true })
  @Column({ name: "ref_id", type: "varchar", length: 30 })
  refId: string;

  @Index({ unique: true })
  @Column({ name: "authorization_code", type: "varchar", length: 6 })
  authorizationCode: string;

  @Column({ name: "staff_id", type: "bigint" })
  staffId: string;

  @Column({ name: "merchant_id", type: "bigint" })
  merchantId: string;

  @Column({
    name: "transaction_amount",
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  transactionAmount: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  incentive: number;

  // false = pending / rejected, true = approved
  @Column({ name: "approval_status", type: "boolean", default: false })
  approvalStatus: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  remarks: string | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: Date;

  @ManyToOne(() => Staff, { onDelete: "CASCADE" })
  @JoinColumn({ name: "staff_id", referencedColumnName: "staffId" })
  staff: Staff;

  @ManyToOne(() => Merchant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "merchant_id" })
  merchant: Merchant;
}

