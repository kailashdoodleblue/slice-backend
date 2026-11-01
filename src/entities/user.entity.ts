import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from "typeorm";
import { Staff } from "./staff.entity";
import { UserRole, AccountStatus, UserStatus } from "../constants";

export { UserRole, AccountStatus, UserStatus };

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column({ type: "varchar", length: 150, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255, select: false })
  password: string;

  @Column({ type: "varchar", length: 50 })
  role: string;

  @Column({ type: "varchar", length: 20, default: AccountStatus.ACTIVE })
  status: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", nullable: true })
  updatedAt: Date | null;

  @OneToOne(() => Staff, (staff) => staff.user)
  staff?: Staff;
}
