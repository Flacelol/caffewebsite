// Mobile Navigation Toggle
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');

mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Menu Category Switching
const categoryBtns = document.querySelectorAll('.category-btn');
const menuCategories = document.querySelectorAll('.menu-category');

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        categoryBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Hide all menu categories
        menuCategories.forEach(category => {
            category.classList.add('hidden');
        });
        
        // Show selected category
        const targetCategory = btn.getAttribute('data-category');
        document.getElementById(targetCategory).classList.remove('hidden');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Form submission
const contactForm = document.querySelector('.contact-form form');
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const name = contactForm.querySelector('input[type="text"]').value;
    const email = contactForm.querySelector('input[type="email"]').value;
    const message = contactForm.querySelector('textarea').value;
    
    // Simple validation
    if (!name || !email || !message) {
        alert('Please fill in all fields.');
        return;
    }
    
    // Simulate form submission
    alert('Thank you for your message! We\'ll get back to you soon.');
    contactForm.reset();
});

// Загрузка меню из админ-панели
function loadDynamicMenu() {
    const savedMenuData = localStorage.getItem('cafeMenuData');
    if (savedMenuData) {
        const menuData = JSON.parse(savedMenuData);
        updateMenuDisplay(menuData);
    }
}

// Обновление отображения меню
function updateMenuDisplay(menuData) {
    Object.keys(menuData).forEach(category => {
        const container = document.getElementById(category);
        if (container) {
            // Очищаем контейнер
            container.innerHTML = '';
            
            // Добавляем только доступные позиции
            menuData[category].forEach(item => {
                if (item.available) {
                    const menuItem = document.createElement('div');
                    menuItem.className = 'menu-item';
                    menuItem.innerHTML = `
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <p>${item.description}</p>
                        </div>
                        <span class="price">$${item.price.toFixed(2)}</span>
                    `;
                    container.appendChild(menuItem);
                }
            });
            
            // Если нет доступных позиций, показываем сообщение
            if (container.children.length === 0) {
                const noItemsMsg = document.createElement('div');
                noItemsMsg.className = 'no-items-message';
                noItemsMsg.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">В данной категории пока нет доступных позиций</p>';
                container.appendChild(noItemsMsg);
            }
        }
    });
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe sections for animation
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Gallery item hover effects
document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateY(0) scale(1)';
    });
});

// Menu item hover effects
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateY(-5px)';
        item.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
    });
    
    item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateY(0)';
        item.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
    });
});

// Loading screen (optional)
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Add scroll-to-top functionality
const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

// Show/hide scroll to top button
window.addEventListener('scroll', () => {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (scrollButton) {
        if (window.scrollY > 300) {
            scrollButton.style.display = 'block';
        } else {
            scrollButton.style.display = 'none';
        }
    }
});

// Оптимизация загрузки изображений в галерее
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем динамическое меню из админ-панели
    loadDynamicMenu();
    
    // Добавляем обработчик для обновления меню при изменении localStorage
    window.addEventListener('storage', function(e) {
        if (e.key === 'cafeMenuData') {
            loadDynamicMenu();
        }
    });
    
    const galleryImages = document.querySelectorAll('.gallery-item img[loading="lazy"]');
    
    // Intersection Observer для lazy loading
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    galleryImages.forEach(img => {
        imageObserver.observe(img);
    });
    
    // Предзагрузка изображений при hover
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const img = this.querySelector('img');
            if (img && !img.complete) {
                img.loading = 'eager';
            }
        });
    });
    
    console.log('Cafe website loaded successfully!');
});