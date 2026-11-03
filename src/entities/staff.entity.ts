import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Merchant } from "./merchant.entity";

@Entity("staff")
export class Staff extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  staffId: string;

  @Column({ type: "bigint", unique: true })
  userId: string;

  @Column({ type: "varchar", length: 150 })
  fullName: string;

  @Column({ type: "bigint" })
  merchantId: string;

  @Column({ type: "varchar", length: 10, default: "+971" })
  countryCode: string;

  @Column({ type: "varchar", length: 20, unique: true })
  mobileNumber: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", nullable: true })
  updatedAt: Date | null;

  @OneToOne(() => User, (user) => user.staff, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Merchant, (merchant) => merchant.staff, { onDelete: "CASCADE" })
  @JoinColumn({ name: "merchantId" })
  merchant: Merchant;
}
