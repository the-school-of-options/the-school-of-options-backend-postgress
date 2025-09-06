import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("webinars")
export class Webinar {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 320 })
  email!: string;

  @Column({ type: "varchar", length: 160, nullable: true })
  name!: string | null;

  @Column({ type: "varchar", length: 2083, nullable: true })
  webinarLink!: string | null;

  // @Column({ type: "varchar", length: 50, nullable: true })
  // phoneNumber!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  source!: string | null;

  @Column({
    type: "enum",
    enum: ["english", "hindi"],
    nullable: true,
  })
  preferedLanguage!: "english" | "hindi" | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
