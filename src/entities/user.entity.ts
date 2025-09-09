import {
  Entity,
  Column,
  BaseEntity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index,
} from "typeorm";
import { randomUUID } from "crypto";

export enum UserRole {
  SUPER_ADMIN = "super-admin",
  STUDENT = "student",
  TEACHER = "teacher",
}

@Entity({ name: "users" })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 40, unique: true })
  id!: string; 

  @Column({ type: "varchar", length: 120 })
  fullName!: string;

  @Index({ unique: true })
  @Column({
    type: "varchar",
    length: 320,
    unique: true,
    update: false,
  })
  email!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @Column({
    type: "enum",
    enum: UserRole,
    nullable: true,
    enumName: "user_role_enum", 
    default: null,
  })
  role!: UserRole | null;

  @BeforeInsert()
  setPublicId() {
    this.id = `US_${randomUUID().replace(/-/g, "")}`;
    if (this.email) this.email = this.email.trim().toLowerCase();
  }
}
