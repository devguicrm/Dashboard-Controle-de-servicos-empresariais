const defaultServices = [
  {
    id: crypto.randomUUID(),
    clientName: 'Marcos Almeida',
    clientPhone: '(41) 99999-0101',
    serviceType: 'Portões',
    serviceStatus: 'Pendente',
    serviceDate: '2026-05-20',
    servicePrice: 450,
    serviceDescription: 'Manutenção em portão residencial com ajuste de motor.'
  },
  {
    id: crypto.randomUUID(),
    clientName: 'Comercial Atlântico',
    clientPhone: '(41) 98888-2222',
    serviceType: 'Pintura',
    serviceStatus: 'Em andamento',
    serviceDate: '2026-05-22',
    servicePrice: 1200,
    serviceDescription: 'Pintura interna de sala comercial.'
  },
  {
    id: crypto.randomUUID(),
    clientName: 'Residencial Ilha Verde',
    clientPhone: '(41) 97777-3333',
    serviceType: 'Manutenção',
    serviceStatus: 'Concluído',
    serviceDate: '2026-05-12',
    servicePrice: 300,
    serviceDescription: 'Reparo em área de churrasqueira e limpeza final.'
  }
];

const storageKey = 'servicecontrol-services';
const themeKey = 'servicecontrol-theme';

const form = document.getElementById('serviceForm');
const formTitle = document.getElementById('formTitle');
const serviceId = document.getElementById('serviceId');
const clientName = document.getElementById('clientName');
const clientPhone = document.getElementById('clientPhone');
const serviceType = document.getElementById('serviceType');
const serviceStatus = document.getElementById('serviceStatus');
const serviceDate = document.getElementById('serviceDate');
const servicePrice = document.getElementById('servicePrice');
const serviceDescription = document.getElementById('serviceDescription');
const servicesTable = document.getElementById('servicesTable');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const clearFormBtn = document.getElementById('clearFormBtn');
const toast = document.getElementById('toast');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const themeToggle = document.getElementById('themeToggle');

let services = JSON.parse(localStorage.getItem(storageKey)) || defaultServices;

function saveServices() {
  localStorage.setItem(storageKey, JSON.stringify(services));
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDate(date) {
  if (!date) return 'Sem data';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function normalizeStatus(status) {
  return status
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2300);
}

function resetForm() {
  form.reset();
  serviceId.value = '';
  formTitle.textContent = 'Nova ordem de serviço';
}

function getFilteredServices() {
  const search = searchInput.value.toLowerCase().trim();
  const status = statusFilter.value;

  return services.filter((service) => {
    const matchesSearch =
      service.clientName.toLowerCase().includes(search) ||
      service.serviceType.toLowerCase().includes(search) ||
      service.serviceDescription.toLowerCase().includes(search);

    const matchesStatus = status === 'all' || service.serviceStatus === status;

    return matchesSearch && matchesStatus;
  });
}

function renderTable() {
  const filtered = getFilteredServices();
  servicesTable.innerHTML = '';

  emptyState.classList.toggle('show', filtered.length === 0);

  filtered.forEach((service) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong>${service.clientName}</strong>
        <small>${service.clientPhone}</small>
      </td>
      <td>
        <strong>${service.serviceType}</strong>
        <small>${service.serviceDescription}</small>
      </td>
      <td>${formatDate(service.serviceDate)}</td>
      <td>${formatCurrency(service.servicePrice)}</td>
      <td><span class="status ${normalizeStatus(service.serviceStatus)}">${service.serviceStatus}</span></td>
      <td>
        <div class="actions">
          <button class="action-btn edit" title="Editar" onclick="editService('${service.id}')">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="action-btn delete" title="Excluir" onclick="deleteService('${service.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    servicesTable.appendChild(row);
  });
}

function renderStats() {
  const total = services.length;
  const pending = services.filter((s) => s.serviceStatus === 'Pendente').length;
  const progress = services.filter((s) => s.serviceStatus === 'Em andamento').length;
  const done = services.filter((s) => s.serviceStatus === 'Concluído').length;
  const rate = total ? Math.round((done / total) * 100) : 0;

  document.getElementById('totalServices').textContent = total;
  document.getElementById('pendingServices').textContent = pending;
  document.getElementById('progressServices').textContent = progress;
  document.getElementById('doneServices').textContent = done;
  document.getElementById('completionRate').textContent = `${rate}%`;
  document.querySelector('.circle-progress').style.background = `conic-gradient(var(--green) ${rate * 3.6}deg, var(--line) 0deg)`;

  renderTypeSummary();
}

function renderTypeSummary() {
  const typeSummary = document.getElementById('typeSummary');
  const counts = services.reduce((acc, service) => {
    acc[service.serviceType] = (acc[service.serviceType] || 0) + 1;
    return acc;
  }, {});

  typeSummary.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => `
      <div class="mini-item">
        <strong>${type}</strong>
        <span>${count} OS</span>
      </div>
    `)
    .join('');

  if (!typeSummary.innerHTML) {
    typeSummary.innerHTML = '<div class="mini-item"><strong>Nenhum serviço</strong><span>0 OS</span></div>';
  }
}

function renderApp() {
  renderStats();
  renderTable();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = {
    id: serviceId.value || crypto.randomUUID(),
    clientName: clientName.value.trim(),
    clientPhone: clientPhone.value.trim(),
    serviceType: serviceType.value,
    serviceStatus: serviceStatus.value,
    serviceDate: serviceDate.value,
    servicePrice: Number(servicePrice.value || 0),
    serviceDescription: serviceDescription.value.trim()
  };

  const existingIndex = services.findIndex((service) => service.id === data.id);

  if (existingIndex >= 0) {
    services[existingIndex] = data;
    showToast('Ordem de serviço atualizada!');
  } else {
    services.unshift(data);
    showToast('Ordem de serviço cadastrada!');
  }

  saveServices();
  resetForm();
  renderApp();
});

window.editService = function editService(id) {
  const service = services.find((item) => item.id === id);
  if (!service) return;

  serviceId.value = service.id;
  clientName.value = service.clientName;
  clientPhone.value = service.clientPhone;
  serviceType.value = service.serviceType;
  serviceStatus.value = service.serviceStatus;
  serviceDate.value = service.serviceDate;
  servicePrice.value = service.servicePrice;
  serviceDescription.value = service.serviceDescription;

  formTitle.textContent = 'Editar ordem de serviço';
  document.getElementById('nova-os').scrollIntoView({ behavior: 'smooth' });
};

window.deleteService = function deleteService(id) {
  const confirmDelete = confirm('Deseja excluir esta ordem de serviço?');
  if (!confirmDelete) return;

  services = services.filter((service) => service.id !== id);
  saveServices();
  renderApp();
  showToast('Ordem de serviço excluída!');
};

searchInput.addEventListener('input', renderTable);
statusFilter.addEventListener('change', renderTable);
clearFormBtn.addEventListener('click', resetForm);

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem(themeKey, isDark ? 'dark' : 'light');
  themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
});

function loadTheme() {
  const theme = localStorage.getItem(themeKey);
  if (theme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
}

loadTheme();
saveServices();
renderApp();
