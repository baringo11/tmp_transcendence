import { Exclude } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserRole } from '../interfaces/user-roles';

@Entity()
@Unique(['username'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ nullable: true })
  intraUsername: string;

  @Column()
  @Exclude()
  readonly password: string;

  @Column({ default: 'uploads/default_profile.png' })
  profileImg: string;

  @Column('integer', { array: true, default: [] })
  friendsIds: number[];

  @Column('integer', { array: true, default: [] })
  blockedIds: number[];

  @Column({ default: false })
  twoFactorAuthentication: boolean;

  @Column({ nullable: true })
  @Exclude()
  twoFactorToken: string;

  @Column({ default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ default: 0 })
  wonGames: number;

  @Column({ default: 0 })
  lostGames: number;

  @Column({ default: 0 })
  scoredGoals: number;

  @Column({ default: 0 })
  receivedGoals: number;
}
