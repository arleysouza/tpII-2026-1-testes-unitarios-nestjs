import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

// Extrai apenas as mensagens para deixar as asserções mais legíveis.
function getMessages(errors: ValidationError[]) {
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('Cars DTOs', () => {
  it('normaliza a placa para maiúsculas na criação', async () => {
    // A transformação deve acontecer antes da validação do padrão Mercosul.
    const dto = plainToInstance(CreateCarDto, {
      idUser: 1,
      plate: 'abc1d23',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.plate).toBe('ABC1D23');
  });

  it('valida idUser inválido e placa fora do padrão Mercosul', async () => {
    const dto = plainToInstance(CreateCarDto, {
      idUser: 0,
      plate: 'AAA1234',
    });

    const errors = await validate(dto);
    const messages = getMessages(errors);

    expect(messages).toContain('O id do usuário deve ser maior que zero.');
    expect(messages).toContain(
      'A placa deve estar no padrão Mercosul: AAA1A11.',
    );
  });

  it('aceita atualização parcial e mantém a transformação da placa', async () => {
    // Em update, a placa continua opcional, mas deve manter a mesma transformação.
    const dto = plainToInstance(UpdateCarDto, {
      plate: 'bbb2b22',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.plate).toBe('BBB2B22');
  });
});
