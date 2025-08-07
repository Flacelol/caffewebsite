// Данные меню (в реальном проекте это будет база данных)
let menuData = {
    coffee: [
        { id: 1, name: 'Espresso', description: 'Rich and bold single shot', price: 3.50, available: true },
        { id: 2, name: 'Cappuccino', description: 'Espresso with steamed milk and foam', price: 4.50, available: true },
        { id: 3, name: 'Latte', description: 'Smooth espresso with steamed milk', price: 5.00, available: true },
        { id: 4, name: 'Americano', description: 'Espresso with hot water', price: 4.00, available: true }
    ],
    tea: [
        { id: 5, name: 'Earl Grey', description: 'Classic black tea with bergamot', price: 3.00, available: true },
        { id: 6, name: 'Green Tea', description: 'Fresh and light green tea', price: 3.00, available: true },
        { id: 7, name: 'Chamomile', description: 'Relaxing herbal tea', price: 3.50, available: true }
    ],
    pastries: [
        { id: 8, name: 'Croissant', description: 'Buttery and flaky French pastry', price: 3.50, available: true },
        { id: 9, name: 'Blueberry Muffin', description: 'Fresh baked with real blueberries', price: 4.00, available: true },
        { id: 10, name: 'Chocolate Cake', description: 'Rich and moist chocolate delight', price: 5.50, available: true }
    ],
    cold: [
        { id: 11, name: 'Iced Coffee', description: 'Cold brew with ice', price: 4.50, available: true },
        { id: 12, name: 'Frappuccino', description: 'Blended coffee with ice and cream', price: 5.50, available: true },
        { id: 13, name: 'Fresh Juice', description: 'Orange, apple, or mixed berry', price: 4.00, available: true }
    ]
};

// Загрузка данных из localStorage при инициализации
function loadMenuData() {
    const savedData = localStorage.getItem('cafeMenuData');
    if (savedData) {
        menuData = JSON.parse(savedData);
    }
}

// Сохранение данных в localStorage
function saveMenuData() {
    localStorage.setItem('cafeMenuData', JSON.stringify(menuData));
}

// Генерация уникального ID
function generateId() {
    let maxId = 0;
    Object.values(menuData).forEach(category => {
        category.forEach(item => {
            if (item.id > maxId) maxId = item.id;
        });
    });
    return maxId + 1;
}

// Отображение позиций меню в админ-панели
function renderMenuItems() {
    Object.keys(menuData).forEach(category => {
        const container = document.getElementById(category + 'List');
        container.innerHTML = '';
        
        menuData[category].forEach(item => {
            const itemElement = createMenuItemElement(item, category);
            container.appendChild(itemElement);
        });
    });
}

// Создание элемента позиции меню
function createMenuItemElement(item, category) {
    const div = document.createElement('div');
    div.className = 'menu-item-admin';
    div.innerHTML = `
        <div class="item-details">
            <div class="item-name">${item.name}</div>
            <div class="item-description">${item.description}</div>
            <div class="item-price">$${item.price.toFixed(2)}</div>
        </div>
        <div class="item-actions">
            <label class="availability-toggle">
                <input type="checkbox" ${item.available ? 'checked' : ''} 
                       onchange="toggleAvailability(${item.id}, '${category}')">
                <span class="slider"></span>
            </label>
            <span class="status-text ${item.available ? 'available' : 'unavailable'}">
                ${item.available ? 'В наличии' : 'Нет в наличии'}
            </span>
            <button class="btn btn-danger" onclick="deleteItem(${item.id}, '${category}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return div;
}

// Переключение наличия товара
function toggleAvailability(itemId, category) {
    const item = menuData[category].find(item => item.id === itemId);
    if (item) {
        item.available = !item.available;
        saveMenuData();
        renderMenuItems();
        showNotification(`${item.name} отмечен как ${item.available ? 'в наличии' : 'нет в наличии'}`);
    }
};

// Удаление позиции
function deleteItem(itemId, category) {
    if (confirm('Вы уверены, что хотите удалить эту позицию?')) {
        const itemIndex = menuData[category].findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            const deletedItem = menuData[category][itemIndex];
            menuData[category].splice(itemIndex, 1);
            saveMenuData();
            renderMenuItems();
            showNotification(`${deletedItem.name} удален из меню`);
        }
    }
};

// Добавление новой позиции
function addNewItem(event) {
    event.preventDefault();
    
    const category = document.getElementById('itemCategory').value;
    const name = document.getElementById('itemName').value;
    const description = document.getElementById('itemDescription').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    
    if (!name || !description || !price) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    const newItem = {
        id: generateId(),
        name: name,
        description: description,
        price: price,
        available: true
    };
    
    menuData[category].push(newItem);
    saveMenuData();
    renderMenuItems();
    
    // Очистка формы
    document.getElementById('addItemForm').reset();
    
    showNotification(`${name} добавлен в меню`);
}

// Переключение вкладок категорий
function switchCategory(category) {
    // Скрыть все категории
    document.querySelectorAll('.category-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Убрать активный класс с кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показать выбранную категорию
    document.getElementById(category).classList.add('active');
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
}

// Экспорт меню в JSON
function exportMenu() {
    const dataStr = JSON.stringify(menuData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cafe-menu.json';
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Меню экспортировано');
};

// Обновление основного сайта
function updateMainSite() {
    // Генерация HTML для основного сайта
    let menuHTML = '';
    
    Object.keys(menuData).forEach(category => {
        const categoryName = {
            coffee: 'Кофе',
            tea: 'Чай', 
            pastries: 'Выпечка',
            cold: 'Холодные напитки'
        }[category];
        
        menuHTML += `<div class="menu-category ${category === 'coffee' ? '' : 'hidden'}" id="${category}">\n`;
        
        menuData[category].forEach(item => {
            if (item.available) {
                menuHTML += `    <div class="menu-item">\n`;
                menuHTML += `        <div class="item-info">\n`;
                menuHTML += `            <h4>${item.name}</h4>\n`;
                menuHTML += `            <p>${item.description}</p>\n`;
                menuHTML += `        </div>\n`;
                menuHTML += `        <span class="price">$${item.price.toFixed(2)}</span>\n`;
                menuHTML += `    </div>\n`;
            }
        });
        
        menuHTML += `</div>\n`;
    });
    
    // Сохранение HTML в localStorage для использования на основном сайте
    localStorage.setItem('generatedMenuHTML', menuHTML);
    
    showNotification('Основной сайт обновлен! Обновите страницу сайта для просмотра изменений.');
};

// Показ уведомлений
function showNotification(message) {
    // Создание элемента уведомления
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    // Добавление CSS анимации
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
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
    }
    
    document.body.appendChild(notification);
    
    // Удаление уведомления через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Проверка аутентификации
function checkAuthentication() {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    const authTime = sessionStorage.getItem('authTime');
    const currentTime = new Date().getTime();
    
    // Сессия действительна 24 часа
    if (!isAuthenticated || !authTime || (currentTime - authTime > 24 * 60 * 60 * 1000)) {
        // Перенаправление на страницу входа
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти из админ-панели?')) {
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('authTime');
        sessionStorage.removeItem('adminUsername');
        window.location.href = 'login.html';
    }
};

// Отображение информации о текущем пользователе
function displayUserInfo() {
    const username = sessionStorage.getItem('adminUsername');
    if (username) {
        document.getElementById('currentUser').textContent = username;
    }
}

// Скрытие экрана загрузки
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверка аутентификации
    if (!checkAuthentication()) {
        return; // Если не аутентифицирован, перенаправляем на login
    }
    
    // Отображение информации о пользователе
    displayUserInfo();
    
    // Скрытие экрана загрузки
    hideLoadingScreen();
    
    // Загрузка данных меню
    loadMenuData();
    renderMenuItems();
    
    // Обработчик формы добавления
    document.getElementById('addItemForm').addEventListener('submit', addNewItem);
    
    // Обработчики вкладок категорий
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            switchCategory(category);
        });
    });
    
    console.log('Админ-панель инициализирована для пользователя:', sessionStorage.getItem('adminUsername'));
    
    // Убеждаемся, что все функции доступны глобально
    window.logout = logout;
    window.toggleAvailability = toggleAvailability;
    window.deleteItem = deleteItem;
    window.exportMenu = exportMenu;
    window.updateMainSite = updateMainSite;
});

// Проверка сессии каждые 5 минут
setInterval(() => {
    if (!checkAuthentication()) {
        alert('Ваша сессия истекла. Пожалуйста, войдите снова.');
    }
}, 5 * 60 * 1000);