import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users, type NewUser } from '../../../database/schemas';
import { DatabaseService } from '../../../services/database/database.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByEmail(email: string) {
    const [user] = await this.databaseService.instance
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async findById(id: string) {
    const [user] = await this.databaseService.instance
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }

  async create(data: NewUser) {
    const [user] = await this.databaseService.instance
      .insert(users)
      .values(data)
      .returning();

    return user;
  }
}
