const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
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

// SQLite database
const dbPath = path.join(__dirname, 'cafe.db');
let db;

// Initialize database connection
function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Ошибка подключения к SQLite:', err.message);
        reject(err);
      } else {
        console.log('✅ Подключение к SQLite успешно установлено');
        createTables()
          .then(() => createDefaultData())
          .then(() => resolve())
          .catch(reject);
      }
    });
  });
}

// Create database tables
function createTables() {
  return new Promise((resolve, reject) => {
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category_id INTEGER NOT NULL,
        available BOOLEAN DEFAULT 1,
        description TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )`
    ];
    
    let completed = 0;
    queries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err) {
          console.error(`Ошибка создания таблицы ${index + 1}:`, err.message);
          reject(err);
        } else {
          completed++;
          if (completed === queries.length) {
            console.log('✅ Таблицы базы данных созданы успешно');
            resolve();
          }
        }
      });
    });
  });
}

// Create default admin user and categories
function createDefaultData() {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if admin exists
      db.get('SELECT id FROM users WHERE username = ?', ['admin'], async (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          const hashedPassword = await bcrypt.hash('cafe2024', 10);
          db.run(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            ['admin', hashedPassword, 'admin'],
            (err) => {
              if (err) {
                console.error('Ошибка создания администратора:', err.message);
              } else {
                console.log('✅ Администратор по умолчанию создан (admin/cafe2024)');
              }
            }
          );
        }
      });
      
      // Create default categories
      const categories = [
        { name: 'Coffee', order: 1 },
        { name: 'Tea', order: 2 },
        { name: 'Pastries', order: 3 },
        { name: 'Cold Drinks', order: 4 }
      ];
      
      categories.forEach(category => {
        db.get('SELECT id FROM categories WHERE name = ?', [category.name], (err, row) => {
          if (err) {
            console.error('Ошибка проверки категории:', err.message);
          } else if (!row) {
            db.run(
              'INSERT INTO categories (name, display_order) VALUES (?, ?)',
              [category.name, category.order],
              (err) => {
                if (err) {
                  console.error('Ошибка создания категории:', err.message);
                }
              }
            );
          }
        });
      });
      
      // Add sample menu items
      setTimeout(() => {
        addSampleMenuItems();
        resolve();
      }, 1000);
      
    } catch (error) {
      console.error('Ошибка создания данных по умолчанию:', error.message);
      reject(error);
    }
  });
}

// Add sample menu items
function addSampleMenuItems() {
  const sampleItems = [
    // Coffee
    { name: 'Эспрессо', price: 2.50, category: 'Coffee', description: 'Классический итальянский эспрессо' },
    { name: 'Американо', price: 3.00, category: 'Coffee', description: 'Эспрессо с горячей водой' },
    { name: 'Капучино', price: 4.00, category: 'Coffee', description: 'Эспрессо с молочной пеной' },
    { name: 'Латте', price: 4.50, category: 'Coffee', description: 'Эспрессо с молоком и легкой пеной' },
    
    // Tea
    { name: 'Черный чай', price: 2.00, category: 'Tea', description: 'Классический черный чай' },
    { name: 'Зеленый чай', price: 2.00, category: 'Tea', description: 'Освежающий зеленый чай' },
    { name: 'Чай с лимоном', price: 2.50, category: 'Tea', description: 'Черный чай с лимоном' },
    
    // Pastries
    { name: 'Круассан', price: 3.50, category: 'Pastries', description: 'Французский масляный круассан' },
    { name: 'Маффин черничный', price: 4.00, category: 'Pastries', description: 'Домашний маффин с черникой' },
    { name: 'Чизкейк', price: 5.50, category: 'Pastries', description: 'Нежный чизкейк с ягодами' },
    
    // Cold Drinks
    { name: 'Айс кофе', price: 4.00, category: 'Cold Drinks', description: 'Холодный кофе со льдом' },
    { name: 'Лимонад', price: 3.00, category: 'Cold Drinks', description: 'Домашний лимонад' },
    { name: 'Смузи ягодный', price: 5.00, category: 'Cold Drinks', description: 'Смузи из свежих ягод' }
  ];
  
  sampleItems.forEach(item => {
    // Get category ID
    db.get('SELECT id FROM categories WHERE name = ?', [item.category], (err, row) => {
      if (err) {
        console.error('Ошибка получения категории:', err.message);
      } else if (row) {
        // Check if item already exists
        db.get('SELECT id FROM menu_items WHERE name = ? AND category_id = ?', [item.name, row.id], (err, existingItem) => {
          if (err) {
            console.error('Ошибка проверки товара:', err.message);
          } else if (!existingItem) {
            db.run(
              'INSERT INTO menu_items (name, price, category_id, description) VALUES (?, ?, ?, ?)',
              [item.name, item.price, row.id, item.description],
              (err) => {
                if (err) {
                  console.error('Ошибка добавления товара:', err.message);
                }
              }
            );
          }
        });
      }
    });
  });
  
  console.log('✅ Примерные данные меню добавлены');
}

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен доступа отсутствует' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key', (err, user) => {
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
    
    db.get(
      'SELECT id, username, password, role FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err) {
          console.error('Ошибка запроса пользователя:', err.message);
          return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
        
        if (!user) {
          return res.status(401).json({ error: 'Неверные учетные данные' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
          return res.status(401).json({ error: 'Неверные учетные данные' });
        }
        
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          process.env.JWT_SECRET || 'default_secret_key',
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
      }
    );
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Get all categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY display_order', (err, categories) => {
    if (err) {
      console.error('Ошибка получения категорий:', err.message);
      return res.status(500).json({ error: 'Ошибка получения категорий' });
    }
    res.json(categories);
  });
});

// Get all menu items
app.get('/api/menu', (req, res) => {
  const query = `
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
  `;
  
  db.all(query, (err, items) => {
    if (err) {
      console.error('Ошибка получения меню:', err.message);
      return res.status(500).json({ error: 'Ошибка получения меню' });
    }
    
    // Group by category
    const menuData = {};
    
    // Initialize categories
    db.all('SELECT * FROM categories ORDER BY display_order', (err, categories) => {
      if (err) {
        console.error('Ошибка получения категорий:', err.message);
        return res.status(500).json({ error: 'Ошибка получения категорий' });
      }
      
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
    });
  });
});

// Add menu item
app.post('/api/menu', authenticateToken, [
  body('name').notEmpty().withMessage('Название обязательно'),
  body('price').isFloat({ min: 0 }).withMessage('Цена должна быть положительным числом'),
  body('category').notEmpty().withMessage('Категория обязательна')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, price, category, description, image } = req.body;
  
  // Get category ID
  db.get('SELECT id FROM categories WHERE name = ?', [category], (err, categoryRow) => {
    if (err) {
      console.error('Ошибка получения категории:', err.message);
      return res.status(500).json({ error: 'Ошибка получения категории' });
    }
    
    if (!categoryRow) {
      return res.status(400).json({ error: 'Категория не найдена' });
    }
    
    const categoryId = categoryRow.id;
    
    db.run(
      'INSERT INTO menu_items (name, price, category_id, description, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, price, categoryId, description || null, image || null],
      function(err) {
        if (err) {
          console.error('Ошибка добавления пункта меню:', err.message);
          return res.status(500).json({ error: 'Ошибка добавления пункта меню' });
        }
        
        res.status(201).json({
          message: 'Пункт меню добавлен успешно',
          id: this.lastID
        });
      }
    );
  });
});

// Update menu item availability
app.patch('/api/menu/:id/availability', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { available } = req.body;
  
  db.run(
    'UPDATE menu_items SET available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [available ? 1 : 0, id],
    function(err) {
      if (err) {
        console.error('Ошибка обновления доступности:', err.message);
        return res.status(500).json({ error: 'Ошибка обновления доступности' });
      }
      
      res.json({ message: 'Доступность обновлена успешно' });
    }
  );
});

// Delete menu item
app.delete('/api/menu/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM menu_items WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Ошибка удаления пункта меню:', err.message);
      return res.status(500).json({ error: 'Ошибка удаления пункта меню' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Пункт меню не найден' });
    }
    
    res.json({ message: 'Пункт меню удален успешно' });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер работает', database: 'SQLite' });
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
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📱 API доступен по адресу: http://localhost:${PORT}/api`);
      console.log(`🔐 Админ панель: ${process.env.CLIENT_URL || 'http://localhost:8000'}/admin.html`);
      console.log(`💾 База данных: SQLite (${dbPath})`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error.message);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Ошибка закрытия базы данных:', err.message);
      } else {
        console.log('✅ Соединение с базой данных закрыто');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});