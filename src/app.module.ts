import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CarsModule } from './cars/cars.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Carrega o arquivo .env na inicialização e disponibiliza as variáveis em toda a aplicação.
    ConfigModule.forRoot({
      isGlobal: true, // Evita importar ConfigModule novamente em cada módulo.
    }),
    // Publica os arquivos da pasta public e preserva as rotas /api para os controllers do Nest.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api*'],
    }),
    DatabaseModule,
    UsersModule,
    CarsModule,
  ],
})
export class AppModule {}
