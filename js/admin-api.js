// Конфигурация API
const API_BASE_URL = 'http://localhost:3001/api';

// Глобальные переменные
let authToken = null;
let currentUser = null;
let menuData = {};

// Утилиты для работы с токеном
const TokenManager = {
    save(token) {
        localStorage.setItem('authToken', token);
        authToken = token;
    },
    
    get() {
        if (!authToken) {
            authToken = localStorage.getItem('authToken');
        }
        return authToken;
    },
    
    remove() {
        localStorage.removeItem('authToken');
        authToken = null;
    },
    
    isValid() {
        const token = this.get();
        if (!token) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch (e) {
            return false;
        }
    }
};

// API клиент
const ApiClient = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = TokenManager.get();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };
        
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Auth methods
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: { username, password }
        });
        
        TokenManager.save(data.token);
        currentUser = data.user;
        return data;
    },
    
    // Menu methods
    async getMenu() {
        return await this.request('/menu');
    },
    
    async addMenuItem(item) {
        return await this.request('/menu', {
            method: 'POST',
            body: item
        });
    },
    
    async updateItemAvailability(id, available) {
        return await this.request(`/menu/${id}/availability`, {
            method: 'PATCH',
            body: { available }
        });
    },
    
    async deleteMenuItem(id) {
        return await this.request(`/menu/${id}`, {
            method: 'DELETE'
        });
    },
    
    async getCategories() {
        return await this.request('/categories');
    }
};

// Уведомления
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#ff9800'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Проверка авторизации
function checkAuth() {
    if (!TokenManager.isValid()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Загрузка меню с сервера
async function loadMenuData() {
    try {
        menuData = await ApiClient.getMenu();
        renderMenu();
        showNotification('Меню загружено с сервера');
    } catch (error) {
        console.error('Ошибка загрузки меню:', error);
        showNotification('Ошибка загрузки меню: ' + error.message, 'error');
    }
}

// Отображение меню
function renderMenu() {
    const categories = ['Coffee', 'Tea', 'Pastries', 'Cold Drinks'];
    
    categories.forEach(category => {
        const container = document.getElementById(`${category.toLowerCase().replace(' ', '-')}-items`);
        if (!container) return;
        
        container.innerHTML = '';
        
        const items = menuData[category] || [];
        items.forEach(item => {
            const itemElement = createMenuItemElement(item, category);
            container.appendChild(itemElement);
        });
    });
}

// Создание элемента меню
function createMenuItemElement(item, category) {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `
        <div class="item-info">
            <span class="item-name">${item.name}</span>
            <span class="item-price">$${item.price.toFixed(2)}</span>
        </div>
        <div class="item-controls">
            <label class="availability-toggle">
                <input type="checkbox" ${item.available ? 'checked' : ''} 
                       onchange="toggleAvailability(${item.id}, this.checked)">
                <span class="slider"></span>
                <span class="status-text">${item.available ? 'Доступно' : 'Недоступно'}</span>
            </label>
            <button class="delete-btn" onclick="deleteItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
}

// Переключение доступности товара
async function toggleAvailability(itemId, available) {
    try {
        await ApiClient.updateItemAvailability(itemId, available);
        
        // Обновляем локальные данные
        for (const category in menuData) {
            const item = menuData[category].find(item => item.id === itemId);
            if (item) {
                item.available = available;
                break;
            }
        }
        
        showNotification(`Доступность товара ${available ? 'включена' : 'отключена'}`);
        updateMainSite();
    } catch (error) {
        console.error('Ошибка обновления доступности:', error);
        showNotification('Ошибка обновления доступности: ' + error.message, 'error');
        // Возвращаем чекбокс в исходное состояние
        const checkbox = document.querySelector(`input[onchange*="${itemId}"]`);
        if (checkbox) checkbox.checked = !available;
    }
}

// Удаление товара
async function deleteItem(itemId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
        return;
    }
    
    try {
        await ApiClient.deleteMenuItem(itemId);
        
        // Удаляем из локальных данных
        for (const category in menuData) {
            const index = menuData[category].findIndex(item => item.id === itemId);
            if (index !== -1) {
                menuData[category].splice(index, 1);
                break;
            }
        }
        
        renderMenu();
        showNotification('Товар удален успешно');
        updateMainSite();
    } catch (error) {
        console.error('Ошибка удаления товара:', error);
        showNotification('Ошибка удаления товара: ' + error.message, 'error');
    }
}

// Добавление нового товара
async function addNewItem() {
    const activeTab = document.querySelector('.tab-button.active');
    if (!activeTab) {
        showNotification('Выберите категорию', 'error');
        return;
    }
    
    const category = activeTab.textContent.trim();
    const name = document.getElementById('item-name').value.trim();
    const price = parseFloat(document.getElementById('item-price').value);
    
    if (!name || !price || price <= 0) {
        showNotification('Заполните все поля корректно', 'error');
        return;
    }
    
    try {
        const newItem = {
            name,
            price,
            category,
            description: '',
            image: ''
        };
        
        const result = await ApiClient.addMenuItem(newItem);
        
        // Добавляем в локальные данные
        if (!menuData[category]) {
            menuData[category] = [];
        }
        
        menuData[category].push({
            id: result.id,
            name,
            price,
            available: true,
            description: '',
            image: ''
        });
        
        // Очищаем форму
        document.getElementById('item-name').value = '';
        document.getElementById('item-price').value = '';
        
        renderMenu();
        showNotification('Товар добавлен успешно');
        updateMainSite();
    } catch (error) {
        console.error('Ошибка добавления товара:', error);
        showNotification('Ошибка добавления товара: ' + error.message, 'error');
    }
}

// Экспорт меню в JSON
function exportMenu() {
    const dataStr = JSON.stringify(menuData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `cafe-menu-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Меню экспортировано');
}

// Обновление главного сайта
function updateMainSite() {
    try {
        // Генерируем HTML для главного сайта
        let menuHTML = '';
        const categories = ['Coffee', 'Tea', 'Pastries', 'Cold Drinks'];
        
        categories.forEach(category => {
            const items = menuData[category] || [];
            const availableItems = items.filter(item => item.available);
            
            if (availableItems.length > 0) {
                menuHTML += `<div class="menu-category">\n`;
                menuHTML += `  <h3>${category}</h3>\n`;
                menuHTML += `  <div class="menu-items">\n`;
                
                availableItems.forEach(item => {
                    menuHTML += `    <div class="menu-item">\n`;
                    menuHTML += `      <div class="item-info">\n`;
                    menuHTML += `        <h4>${item.name}</h4>\n`;
                    if (item.description) {
                        menuHTML += `        <p>${item.description}</p>\n`;
                    }
                    menuHTML += `      </div>\n`;
                    menuHTML += `      <div class="item-price">$${item.price.toFixed(2)}</div>\n`;
                    menuHTML += `    </div>\n`;
                });
                
                menuHTML += `  </div>\n`;
                menuHTML += `</div>\n`;
            }
        });
        
        // Сохраняем в localStorage для совместимости
        localStorage.setItem('generatedMenuHTML', menuHTML);
        localStorage.setItem('cafeMenuData', JSON.stringify(menuData));
        
        console.log('Главный сайт обновлен');
    } catch (error) {
        console.error('Ошибка обновления главного сайта:', error);
    }
}

// Выход из системы
function logout() {
    TokenManager.remove();
    currentUser = null;
    window.location.href = 'login.html';
}

// Переключение вкладок
function switchTab(category) {
    // Убираем активный класс со всех вкладок
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Добавляем активный класс к выбранной вкладке
    event.target.classList.add('active');
    
    // Скрываем все панели
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Показываем выбранную панель
    const targetPanel = document.getElementById(`${category.toLowerCase().replace(' ', '-')}-panel`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

// Функция для скрытия экрана загрузки
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Проверяем авторизацию
    if (!checkAuth()) {
        return;
    }
    
    try {
        // Скрываем экран загрузки
        hideLoadingScreen();
        
        // Отображаем информацию о пользователе
        const token = TokenManager.get();
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = { username: payload.username, role: payload.role };
            
            const userInfo = document.getElementById('user-info');
            if (userInfo) {
                userInfo.textContent = `Добро пожаловать, ${currentUser.username}!`;
            }
        }
        
        // Загружаем меню с сервера
        await loadMenuData();
        
        // Назначаем глобальные функции
        window.toggleAvailability = toggleAvailability;
        window.deleteItem = deleteItem;
        window.addNewItem = addNewItem;
        window.exportMenu = exportMenu;
        window.updateMainSite = updateMainSite;
        window.logout = logout;
        window.switchTab = switchTab;
        
        console.log('Админ панель инициализирована с API');
        
    } catch (error) {
        hideLoadingScreen(); // Скрываем загрузку даже при ошибке
        console.error('Ошибка инициализации:', error);
        showNotification('Ошибка инициализации: ' + error.message, 'error');
    }
});

// Добавляем стили для анимации уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);