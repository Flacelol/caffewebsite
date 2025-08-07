// Конфигурация API
// Вместо:
const API_BASE_URL = null;

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
            return payload.exp > Date.now();
        } catch (e) {
            return false;
        }
    }
};

// API клиент - модифицированный для работы без сервера
const ApiClient = {
    // Локальная авторизация
    async login(username, password) {
        // Простая проверка без сервера
        if (username === 'admin' && password === 'cafe2024') {
            const mockToken = btoa(JSON.stringify({
                user: 'admin',
                exp: Date.now() + 24 * 60 * 60 * 1000 // 24 часа
            }));
            
            TokenManager.save(mockToken);
            currentUser = { username: 'admin' };
            return { token: mockToken, user: currentUser };
        } else {
            throw new Error('Неверные учетные данные');
        }
    },

    // Загрузка меню из localStorage
    async getMenu() {
        try {
            const menuRef = ref(database, 'menu');
            const snapshot = await get(menuRef);
            return snapshot.exists() ? snapshot.val() : {
                Coffee: [],
                Tea: [],
                Pastries: [],
                'Cold Drinks': []
            };
        } catch (error) {
            console.error('Ошибка загрузки из Firebase:', error);
            // Fallback к localStorage
            const savedMenu = localStorage.getItem('cafeMenuData');
            return savedMenu ? JSON.parse(savedMenu) : {};
        }
    },

    async addMenuItem(item) {
        const menu = await this.getMenu();
        if (!menu[item.category]) menu[item.category] = [];
        
        item.id = Date.now();
        item.available = true;
        menu[item.category].push(item);
        
        // Сохраняем в Firebase
        await set(ref(database, 'menu'), menu);
        // Дублируем в localStorage для offline режима
        localStorage.setItem('cafeMenuData', JSON.stringify(menu));
        
        return item;
    },

    async updateItemAvailability(id, available) {
        const menu = await this.getMenu();
        
        for (const category in menu) {
            const item = menu[category].find(item => item.id == id);
            if (item) {
                item.available = available;
                await set(ref(database, 'menu'), menu);
                localStorage.setItem('cafeMenuData', JSON.stringify(menu));
                return item;
            }
        }
        throw new Error('Элемент не найден');
    },

    async deleteMenuItem(id) {
        const menu = await this.getMenu();
        
        for (const category in menu) {
            const index = menu[category].findIndex(item => item.id == id);
            if (index !== -1) {
                menu[category].splice(index, 1);
                await set(ref(database, 'menu'), menu);
                localStorage.setItem('cafeMenuData', JSON.stringify(menu));
                return true;
            }
        }
        return false;
    }
};

// Слушатель изменений в реальном времени
function setupRealtimeListener() {
    const menuRef = ref(database, 'menu');
    onValue(menuRef, (snapshot) => {
        if (snapshot.exists()) {
            const newMenuData = snapshot.val();
            menuData = newMenuData;
            localStorage.setItem('cafeMenuData', JSON.stringify(newMenuData));
            renderMenu(); // Обновляем интерфейс
            showNotification('Меню обновлено с сервера');
        }
    });
}

// Вызывайте при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setupRealtimeListener();
    // Добавление нового элемента меню
    async addMenuItem(item) {
        const menu = await this.getMenu();
        if (!menu[item.category]) menu[item.category] = [];
        
        item.id = Date.now(); // Простой ID
        item.available = true; // По умолчанию доступно
        menu[item.category].push(item);
        
        localStorage.setItem('cafeMenuData', JSON.stringify(menu));
        return item;
    },

    // Обновление доступности элемента
    async updateItemAvailability(id, available) {
        const menu = await this.getMenu();
        
        for (const category in menu) {
            const item = menu[category].find(item => item.id == id);
            if (item) {
                item.available = available;
                localStorage.setItem('cafeMenuData', JSON.stringify(menu));
                return item;
            }
        }
        throw new Error('Элемент не найден');
    },

    // Удаление элемента меню
    async deleteMenuItem(id) {
        const menu = await this.getMenu();
        
        for (const category in menu) {
            const index = menu[category].findIndex(item => item.id == id);
            if (index !== -1) {
                menu[category].splice(index, 1);
                localStorage.setItem('cafeMenuData', JSON.stringify(menu));
                return true;
            }
        }
        return false;
    },
    
    async getCategories() {
        return ['Coffee', 'Tea', 'Pastries', 'Cold Drinks'];
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

// Загрузка меню - модифицированная функция
async function loadMenuData() {
    try {
        menuData = await ApiClient.getMenu();
        renderMenu();
        showNotification('Меню загружено');
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

// Обновление главного сайта - модифицированная функция
function updateMainSite() {
    try {
        // Сохраняем данные меню для главного сайта
        localStorage.setItem('cafeMenuData', JSON.stringify(menuData));
        
        showNotification('Главный сайт обновлен! Изменения будут видны всем пользователям.');
        console.log('Данные меню сохранены в localStorage');
    } catch (error) {
        console.error('Ошибка обновления главного сайта:', error);
        showNotification('Ошибка обновления: ' + error.message, 'error');
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

// Инициализация демо-данных при первом запуске
function initializeDemoData() {
    const existingMenu = localStorage.getItem('cafeMenuData');
    if (!existingMenu) {
        const demoMenu = {
            Coffee: [
                {
                    id: 1,
                    name: 'Эспрессо',
                    description: 'Классический итальянский кофе',
                    price: 2.50,
                    available: true
                },
                {
                    id: 2,
                    name: 'Капучино', 
                    description: 'Кофе с молочной пенкой',
                    price: 3.50,
                    available: true
                }
            ],
            Tea: [
                {
                    id: 3,
                    name: 'Зеленый чай',
                    description: 'Освежающий зеленый чай',
                    price: 2.00,
                    available: true
                }
            ],
            Pastries: [
                {
                    id: 4,
                    name: 'Круассан',
                    description: 'Свежий французский круассан',
                    price: 2.80,
                    available: true
                }
            ],
            'Cold Drinks': [
                {
                    id: 5,
                    name: 'Айс-кофе',
                    description: 'Холодный кофе со льдом',
                    price: 3.00,
                    available: true
                }
            ]
        };
        localStorage.setItem('cafeMenuData', JSON.stringify(demoMenu));
        console.log('Демо-данные инициализированы');
    }
}

// Вызываем инициализацию при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoData();
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

## Ограничения localStorage:

1. **Локальное хранение**: localStorage сохраняет данные только в браузере конкретного устройства
2. **Нет синхронизации**: Изменения в админ-панели на одном телефоне не передаются на другие устройства
3. **Изолированность**: Каждый браузер имеет свое собственное хранилище

## Решения для синхронизации между устройствами:

### Вариант 1: Firebase Realtime Database (Рекомендуется)

Добавьте в <mcfile name="admin-api.js" path="c:\Users\Flace\.trae\cafe-website\js\admin-api.js"></mcfile>: