import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Extrai apenas as mensagens para deixar as asserções mais legíveis.
function getMessages(errors: ValidationError[]) {
  /* flatMap 
      - percorre cada item do array, como o map e
      - achata um nível do resultado, como o flat
     Exemplo:
     const listas = [[1, 2], [3, 4]];
     const resultado = listas.flatMap((item) => item);
     --> resultado = [1, 2, 3, 4]
 */
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('Users DTOs', () => {
  it('aceita e-mail vazio na criação', async () => {
    // O DTO permite string vazia para que o service trate esse valor depois.
    // plainToInstance é uma função que converte um objeto JS comum em uma instância real de uma classe.
    // Aqui plainToInstance pega {name:'Maria', email:''} e transforma em uma instância de CreateUserDto.
    const dto = plainToInstance(CreateUserDto, {
      name: 'Maria',
      email: '',
    });

    // validate é uma função que executa as validações declaradas com decorators no DTO e retorna os erros encontrados.
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('valida nome curto e e-mail inválido na criação', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Al',
      email: 'email-invalido',
    });

    const errors = await validate(dto);
    const messages = getMessages(errors);

    expect(messages).toContain('O nome deve ter pelo menos 3 caracteres.');
    expect(messages).toContain('O e-mail informado deve ter um formato válido.');
  });

  it('aceita atualização parcial com e-mail nulo', async () => {
    // Como o campo é opcional, null não deve disparar erro de formato.
    const dto = plainToInstance(UpdateUserDto, {
      email: null,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
