import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, eq, ne } from "drizzle-orm";
import { DatabaseError } from "pg";
import { DatabaseService } from "../database/database.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { users } from "./users.schema";

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: CreateUserDto) {
    await this.ensureUniqueUserName(createUserDto.name);

    try {
      const [user] = await this.databaseService.db
        .insert(users)
        .values({
          name: createUserDto.name,
          email: createUserDto.email ?? null,
        })
        .returning();

      return user;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  findAll() {
    return this.databaseService.db
      .select()
      .from(users)
      .orderBy(asc(users.idUser));
  }

  async findOne(id: number) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.idUser, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`Usuário ${id} não encontrado.`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findOne(id);
    const nextName = updateUserDto.name ?? existingUser.name;
    const nextEmail =
      updateUserDto.email !== undefined ? updateUserDto.email || null : existingUser.email;

    await this.ensureUniqueUserName(nextName, id);

    try {
      const [user] = await this.databaseService.db
        .update(users)
        .set({
          name: nextName,
          email: nextEmail,
        })
        .where(eq(users.idUser, id))
        .returning();

      return user;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: number) {
    try {
      const deletedUsers = await this.databaseService.db
        .delete(users)
        .where(eq(users.idUser, id))
        .returning({ idUser: users.idUser });

      if (!deletedUsers.length) {
        throw new NotFoundException(`Usuário ${id} não encontrado.`);
      }

      return {
        message: "Usuário removido com sucesso.",
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  private handleDatabaseError(error: unknown): never {
    if (error instanceof DatabaseError && error.code === "23505") {
      throw new ConflictException("Já existe um usuário com esse nome.");
    }

    if (error instanceof DatabaseError && error.code === "23503") {
      throw new ConflictException(
        "Não é possível remover o usuário pois existem carros vinculados a ele.",
      );
    }

    throw error;
  }

  private async ensureUniqueUserName(
    name: string,
    excludeId?: number,
  ) {
    const whereClause =
      excludeId === undefined
        ? eq(users.name, name)
        : and(ne(users.idUser, excludeId), eq(users.name, name));

    const [duplicatedUser] = await this.databaseService.db
      .select({
        idUser: users.idUser,
        name: users.name,
      })
      .from(users)
      .where(whereClause)
      .limit(1);

    if (duplicatedUser) {
      throw new ConflictException("Já existe um usuário com esse nome.");
    }
  }
}
