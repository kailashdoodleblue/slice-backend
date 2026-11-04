import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
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

  @Column({ type: "varchar", length: 30, unique: true })
  refId: string;

  @Column({ type: "varchar", length: 6, unique: true })
  authorizationCode: string;

  @Column({ type: "bigint" })
  staffId: string;

  @Column({ type: "bigint" })
  merchantId: string;

  @Column({
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
  @Column({ type: "boolean", default: false })
  approvalStatus: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  remarks: string | null;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @ManyToOne(() => Staff, { onDelete: "CASCADE" })
  @JoinColumn({ name: "staffId" })
  staff: Staff;

  @ManyToOne(() => Merchant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "merchantId" })
  merchant: Merchant;
}
