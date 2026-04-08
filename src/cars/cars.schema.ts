import { pgTable, serial, integer, char } from 'drizzle-orm/pg-core';
import { users } from '../users/users.schema';

export const cars = pgTable('cars', {
  idCar: serial('id_car').primaryKey(),
  idUser: integer('id_user')
    .notNull()
    .references(() => users.idUser),
  plate: char('plate', { length: 7 }).notNull(),
});
