const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8000',
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'cafe_db',
  port: process.env.DB_PORT || 3306
};

let db;

// Initialize database connection
async function initDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('✅ Подключение к MySQL успешно установлено');
    
    // Create database if not exists
    await db.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await db.execute(`USE ${dbConfig.database}`);
    
    // Create tables
    await createTables();
    
    // Insert default admin user
    await createDefaultAdmin();
    
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);
    process.exit(1);
  }
}

// Create database tables
async function createTables() {
  try {
    // Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager') DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Menu items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category_id INT NOT NULL,
        available BOOLEAN DEFAULT true,
        description TEXT,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Таблицы базы данных созданы успешно');
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error.message);
  }
}

// Create default admin user and categories
async function createDefaultAdmin() {
  try {
    // Check if admin exists
    const [adminExists] = await db.execute('SELECT id FROM users WHERE username = ?', ['admin']);
    
    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash('cafe2024', 10);
      await db.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('✅ Администратор по умолчанию создан (admin/cafe2024)');
    }

    // Create default categories
    const categories = [
      { name: 'Coffee', order: 1 },
      { name: 'Tea', order: 2 },
      { name: 'Pastries', order: 3 },
      { name: 'Cold Drinks', order: 4 }
    ];

    for (const category of categories) {
      const [exists] = await db.execute('SELECT id FROM categories WHERE name = ?', [category.name]);
      if (exists.length === 0) {
        await db.execute(
          'INSERT INTO categories (name, display_order) VALUES (?, ?)',
          [category.name, category.order]
        );
      }
    }
    console.log('✅ Категории по умолчанию созданы');
    
  } catch (error) {
    console.error('❌ Ошибка создания данных по умолчанию:', error.message);
  }
}

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа отсутствует' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Auth routes
app.post('/api/auth/login', [
  body('username').notEmpty().withMessage('Имя пользователя обязательно'),
  body('password').notEmpty().withMessage('Пароль обязателен')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    
    const [users] = await db.execute(
      'SELECT id, username, password, role FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Авторизация успешна',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await db.execute(
      'SELECT * FROM categories ORDER BY display_order'
    );
    res.json(categories);
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ error: 'Ошибка получения категорий' });
  }
});

// Get all menu items
app.get('/api/menu', async (req, res) => {
  try {
    const [items] = await db.execute(`
      SELECT 
        mi.id,
        mi.name,
        mi.price,
        mi.available,
        mi.description,
        mi.image_url,
        c.name as category_name,
        c.id as category_id
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      ORDER BY c.display_order, mi.name
    `);
    
    // Group by category
    const menuData = {};
    const [categories] = await db.execute('SELECT * FROM categories ORDER BY display_order');
    
    categories.forEach(category => {
      menuData[category.name] = [];
    });
    
    items.forEach(item => {
      if (menuData[item.category_name]) {
        menuData[item.category_name].push({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          available: Boolean(item.available),
          description: item.description,
          image: item.image_url
        });
      }
    });
    
    res.json(menuData);
  } catch (error) {
    console.error('Ошибка получения меню:', error);
    res.status(500).json({ error: 'Ошибка получения меню' });
  }
});

// Add menu item
app.post('/api/menu', authenticateToken, [
  body('name').notEmpty().withMessage('Название обязательно'),
  body('price').isFloat({ min: 0 }).withMessage('Цена должна быть положительным числом'),
  body('category').notEmpty().withMessage('Категория обязательна')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, price, category, description, image } = req.body;
    
    // Get category ID
    const [categories] = await db.execute(
      'SELECT id FROM categories WHERE name = ?',
      [category]
    );
    
    if (categories.length === 0) {
      return res.status(400).json({ error: 'Категория не найдена' });
    }
    
    const categoryId = categories[0].id;
    
    const [result] = await db.execute(
      'INSERT INTO menu_items (name, price, category_id, description, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, price, categoryId, description || null, image || null]
    );
    
    res.status(201).json({
      message: 'Пункт меню добавлен успешно',
      id: result.insertId
    });
  } catch (error) {
    console.error('Ошибка добавления пункта меню:', error);
    res.status(500).json({ error: 'Ошибка добавления пункта меню' });
  }
});

// Update menu item availability
app.patch('/api/menu/:id/availability', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;
    
    await db.execute(
      'UPDATE menu_items SET available = ? WHERE id = ?',
      [available, id]
    );
    
    res.json({ message: 'Доступность обновлена успешно' });
  } catch (error) {
    console.error('Ошибка обновления доступности:', error);
    res.status(500).json({ error: 'Ошибка обновления доступности' });
  }
});

// Delete menu item
app.delete('/api/menu/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute(
      'DELETE FROM menu_items WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Пункт меню не найден' });
    }
    
    res.json({ message: 'Пункт меню удален успешно' });
  } catch (error) {
    console.error('Ошибка удаления пункта меню:', error);
    res.status(500).json({ error: 'Ошибка удаления пункта меню' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер работает' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Start server
async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 API доступен по адресу: http://localhost:${PORT}/api`);
    console.log(`🔐 Админ панель: ${process.env.CLIENT_URL}/admin.html`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Получен сигнал завершения...');
  if (db) {
    await db.end();
    console.log('✅ Соединение с базой данных закрыто');
  }
  process.exit(0);
});