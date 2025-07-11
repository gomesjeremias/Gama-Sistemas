// db.js - Camada de abstração para o LocalStorage

// Estrutura de dados inicial para popular o sistema
const initialData = {
    users: [
        { id: 1, username: 'admin', password: 'bibiaobia@06' }
    ],
    clientes: [
        { id: 1, nome: 'João da Silva', email: 'joao.silva@email.com', telefone: '11987654321', status: 'Pago' },
        { id: 2, nome: 'Maria Oliveira', email: 'maria.o@email.com', telefone: '21912345678', status: 'A pagar' },
        { id: 3, nome: 'Carlos Pereira', email: 'carlos.p@email.com', telefone: '31955554444', status: 'Pago' },
    ],
    produtos: [
        { id: 1, nome: 'Notebook Pro', codigo: 'NTK-001', descricao: 'Notebook de alta performance', preco: 7500.00, estoque: 15 },
        { id: 2, nome: 'Mouse Sem Fio', codigo: 'MSE-002', descricao: 'Mouse ergonômico', preco: 150.00, estoque: 100 },
        { id: 3, nome: 'Teclado Mecânico', codigo: 'TCD-003', descricao: 'Teclado para gamers', preco: 450.00, estoque: 50 },
    ],
    fornecedores: [
        { id: 1, nome: 'Tech Distribuidora', cnpj: '11.222.333/0001-44', contato: 'contato@techdist.com', produtos: 'Notebooks, Mouses' },
        { id: 2, nome: 'Periféricos Brasil', cnpj: '55.666.777/0001-88', contato: 'vendas@perifericosbr.com', produtos: 'Teclados, Monitores' },
    ],
    vendas: [
        { id: 1, clienteId: 1, produtoId: 1, quantidade: 1, valorTotal: 7500.00, formaPagamento: 'Cartão de Crédito', status: 'Pago', data: '2024-05-20' },
        { id: 2, clienteId: 2, produtoId: 2, quantidade: 2, valorTotal: 300.00, formaPagamento: 'Boleto', status: 'A pagar', data: '2024-05-21' },
        { id: 3, clienteId: 3, produtoId: 3, quantidade: 1, valorTotal: 450.00, formaPagamento: 'PIX', status: 'Pago', data: '2024-05-22' },
        { id: 4, clienteId: 1, produtoId: 2, quantidade: 1, valorTotal: 150.00, formaPagamento: 'PIX', status: 'Pago', data: '2024-05-23' },
    ]
};

/**
 * Inicializa o banco de dados no LocalStorage se ainda não existir
 */
export function init() {
    if (!localStorage.getItem('sales_app_db')) {
        localStorage.setItem('sales_app_db', JSON.stringify(initialData));
    }
}

/**
 * Pega todos os itens de uma tabela
 * @param {string} tableName - Nome da tabela (ex: 'clientes')
 * @returns {Array}
 */
export function getAll(tableName) {
    const db = JSON.parse(localStorage.getItem('sales_app_db'));
    return db[tableName] || [];
}

/**
 * Pega um item por ID de uma tabela
 * @param {string} tableName 
 * @param {number} id 
 * @returns {object | undefined}
 */
export function getById(tableName, id) {
    const table = getAll(tableName);
    return table.find(item => item.id === id);
}

/**
 * Salva (cria ou atualiza) um item em uma tabela
 * @param {string} tableName
 * @param {object} itemData - Dados do item. Se tiver 'id', atualiza. Senão, cria.
 */
export function save(tableName, itemData) {
    const db = JSON.parse(localStorage.getItem('sales_app_db'));
    const table = db[tableName];

    if (itemData.id) { // Atualizar
        const index = table.findIndex(item => item.id === itemData.id);
        if (index > -1) {
            table[index] = { ...table[index], ...itemData };
        }
    } else { // Criar
        const newId = table.length > 0 ? Math.max(...table.map(item => item.id)) + 1 : 1;
        itemData.id = newId;
        // Adiciona data da venda se não existir
        if (!itemData.data) {
            itemData.data = new Date().toISOString().split('T')[0];
        }
        table.push(itemData);
    }

    localStorage.setItem('sales_app_db', JSON.stringify(db));
}

/**
 * Remove um item de uma tabela pelo ID
 * @param {string} tableName 
 * @param {number} id 
 */
export function remove(tableName, id) {
    const db = JSON.parse(localStorage.getItem('sales_app_db'));
    db[tableName] = db[tableName].filter(item => item.id !== id);
    localStorage.setItem('sales_app_db', JSON.stringify(db));
}

/**
 * Limpa todos os registros de uma tabela. Ação perigosa.
 * @param {string} tableName
 */
export function _dangerouslyClearTable(tableName) {
    const db = JSON.parse(localStorage.getItem('sales_app_db'));
    if (db[tableName]) {
        db[tableName] = [];
        localStorage.setItem('sales_app_db', JSON.stringify(db));
    }
}