const usersApiUrl = '/api/users';
const carsApiUrl = '/api/cars';

const userForm = document.getElementById('user-form');
const userNameInput = document.getElementById('name');
const userEmailInput = document.getElementById('email');
const userSubmitButton = document.getElementById('user-submit-button');
const userCancelButton = document.getElementById('user-cancel-button');
const usersTableBody = document.getElementById('users-table-body');
const userMessage = document.getElementById('user-message');

const carForm = document.getElementById('car-form');
const carUserIdSelect = document.getElementById('car-user-id');
const plateInput = document.getElementById('plate');
const carSubmitButton = document.getElementById('car-submit-button');
const carCancelButton = document.getElementById('car-cancel-button');
const carsTableBody = document.getElementById('cars-table-body');
const carMessage = document.getElementById('car-message');

let editingUserId = null;
let editingCarId = null;
let usersCache = [];

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.className = isError ? 'message error' : 'message';
}

function createActionButton(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = className;
  button.addEventListener('click', onClick);
  return button;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMessage =
      data.message instanceof Array
        ? data.message.join(', ')
        : data.message || 'Erro ao processar a requisicao.';
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function resetUserForm() {
  editingUserId = null;
  userForm.reset();
  userSubmitButton.textContent = 'Salvar';
}

function resetCarForm() {
  editingCarId = null;
  carForm.reset();
  carSubmitButton.textContent = 'Salvar';
  if (usersCache.length) {
    carUserIdSelect.value = String(usersCache[0].idUser);
  }
}

function renderUserOptions() {
  carUserIdSelect.innerHTML = '';

  if (!usersCache.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Cadastre um usuário primeiro';
    carUserIdSelect.appendChild(option);
    carUserIdSelect.disabled = true;
    plateInput.disabled = true;
    carSubmitButton.disabled = true;
    return;
  }

  usersCache.forEach((user) => {
    const option = document.createElement('option');
    option.value = String(user.idUser);
    option.textContent = `${user.idUser} - ${user.name}`;
    carUserIdSelect.appendChild(option);
  });

  carUserIdSelect.disabled = false;
  plateInput.disabled = false;
  carSubmitButton.disabled = false;

  if (!editingCarId) {
    carUserIdSelect.value = String(usersCache[0].idUser);
  }
}

function renderUsers(users) {
  usersTableBody.innerHTML = '';

  if (!users.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.textContent = 'Nenhum usuario cadastrado.';
    row.appendChild(cell);
    usersTableBody.appendChild(row);
    return;
  }

  users.forEach((user) => {
    const row = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = user.idUser;

    const nameCell = document.createElement('td');
    nameCell.textContent = user.name;

    const emailCell = document.createElement('td');
    emailCell.textContent = user.email || '-';

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'actions';

    actions.appendChild(
      createActionButton('Editar', 'secondary', () => {
        editingUserId = user.idUser;
        userNameInput.value = user.name;
        userEmailInput.value = user.email || '';
        userSubmitButton.textContent = 'Atualizar';
        setMessage(userMessage, `Editando o usuário ${user.idUser}.`);
      }),
    );

    actions.appendChild(
      createActionButton('Excluir', 'danger', async () => {
        const confirmed = window.confirm(
          `Deseja excluir o usuário ${user.name}?`,
        );

        if (!confirmed) {
          return;
        }

        try {
          await request(`${usersApiUrl}/${user.idUser}`, {
            method: 'DELETE',
          });
          if (editingUserId === user.idUser) {
            resetUserForm();
          }
          await refreshData();
          setMessage(userMessage, 'Usuário removido com sucesso.');
        } catch (error) {
          setMessage(userMessage, error.message, true);
        }
      }),
    );

    actionsCell.appendChild(actions);
    row.appendChild(idCell);
    row.appendChild(nameCell);
    row.appendChild(emailCell);
    row.appendChild(actionsCell);
    usersTableBody.appendChild(row);
  });
}

function renderCars(cars) {
  carsTableBody.innerHTML = '';

  if (!cars.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Nenhum carro cadastrado.';
    row.appendChild(cell);
    carsTableBody.appendChild(row);
    return;
  }

  cars.forEach((car) => {
    const row = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = car.idCar;

    const plateCell = document.createElement('td');
    plateCell.textContent = car.plate;

    const userIdCell = document.createElement('td');
    userIdCell.textContent = car.idUser;

    const userNameCell = document.createElement('td');
    userNameCell.textContent = car.userName;

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'actions';

    actions.appendChild(
      createActionButton('Editar', 'secondary', () => {
        editingCarId = car.idCar;
        carUserIdSelect.value = String(car.idUser);
        plateInput.value = car.plate;
        carSubmitButton.textContent = 'Atualizar';
        setMessage(carMessage, `Editando o carro ${car.idCar}.`);
      }),
    );

    actions.appendChild(
      createActionButton('Excluir', 'danger', async () => {
        const confirmed = window.confirm(
          `Deseja excluir o carro de placa ${car.plate}?`,
        );

        if (!confirmed) {
          return;
        }

        try {
          await request(`${carsApiUrl}/${car.idCar}`, {
            method: 'DELETE',
          });
          if (editingCarId === car.idCar) {
            resetCarForm();
          }
          await loadCars();
          setMessage(carMessage, 'Carro removido com sucesso.');
        } catch (error) {
          setMessage(carMessage, error.message, true);
        }
      }),
    );

    actionsCell.appendChild(actions);
    row.appendChild(idCell);
    row.appendChild(plateCell);
    row.appendChild(userIdCell);
    row.appendChild(userNameCell);
    row.appendChild(actionsCell);
    carsTableBody.appendChild(row);
  });
}

async function loadUsers() {
  const users = await request(usersApiUrl);
  usersCache = users;
  renderUsers(users);
  renderUserOptions();
}

async function loadCars() {
  const cars = await request(carsApiUrl);
  renderCars(cars);
}

async function refreshData() {
  await loadUsers();
  await loadCars();
}

userForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    name: userNameInput.value.trim(),
    email: userEmailInput.value.trim() || null,
  };

  try {
    if (editingUserId) {
      await request(`${usersApiUrl}/${editingUserId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setMessage(userMessage, 'Usuário atualizado com sucesso.');
    } else {
      await request(usersApiUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessage(userMessage, 'Usuário cadastrado com sucesso.');
    }

    resetUserForm();
    await refreshData();
  } catch (error) {
    setMessage(userMessage, error.message, true);
  }
});

carForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    idUser: Number(carUserIdSelect.value),
    plate: plateInput.value.trim().toUpperCase(),
  };

  try {
    if (editingCarId) {
      await request(`${carsApiUrl}/${editingCarId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setMessage(carMessage, 'Carro atualizado com sucesso.');
    } else {
      await request(carsApiUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessage(carMessage, 'Carro cadastrado com sucesso.');
    }

    resetCarForm();
    await loadCars();
  } catch (error) {
    setMessage(carMessage, error.message, true);
  }
});

userCancelButton.addEventListener('click', () => {
  resetUserForm();
  setMessage(userMessage, '');
});

carCancelButton.addEventListener('click', () => {
  resetCarForm();
  setMessage(carMessage, '');
});

refreshData().catch((error) => {
  setMessage(userMessage, error.message, true);
  setMessage(carMessage, error.message, true);
});
