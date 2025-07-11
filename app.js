import * as db from './db.js';
import { checkAuth, login, logout } from './auth.js';

let vendasProdutoChart;

// Funções de Renderização
function renderClients() {
    const clients = db.getAll('clientes');
    const tableBody = document.getElementById('clientes-table');
    tableBody.innerHTML = '';
    clients.forEach(client => {
        const statusBadge = client.status === 'Pago' ? 'badge-success' : 'badge-warning';
        tableBody.innerHTML += `
            <tr>
                <td>${client.nome}</td>
                <td>${client.email}</td>
                <td>${client.telefone}</td>
                <td><span class="badge ${statusBadge} badge-ghost">${client.status}</span></td>
                <td class="space-x-2">
                    <button class="btn btn-xs btn-outline btn-info edit-client-btn" data-id="${client.id}"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-xs btn-outline btn-error delete-client-btn" data-id="${client.id}"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function renderSales() {
    const sales = db.getAll('vendas');
    const clients = db.getAll('clientes');
    const products = db.getAll('produtos');
    const tableBody = document.getElementById('vendas-table');
    tableBody.innerHTML = '';

    // Criar mapas para acesso rápido
    const clientMap = new Map(clients.map(c => [c.id, c.nome]));
    const productMap = new Map(products.map(p => [p.id, p.nome]));

    sales.forEach(sale => {
        const statusBadge = sale.status === 'Pago' ? 'badge-success' : 'badge-warning';
        const clientName = clientMap.get(sale.clienteId) || 'Cliente não encontrado';
        const productName = productMap.get(sale.produtoId) || 'Produto não encontrado';
        const saleDate = new Date(sale.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

        tableBody.innerHTML += `
             <tr>
                <td>${saleDate}</td>
                <td>${clientName}</td>
                <td>${productName}</td>
                <td>${sale.quantidade}</td>
                <td>${sale.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>${sale.formaPagamento}</td>
                <td><span class="badge ${statusBadge} badge-ghost">${sale.status}</span></td>
                <td class="space-x-2">
                    <button class="btn btn-xs btn-outline btn-info edit-sale-btn" data-id="${sale.id}"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn btn-xs btn-outline btn-error delete-sale-btn" data-id="${sale.id}"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function renderDashboard() {
    const vendas = db.getAll('vendas');
    const produtos = db.getAll('produtos');
    const clientes = db.getAll('clientes');

    const totalRecebido = vendas.filter(v => v.status === 'Pago').reduce((sum, v) => sum + v.valorTotal, 0);
    const totalAReceber = vendas.filter(v => v.status === 'A pagar').reduce((sum, v) => sum + v.valorTotal, 0);
    
    document.getElementById('total-recebido').textContent = totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-a-receber').textContent = totalAReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('n-vendas').textContent = vendas.length;
    
    // Tabela de clientes a pagar
    const clientesAPagarTable = document.querySelector('#clientes-a-pagar-table tbody');
    clientesAPagarTable.innerHTML = '';
    clientes.filter(c => c.status === 'A pagar').forEach(c => {
        clientesAPagarTable.innerHTML += `<tr><td>${c.nome}</td><td>${c.telefone}</td></tr>`
    });
    
    // Gráfico de Vendas por Produto
    const vendasPorProduto = vendas.reduce((acc, venda) => {
        const produto = produtos.find(p => p.id === venda.produtoId);
        if(produto) {
            acc[produto.nome] = (acc[produto.nome] || 0) + venda.valorTotal;
        }
        return acc;
    }, {});

    const chartLabels = Object.keys(vendasPorProduto);
    const chartData = Object.values(vendasPorProduto);
    
    const ctx = document.getElementById('vendas-produto-chart').getContext('2d');
    if (vendasProdutoChart) {
        vendasProdutoChart.destroy();
    }
    vendasProdutoChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Total Vendido',
                data: chartData,
                backgroundColor: [
                    '#2563eb', '#f97316', '#16a34a', '#facc15', '#9333ea', '#db2777'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}


// Navegação
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(pageId)?.classList.remove('hidden');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('href') === `#${pageId}`) {
            link.classList.add('active');
        }
    });
}

function handleNavigation() {
    const pageId = window.location.hash.substring(1) || 'dashboard';
    showPage(pageId);

    if (pageId === 'dashboard') renderDashboard();
    if (pageId === 'clientes') renderClients();
    if (pageId === 'vendas') renderSales();
}

// Lógica de Formulários
function setupClientForm() {
    const form = document.getElementById('client-form');
    const modal = document.getElementById('client_modal');
    const modalTitle = document.getElementById('client-modal-title');
    const saveBtn = document.getElementById('save-client-btn');
    const idField = document.getElementById('client-id');
    
    saveBtn.onclick = () => {
        if (form.checkValidity()) {
            const clientData = {
                id: idField.value ? parseInt(idField.value) : undefined,
                nome: document.getElementById('client-name').value,
                email: document.getElementById('client-email').value,
                telefone: document.getElementById('client-phone').value,
                status: document.getElementById('client-status').value,
            };
            db.save('clientes', clientData);
            renderClients();
            modal.close();
            form.reset();
        } else {
            form.reportValidity();
        }
    };
    
    // Resetar formulário ao abrir para "Novo Cliente"
    const novoClienteBtn = document.querySelector('button[onclick="client_modal.showModal()"]');
    novoClienteBtn.addEventListener('click', () => {
        form.reset();
        idField.value = '';
        modalTitle.textContent = 'Novo Cliente';
    });
}

function setupSaleForm() {
    const form = document.getElementById('sale-form');
    const modal = document.getElementById('sale_modal');
    const modalTitle = document.getElementById('sale-modal-title');
    const saveBtn = document.getElementById('save-sale-btn');
    const idField = document.getElementById('sale-id');
    const clientSelect = document.getElementById('sale-client');
    const productSelect = document.getElementById('sale-product');
    const quantityInput = document.getElementById('sale-quantity');
    const totalInput = document.getElementById('sale-total');

    const products = db.getAll('produtos');

    function populateSelects() {
        const clients = db.getAll('clientes');
        clientSelect.innerHTML = '<option disabled selected>Selecione um cliente</option>';
        clients.forEach(c => clientSelect.innerHTML += `<option value="${c.id}">${c.nome}</option>`);

        productSelect.innerHTML = '<option disabled selected>Selecione um produto</option>';
        products.forEach(p => productSelect.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
    }

    function calculateTotal() {
        const productId = productSelect.value;
        const quantity = quantityInput.value;
        if (productId && quantity > 0) {
            const product = products.find(p => p.id == productId);
            if(product) {
                const total = product.preco * quantity;
                totalInput.value = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
        } else {
            totalInput.value = 'R$ 0,00';
        }
    }
    
    productSelect.addEventListener('change', calculateTotal);
    quantityInput.addEventListener('input', calculateTotal);

    saveBtn.onclick = () => {
        if (form.checkValidity()) {
             const productId = parseInt(productSelect.value);
             const product = products.find(p => p.id === productId);
             const totalValue = product.preco * parseInt(quantityInput.value);

            const saleData = {
                id: idField.value ? parseInt(idField.value) : undefined,
                clienteId: parseInt(document.getElementById('sale-client').value),
                produtoId: productId,
                quantidade: parseInt(document.getElementById('sale-quantity').value),
                valorTotal: totalValue,
                formaPagamento: document.getElementById('sale-payment').value,
                status: document.getElementById('sale-status').value,
            };

            const existingSale = idField.value ? db.getById('vendas', parseInt(idField.value)) : null;
            if (existingSale) {
                saleData.data = existingSale.data;
            }

            db.save('vendas', saleData);
            renderSales();
            renderDashboard();
            modal.close();
        } else {
            form.reportValidity();
        }
    };
    
    const novoVendaBtn = document.querySelector('button[onclick="sale_modal.showModal()"]');
    novoVendaBtn.addEventListener('click', () => {
        form.reset();
        idField.value = '';
        modalTitle.textContent = 'Nova Venda';
        totalInput.value = 'R$ 0,00';
        populateSelects();
    });
    
    document.getElementById('close-sale-modal-btn').addEventListener('click', () => form.reset());
}

function generateSalesReportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const sales = db.getAll('vendas');
    const clients = db.getAll('clientes');
    const clientMap = new Map(clients.map(c => [c.id, c.nome]));
    
    let totalRecebido = 0;
    let totalAReceber = 0;

    const tableBody = sales.map(sale => {
        if(sale.status === 'Pago') totalRecebido += sale.valorTotal;
        if(sale.status === 'A pagar') totalAReceber += sale.valorTotal;
        const saleDate = new Date(sale.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

        return [
            clientMap.get(sale.clienteId) || 'N/A',
            saleDate,
            sale.status,
            { content: sale.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), styles: { halign: 'right' } }
        ];
    });

    doc.setFontSize(18);
    doc.text('Relatório de Vendas', 14, 22);

    autoTable(doc, {
        head: [['Cliente', 'Data', 'Status', 'Valor']],
        body: tableBody,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
    });
    
    let finalY = doc.lastAutoTable.finalY || 50;
    doc.setFontSize(12);
    doc.text(`Total Recebido: ${totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, finalY + 10);
    doc.text(`Total a Receber: ${totalAReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, finalY + 17);

    doc.save('relatorio_vendas.pdf');
}

function setupEventListeners() {
    window.addEventListener('hashchange', handleNavigation);
    
    // Event Listeners para botões de Clientes (Editar/Deletar)
    document.getElementById('clientes-table').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = parseInt(btn.dataset.id);
        if (btn.classList.contains('delete-client-btn')) {
            if (confirm('Tem certeza que deseja excluir este cliente?')) {
                db.remove('clientes', id);
                renderClients();
            }
        } else if (btn.classList.contains('edit-client-btn')) {
            const client = db.getById('clientes', id);
            document.getElementById('client-id').value = client.id;
            document.getElementById('client-name').value = client.nome;
            document.getElementById('client-email').value = client.email;
            document.getElementById('client-phone').value = client.telefone;
            document.getElementById('client-status').value = client.status;
            document.getElementById('client-modal-title').textContent = 'Editar Cliente';
            document.getElementById('client_modal').showModal();
        }
    });

    // Event Listeners para botões de Vendas (Editar/Deletar/Limpar/PDF)
    document.getElementById('vendas-table').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = parseInt(btn.dataset.id);
        if (btn.classList.contains('delete-sale-btn')) {
            if (confirm('Tem certeza que deseja excluir esta venda?')) {
                db.remove('vendas', id);
                renderSales();
                renderDashboard();
            }
        } else if (btn.classList.contains('edit-sale-btn')) {
            const sale = db.getById('vendas', id);
            setupSaleForm(); // Popula os selects
            document.getElementById('sale-id').value = sale.id;
            document.getElementById('sale-client').value = sale.clienteId;
            document.getElementById('sale-product').value = sale.produtoId;
            document.getElementById('sale-quantity').value = sale.quantidade;
            document.getElementById('sale-payment').value = sale.formaPagamento;
            document.getElementById('sale-status').value = sale.status;
            document.getElementById('sale-total').value = sale.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            document.getElementById('sale-modal-title').textContent = 'Editar Venda';
            document.getElementById('sale_modal').showModal();
        }
    });

    document.getElementById('clear-sales-btn').addEventListener('click', () => {
        if(confirm('ATENÇÃO: Isso apagará TODAS as vendas permanentemente. Deseja continuar?')) {
            db._dangerouslyClearTable('vendas');
            renderSales();
            renderDashboard();
        }
    });

    document.getElementById('download-sales-pdf').addEventListener('click', generateSalesReportPDF);
}


// Inicialização
function init() {
    if (!checkAuth()) {
        showLoginPage();
    } else {
        showAppPage();
        db.init();
        window.location.hash = '#dashboard';
        handleNavigation();
        setupClientForm();
        setupSaleForm();
        setupEventListeners();
    }
}

function showLoginPage() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('signup-page').classList.add('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

function showSignupPage() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('signup-page').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

function showAppPage() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('signup-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
}

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    if (login(user, pass)) {
        init();
    } else {
        alert('Usuário ou senha inválidos!');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
    init();
});

document.getElementById('show-signup-btn').addEventListener('click', showSignupPage);
document.getElementById('show-login-btn').addEventListener('click', showLoginPage);


init();