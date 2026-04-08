import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseError } from 'pg';
import { DatabaseService } from '../database/database.service';
import { UsersService } from './users.service';

function createSelectChain<T>(result: T) {
  return {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
    orderBy: jest.fn().mockResolvedValue(result),
    innerJoin: jest.fn().mockReturnThis(),
  };
}

function createInsertChain<T>(result: T, error?: unknown) {
  const returning = error
    ? jest.fn().mockRejectedValue(error)
    : jest.fn().mockResolvedValue(result);
  const values = jest.fn().mockReturnValue({ returning });

  return {
    chain: { values },
    values,
    returning,
  };
}

function createUpdateChain<T>(result: T, error?: unknown) {
  const returning = error
    ? jest.fn().mockRejectedValue(error)
    : jest.fn().mockResolvedValue(result);
  const where = jest.fn().mockReturnValue({ returning });
  const set = jest.fn().mockReturnValue({ where });

  return {
    chain: { set },
    set,
    where,
    returning,
  };
}

function createDeleteChain<T>(result: T, error?: unknown) {
  const returning = error
    ? jest.fn().mockRejectedValue(error)
    : jest.fn().mockResolvedValue(result);
  const where = jest.fn().mockReturnValue({ returning });

  return {
    chain: { where },
    where,
    returning,
  };
}

function createDatabaseError(code: string, message: string) {
  const error = new DatabaseError(message, 0, 'error');
  error.code = code;
  return error;
}

describe('UsersService', () => {
  let service: UsersService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    service = new UsersService({ db } as unknown as DatabaseService);
  });

  it('cria um usuário quando o nome ainda não existe', async () => {
    const dto = { name: 'Maria', email: 'maria@example.com' };
    const createdUser = { idUser: 1, name: 'Maria', email: 'maria@example.com' };

    db.select.mockReturnValueOnce(createSelectChain([]));

    const insertQuery = createInsertChain([createdUser]);
    db.insert.mockReturnValue(insertQuery.chain);

    await expect(service.create(dto)).resolves.toEqual(createdUser);
    expect(insertQuery.values).toHaveBeenCalledWith({
      name: 'Maria',
      email: 'maria@example.com',
    });
  });

  it('traduz violação de unicidade ao criar usuário', async () => {
    const dto = { name: 'Maria', email: 'maria@example.com' };
    const duplicateError = createDatabaseError('23505', 'duplicate key');

    db.select.mockReturnValueOnce(createSelectChain([]));

    const insertQuery = createInsertChain([], duplicateError);
    db.insert.mockReturnValue(insertQuery.chain);

    const creationPromise = service.create(dto);

    await expect(creationPromise).rejects.toThrow(ConflictException);
    await expect(creationPromise).rejects.toThrow(
      'Já existe um usuário com esse nome.',
    );
  });

  it('lança NotFoundException quando o usuário não existe', async () => {
    db.select.mockReturnValueOnce(createSelectChain([]));

    const findPromise = service.findOne(99);

    await expect(findPromise).rejects.toThrow(NotFoundException);
    await expect(findPromise).rejects.toThrow('Usuário 99 não encontrado.');
  });

  it('atualiza usando o e-mail nulo quando recebe string vazia', async () => {
    const existingUser = { idUser: 1, name: 'Maria', email: 'maria@example.com' };
    const updatedUser = { idUser: 1, name: 'Maria', email: null };

    db.select
      .mockReturnValueOnce(createSelectChain([existingUser]))
      .mockReturnValueOnce(createSelectChain([]));

    const updateQuery = createUpdateChain([updatedUser]);
    db.update.mockReturnValue(updateQuery.chain);

    await expect(service.update(1, { email: '' })).resolves.toEqual(updatedUser);
    expect(updateQuery.set).toHaveBeenCalledWith({
      name: 'Maria',
      email: null,
    });
  });

  it('traduz a violação de chave estrangeira ao remover usuário com carros', async () => {
    const foreignKeyError = createDatabaseError('23503', 'foreign key violation');
    const deleteQuery = createDeleteChain([], foreignKeyError);

    db.delete.mockReturnValue(deleteQuery.chain);

    const removePromise = service.remove(1);

    await expect(removePromise).rejects.toThrow(ConflictException);
    await expect(removePromise).rejects.toThrow(
      'Não é possível remover o usuário pois existem carros vinculados a ele.',
    );
  });
});
