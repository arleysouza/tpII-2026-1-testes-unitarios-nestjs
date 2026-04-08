import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  idUser: serial('id_user').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 100 }),
});
