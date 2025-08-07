# Cafe Website Backend API

Backend API для сайта кафе с использованием Node.js, Express и MySQL.

## 🚀 Возможности

- **REST API** для управления меню кафе
- **JWT аутентификация** для администраторов
- **MySQL база данных** для надежного хранения данных
- **CRUD операции** для пунктов меню
- **Управление категориями** и доступностью товаров
- **Синхронизация данных** между всеми устройствами
- **Безопасность** с хешированием паролей

## 📋 Требования

- Node.js (версия 14 или выше)
- MySQL Server (версия 5.7 или выше)
- npm или yarn

## 🛠 Установка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка MySQL

1. Установите MySQL Server
2. Создайте пользователя для базы данных (или используйте root)
3. Запустите MySQL сервер

### 3. Настройка переменных окружения

Отредактируйте файл `.env` и укажите ваши настройки:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ваш_пароль_mysql
DB_NAME=cafe_db
DB_PORT=3306

# JWT Secret (измените на свой секретный ключ)
JWT_SECRET=ваш_супер_секретный_ключ_jwt

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CLIENT_URL=http://localhost:8000
```

### 4. Инициализация базы данных

Вы можете использовать один из способов:

**Способ 1: Автоматическая инициализация**
При первом запуске сервер автоматически создаст базу данных и таблицы.

**Способ 2: Ручная инициализация**
```bash
mysql -u root -p < database.sql
```

## 🚀 Запуск

### Режим разработки (с автоперезагрузкой)
```bash
npm run dev
```

### Продакшн режим
```bash
npm start
```

Сервер будет доступен по адресу: `http://localhost:3001`

## 📡 API Endpoints

### Аутентификация

- `POST /api/auth/login` - Вход в систему
  ```json
  {
    "username": "admin",
    "password": "cafe2024"
  }
  ```

### Меню

- `GET /api/menu` - Получить все пункты меню
- `POST /api/menu` - Добавить новый пункт меню (требует авторизации)
- `PATCH /api/menu/:id/availability` - Изменить доступность товара (требует авторизации)
- `DELETE /api/menu/:id` - Удалить пункт меню (требует авторизации)

### Категории

- `GET /api/categories` - Получить все категории

### Служебные

- `GET /api/health` - Проверка состояния сервера

## 🔐 Аутентификация

Для защищенных endpoints используйте JWT токен в заголовке:

```
Authorization: Bearer ваш_jwt_токен
```

## 👤 Учетные данные по умолчанию

- **Логин:** admin
- **Пароль:** cafe2024

## 🗄 Структура базы данных

### Таблица `users`
- `id` - Уникальный идентификатор
- `username` - Имя пользователя
- `password` - Хешированный пароль
- `role` - Роль (admin/manager)
- `created_at` - Дата создания
- `updated_at` - Дата обновления

### Таблица `categories`
- `id` - Уникальный идентификатор
- `name` - Название категории
- `display_order` - Порядок отображения
- `created_at` - Дата создания

### Таблица `menu_items`
- `id` - Уникальный идентификатор
- `name` - Название товара
- `price` - Цена
- `category_id` - ID категории
- `available` - Доступность
- `description` - Описание
- `image_url` - URL изображения
- `created_at` - Дата создания
- `updated_at` - Дата обновления

## 🔄 Интеграция с Frontend

### Обновление admin.html

Замените подключение скрипта в `admin.html`:

```html
<!-- Старый скрипт -->
<!-- <script src="js/admin.js"></script> -->

<!-- Новый скрипт с API -->
<script src="js/admin-api.js"></script>
```

### Обновление index.html

Замените подключение скрипта в `index.html`:

```html
<!-- Старый скрипт -->
<!-- <script src="js/script.js"></script> -->

<!-- Новый скрипт с API -->
<script src="js/script-api.js"></script>
```

## 🛡 Безопасность

- Пароли хешируются с помощью bcrypt
- JWT токены для аутентификации
- CORS настроен для разрешенных доменов
- Валидация входных данных
- Защита от SQL инъекций

## 🐛 Отладка

### Проверка подключения к базе данных
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

### Проверка работы API
```bash
curl http://localhost:3001/api/health
```

### Логи сервера
Все ошибки и важные события логируются в консоль.

## 📝 Примеры использования

### Добавление нового товара
```javascript
fetch('http://localhost:3001/api/menu', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    name: 'Новый кофе',
    price: 4.50,
    category: 'Coffee',
    description: 'Описание нового кофе'
  })
})
```

### Получение меню
```javascript
fetch('http://localhost:3001/api/menu')
  .then(response => response.json())
  .then(data => console.log(data))
```

## 🚀 Развертывание в продакшн

1. Измените `NODE_ENV=production` в `.env`
2. Используйте надежный JWT секрет
3. Настройте SSL сертификаты
4. Используйте процесс-менеджер (PM2)
5. Настройте обратный прокси (nginx)
6. Регулярно делайте бэкапы базы данных

## 🤝 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи сервера
2. Убедитесь, что MySQL запущен
3. Проверьте настройки в `.env`
4. Убедитесь, что все зависимости установлены

## 📄 Лицензия

MIT License