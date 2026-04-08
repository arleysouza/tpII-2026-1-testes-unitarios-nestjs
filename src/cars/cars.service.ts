import { Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { users } from '../users/users.schema';
import { cars } from './cars.schema';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@Injectable()
export class CarsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createCarDto: CreateCarDto) {
    await this.ensureUserExists(createCarDto.idUser);

    const [car] = await this.databaseService.db
      .insert(cars)
      .values({
        idUser: createCarDto.idUser,
        plate: createCarDto.plate,
      })
      .returning({ idCar: cars.idCar });

    return this.findOne(car.idCar);
  }

  findAll() {
    return this.databaseService.db
      .select({
        idCar: cars.idCar,
        idUser: cars.idUser,
        plate: cars.plate,
        userName: users.name,
      })
      .from(cars)
      .innerJoin(users, eq(cars.idUser, users.idUser))
      .orderBy(asc(cars.idCar));
  }

  async findOne(id: number) {
    const [car] = await this.databaseService.db
      .select({
        idCar: cars.idCar,
        idUser: cars.idUser,
        plate: cars.plate,
        userName: users.name,
      })
      .from(cars)
      .innerJoin(users, eq(cars.idUser, users.idUser))
      .where(eq(cars.idCar, id))
      .limit(1);

    if (!car) {
      throw new NotFoundException(`Carro ${id} não encontrado.`);
    }

    return car;
  }

  async update(id: number, updateCarDto: UpdateCarDto) {
    const existingCar = await this.findOne(id);
    const nextUserId = updateCarDto.idUser ?? existingCar.idUser;
    const nextPlate = updateCarDto.plate ?? existingCar.plate;

    await this.ensureUserExists(nextUserId);

    await this.databaseService.db
      .update(cars)
      .set({
        idUser: nextUserId,
        plate: nextPlate,
      })
      .where(eq(cars.idCar, id));

    return this.findOne(id);
  }

  async remove(id: number) {
    const deletedCars = await this.databaseService.db
      .delete(cars)
      .where(eq(cars.idCar, id))
      .returning({ idCar: cars.idCar });

    if (!deletedCars.length) {
      throw new NotFoundException(`Carro ${id} não encontrado.`);
    }

    return {
      message: 'Carro removido com sucesso.',
    };
  }

  private async ensureUserExists(idUser: number) {
    const [user] = await this.databaseService.db
      .select({ idUser: users.idUser })
      .from(users)
      .where(eq(users.idUser, idUser))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`Usuário ${idUser} não encontrado.`);
    }
  }
}
