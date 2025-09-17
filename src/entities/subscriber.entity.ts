import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("subscribers")
export class Subscribers {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 320 })
  email!: string;

  @Column({ type: "varchar", length: 160, nullable: true })
  name!: string | null;

  @Column({ type: "boolean", default: true })
  subscribed!: boolean;

  @Column("simple-array", { default: "" })
  subscribedLists!: number[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
