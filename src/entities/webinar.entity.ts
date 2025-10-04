import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("webinars")
export default class Webinar {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 320 })
  email!: string;

  @Column({ type: "varchar", length: 160, nullable: true })
  fullName!: string | null;

  @Column({ type: "varchar", length: 360, nullable: true })
  webinarName!: string | null;

  @Column({ type: "varchar", length: 15, nullable: true })
  phoneNumber!: string | null;

  // @Column({ type: "varchar", length: 50, nullable: true })
  // phoneNumber!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  source!: string | null;


  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export { Webinar };
