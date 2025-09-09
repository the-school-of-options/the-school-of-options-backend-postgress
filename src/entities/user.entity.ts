import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  Check,
} from "typeorm";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export enum OtpType {
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset",
  LOGIN = "login",
}

class Otp {
  @Column({ type: "varchar", length: 64, nullable: true })
  code?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  expiresAt?: Date | null;

  @Column({ type: "smallint", default: 0, nullable: true })
  attempts?: number | null;

  @Column({ type: "timestamptz", nullable: true })
  lastSentAt?: Date | null;

  @Column({ type: "boolean", default: false, nullable: true })
  verified?: boolean | null;

  @Column({
    type: "enum",
    enum: OtpType,
    enumName: "otp_type_enum",
    nullable: true,
  })
  type?: OtpType | null;
}

@Check("CHK_user_fullname_len", 'char_length("fullName") <= 100')
@Check("CHK_user_otp_attempts", '"otpAttempts" <= 5 OR "otpAttempts" IS NULL')
@Entity({ name: "users" })
export class User {
  // => equivalent to Mongo's _id
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // sparse unique: in Postgres, UNIQUE allows multiple NULLs
  @Index({ unique: true })
  @Column({ type: "varchar", length: 64, nullable: true, unique: true })
  cognitoId!: string | null;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 320, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 100 })
  fullName!: string;

  @Index()
  @Column({ type: "varchar", length: 128, nullable: true })
  googleId!: string | null;

  @Column({ type: "boolean", default: false })
  isGoogleAcc!: boolean;

  @Column({
    type: "enum",
    enum: UserRole,
    enumName: "user_role_enum",
    default: UserRole.USER,
  })
  role!: UserRole;

  // Embedded subdocument — columns will be prefixed with "otp"
  @Column(() => Otp, { prefix: "otp" })
  otp?: Otp;

  @Column({ type: "boolean", default: false })
  isVerified!: boolean;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "timestamptz", nullable: true })
  lastLogin!: Date | null;

  @Column({ type: "integer", default: 0 })
  loginCount!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalize() {
    if (this.email) this.email = this.email.trim().toLowerCase();
    if (this.fullName) this.fullName = this.fullName.trim();
  }
}
