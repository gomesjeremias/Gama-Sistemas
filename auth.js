// auth.js - Simulação de Autenticação

import * as db from './db.js';

const SESSION_KEY = 'sales_app_session';

export function login(username, password) {
    db.init(); // Garante que os usuários existam
    const users = db.getAll('users');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Simula a criação de um token/sessão
        localStorage.setItem(SESSION_KEY, JSON.stringify({ loggedIn: true, username: user.username, timestamp: new Date().getTime() }));
        return true;
    }
    return false;
}

export function logout() {
    localStorage.removeItem(SESSION_KEY);
}

export function checkAuth() {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) {
        return false;
    }
    // Opcional: poderia adicionar uma verificação de tempo de expiração da sessão aqui
    return JSON.parse(session).loggedIn;
}

export function signup(username, password) {
    // Esta função seria para a tela de cadastro
    // Por simplicidade, vamos pular a implementação completa por agora.
    // Em uma aplicação real, aqui você adicionaria um novo usuário ao 'db.users'.
    console.log(`Tentativa de cadastro para: ${username}`);
    return false; // Desabilitado por padrão
}

