import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    // O controller é testado isoladamente; o service real não participa aqui.
    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new UsersController(usersService as unknown as UsersService);
  });

  it('delega a criação ao service', async () => {
    const dto = { name: 'Maria', email: 'maria@example.com' };
    const response = { idUser: 1, ...dto };
    usersService.create.mockResolvedValue(response);

    await expect(controller.create(dto)).resolves.toEqual(response);
    expect(usersService.create).toHaveBeenCalledWith(dto);
  });

  it('delega a listagem ao service', async () => {
    const response = [{ idUser: 1, name: 'Maria', email: null }];
    usersService.findAll.mockResolvedValue(response);

    await expect(controller.findAll()).resolves.toEqual(response);
    expect(usersService.findAll).toHaveBeenCalled();
  });

  it('delega a busca por id ao service', async () => {
    const response = { idUser: 1, name: 'Maria', email: null };
    usersService.findOne.mockResolvedValue(response);

    await expect(controller.findOne(1)).resolves.toEqual(response);
    expect(usersService.findOne).toHaveBeenCalledWith(1);
  });

  it('delega a atualização ao service', async () => {
    const dto = { email: 'novo@example.com' };
    const response = { idUser: 1, name: 'Maria', email: 'novo@example.com' };
    usersService.update.mockResolvedValue(response);

    await expect(controller.update(1, dto)).resolves.toEqual(response);
    expect(usersService.update).toHaveBeenCalledWith(1, dto);
  });

  it('delega a remoção ao service', async () => {
    const response = { message: 'Usuário removido com sucesso.' };
    usersService.remove.mockResolvedValue(response);

    await expect(controller.remove(1)).resolves.toEqual(response);
    expect(usersService.remove).toHaveBeenCalledWith(1);
  });
});
