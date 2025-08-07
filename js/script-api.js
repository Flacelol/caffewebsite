// Конфигурация API - отключаем сервер
const API_BASE_URL = null;

// API клиент для главного сайта - модифицированный
const ApiClient = {
    async getMenu() {
        // Загружаем из localStorage
        const savedMenu = localStorage.getItem('cafeMenuData');
        if (savedMenu) {
            return JSON.parse(savedMenu);
        }
        
        // Возвращаем демо-меню если нет сохраненных данных
        return {
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
    }
};

// Загрузка и отображение меню - упрощенная функция
async function loadAndDisplayMenu() {
    try {
        // Показываем индикатор загрузки
        const menuContainer = document.getElementById('menu-container');
        if (menuContainer) {
            menuContainer.innerHTML = '<div class="loading">Загрузка меню...</div>';
        }
        
        // Загружаем меню из localStorage
        const menuData = await ApiClient.getMenu();
        
        // Отображаем меню
        displayMenu(menuData);
        
        console.log('Меню загружено из localStorage');
    } catch (error) {
        console.error('Ошибка загрузки меню:', error);
        displayErrorMessage();
    }
}

// Загрузка меню из localStorage (fallback)
function loadMenuFromLocalStorage() {
    try {
        const savedMenu = localStorage.getItem('cafeMenuData');
        if (savedMenu) {
            return JSON.parse(savedMenu);
        }
        return null;
    } catch (error) {
        console.error('Ошибка загрузки из localStorage:', error);
        return null;
    }
}

// Отображение меню
function displayMenu(menuData) {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) {
        console.error('Контейнер меню не найден');
        return;
    }
    
    let menuHTML = '';
    const categories = ['Coffee', 'Tea', 'Pastries', 'Cold Drinks'];
    const categoryTitles = {
        'Coffee': 'Кофе',
        'Tea': 'Чай', 
        'Pastries': 'Выпечка',
        'Cold Drinks': 'Холодные напитки'
    };
    
    categories.forEach(category => {
        const items = menuData[category] || [];
        const availableItems = items.filter(item => item.available);
        
        if (availableItems.length > 0) {
            menuHTML += `
                <div class="menu-category" data-category="${category}">
                    <h3 class="category-title">${categoryTitles[category] || category}</h3>
                    <div class="menu-items">
            `;
            
            availableItems.forEach(item => {
                menuHTML += `
                    <div class="menu-item" data-item-id="${item.id}">
                        <div class="item-content">
                            <div class="item-info">
                                <h4 class="item-name">${escapeHtml(item.name)}</h4>
                                ${item.description ? `<p class="item-description">${escapeHtml(item.description)}</p>` : ''}
                            </div>
                            <div class="item-price">$${item.price.toFixed(2)}</div>
                        </div>
                        ${item.image ? `<div class="item-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy"></div>` : ''}
                    </div>
                `;
            });
            
            menuHTML += `
                    </div>
                </div>
            `;
        }
    });
    
    if (menuHTML === '') {
        menuHTML = '<div class="no-menu">Меню временно недоступно</div>';
    }
    
    menuContainer.innerHTML = menuHTML;
    
    // Добавляем анимацию появления
    const menuItems = menuContainer.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// Отображение сообщения об ошибке
function displayErrorMessage() {
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer) {
        menuContainer.innerHTML = `
            <div class="error-message">
                <h3>Извините, меню временно недоступно</h3>
                <p>Пожалуйста, попробуйте обновить страницу или обратитесь к персоналу</p>
                <button onclick="loadAndDisplayMenu()" class="retry-btn">Попробовать снова</button>
            </div>
        `;
    }
}

// Экранирование HTML для безопасности
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Функция для обновления меню (вызывается из админ панели)
function updateMenuDisplay() {
    loadAndDisplayMenu();
}

// Плавная прокрутка к секции меню
function scrollToMenu() {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
        menuSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Функция для фильтрации меню по категориям (если нужно)
function filterMenuByCategory(category) {
    const menuCategories = document.querySelectorAll('.menu-category');
    
    menuCategories.forEach(categoryElement => {
        if (category === 'all' || categoryElement.dataset.category === category) {
            categoryElement.style.display = 'block';
        } else {
            categoryElement.style.display = 'none';
        }
    });
}

// Функция поиска по меню
function searchMenu(searchTerm) {
    const menuItems = document.querySelectorAll('.menu-item');
    const searchLower = searchTerm.toLowerCase();
    
    menuItems.forEach(item => {
        const itemName = item.querySelector('.item-name').textContent.toLowerCase();
        const itemDescription = item.querySelector('.item-description');
        const descriptionText = itemDescription ? itemDescription.textContent.toLowerCase() : '';
        
        if (itemName.includes(searchLower) || descriptionText.includes(searchLower)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем меню
    loadAndDisplayMenu();
    
    // Назначаем глобальные функции
    window.updateMenuDisplay = updateMenuDisplay;
    window.scrollToMenu = scrollToMenu;
    window.filterMenuByCategory = filterMenuByCategory;
    window.searchMenu = searchMenu;
    
    // Обновляем меню каждые 30 секунд для синхронизации
    setInterval(() => {
        loadAndDisplayMenu();
    }, 30000);
    
    console.log('Главный сайт инициализирован с API');
});

// Добавляем стили для загрузки и ошибок
const style = document.createElement('style');
style.textContent = `
    .loading {
        text-align: center;
        padding: 40px;
        font-size: 18px;
        color: #8B4513;
    }
    
    .error-message {
        text-align: center;
        padding: 40px;
        background: #f8f8f8;
        border-radius: 10px;
        margin: 20px 0;
    }
    
    .error-message h3 {
        color: #d32f2f;
        margin-bottom: 10px;
    }
    
    .error-message p {
        color: #666;
        margin-bottom: 20px;
    }
    
    .retry-btn {
        background: #8B4513;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
    }
    
    .retry-btn:hover {
        background: #A0522D;
    }
    
    .no-menu {
        text-align: center;
        padding: 40px;
        font-size: 18px;
        color: #666;
    }
    
    .menu-item {
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .item-description {
        font-size: 14px;
        color: #666;
        margin-top: 5px;
    }
    
    .item-image img {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 5px;
        margin-top: 10px;
    }
`;
document.head.appendChild(style);
