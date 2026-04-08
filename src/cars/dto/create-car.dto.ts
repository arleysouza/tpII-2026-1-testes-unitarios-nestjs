import { Transform } from 'class-transformer';
import { IsInt, Matches, Min } from 'class-validator';

export class CreateCarDto {
  @IsInt({ message: 'O id do usuário deve ser um número inteiro.' })
  @Min(1, { message: 'O id do usuário deve ser maior que zero.' })
  idUser!: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/, {
    message: 'A placa deve estar no padrão Mercosul: AAA1A11.',
  })
  plate!: string;
}
