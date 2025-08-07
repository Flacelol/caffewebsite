-- Создание базы данных для кафе
CREATE DATABASE IF NOT EXISTS cafe_db;
USE cafe_db;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица категорий
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица пунктов меню
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
);

-- Вставка категорий по умолчанию
INSERT INTO categories (name, display_order) VALUES
('Coffee', 1),
('Tea', 2),
('Pastries', 3),
('Cold Drinks', 4)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order);

-- Вставка примерных пунктов меню
INSERT INTO menu_items (name, price, category_id, available, description) VALUES
-- Кофе
('Эспрессо', 2.50, 1, true, 'Классический итальянский эспрессо'),
('Американо', 3.00, 1, true, 'Эспрессо с горячей водой'),
('Капучино', 4.00, 1, true, 'Эспрессо с молочной пеной'),
('Латте', 4.50, 1, true, 'Эспрессо с молоком и легкой пеной'),
('Мокко', 5.00, 1, true, 'Кофе с шоколадом и взбитыми сливками'),

-- Чай
('Черный чай', 2.00, 2, true, 'Классический черный чай'),
('Зеленый чай', 2.00, 2, true, 'Освежающий зеленый чай'),
('Чай с лимоном', 2.50, 2, true, 'Черный чай с лимоном'),
('Травяной чай', 2.50, 2, true, 'Смесь лечебных трав'),
('Чай масала', 3.00, 2, true, 'Индийский чай со специями'),

-- Выпечка
('Круассан', 3.50, 3, true, 'Французский масляный круассан'),
('Маффин черничный', 4.00, 3, true, 'Домашний маффин с черникой'),
('Чизкейк', 5.50, 3, true, 'Нежный чизкейк с ягодами'),
('Тирамису', 6.00, 3, true, 'Классический итальянский десерт'),
('Эклер', 4.50, 3, true, 'Заварное пирожное с кремом'),

-- Холодные напитки
('Айс кофе', 4.00, 4, true, 'Холодный кофе со льдом'),
('Фраппе', 4.50, 4, true, 'Взбитый холодный кофе'),
('Лимонад', 3.00, 4, true, 'Домашний лимонад'),
('Смузи ягодный', 5.00, 4, true, 'Смузи из свежих ягод'),
('Холодный чай', 2.50, 4, true, 'Освежающий холодный чай')
ON DUPLICATE KEY UPDATE 
  price = VALUES(price),
  available = VALUES(available),
  description = VALUES(description);

-- Создание индексов для оптимизации
CREATE INDEX idx_menu_category ON menu_items(category_id);
CREATE INDEX idx_menu_available ON menu_items(available);
CREATE INDEX idx_categories_order ON categories(display_order);

-- Показать созданные таблицы
SHOW TABLES;

-- Показать структуру таблиц
DESCRIBE users;
DESCRIBE categories;
DESCRIBE menu_items;

-- Показать данные
SELECT 'Категории:' as info;
SELECT * FROM categories ORDER BY display_order;

SELECT 'Меню по категориям:' as info;
SELECT 
  c.name as category,
  mi.name as item_name,
  mi.price,
  mi.available,
  mi.description
FROM menu_items mi
JOIN categories c ON mi.category_id = c.id
ORDER BY c.display_order, mi.name;