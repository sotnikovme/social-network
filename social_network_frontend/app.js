// Базовый URL API
const API_URL = 'http://localhost:8001';

// ==================== ОБЩИЕ ФУНКЦИИ ====================

// Показ уведомлений
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Вставляем в начало main-content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(notification, mainContent.firstChild);
        
        // Удаляем через 5 секунд
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Проверка статуса API
async function checkApiStatus() {
    const apiStatus = document.getElementById('api-status');
    if (!apiStatus) return;
    
    apiStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверка...';
    
    try {
        const response = await fetch(`${API_URL}/`);
        if (response.ok) {
            apiStatus.innerHTML = '<i class="fas fa-check-circle"></i> Активно';
            apiStatus.style.color = '#10b981';
            showNotification('API сервер работает нормально', 'success');
        } else {
            apiStatus.innerHTML = '<i class="fas fa-times-circle"></i> Ошибка';
            apiStatus.style.color = '#ef4444';
            showNotification('API сервер недоступен', 'error');
        }
    } catch (error) {
        apiStatus.innerHTML = '<i class="fas fa-times-circle"></i> Недоступен';
        apiStatus.style.color = '#ef4444';
        showNotification(`Ошибка подключения к API: ${error.message}`, 'error');
    }
}

// Проверка подключения при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Устанавливаем текущую дату в футере
    const currentDate = document.getElementById('current-date');
    if (currentDate) {
        currentDate.textContent = new Date().toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Проверяем статус API если есть элемент
    if (document.getElementById('api-status')) {
        checkApiStatus();
    }
    
    // Инициализация вкладок на странице users.html
    initUserTabs();
    
    // Инициализация вкладок на странице posts.html
    initPostTabs();
    
    // Инициализация вкладок на странице api.html
    initApiTabs();
    
    // Проверяем action из URL
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action) {
        if (window.location.pathname.includes('users.html')) {
            switch(action) {
                case 'create':
                    showTab('create');
                    break;
                case 'search':
                    showTab('search');
                    loadAllUsers();
                    break;
            }
        } else if (window.location.pathname.includes('posts.html')) {
            switch(action) {
                case 'create':
                    showPostTab('create');
                    break;
                case 'list':
                    showPostTab('list');
                    loadPosts();
                    break;
            }
        }
    }
});

// ==================== ПОЛЬЗОВАТЕЛИ ====================

// Инициализация вкладок пользователей
function initUserTabs() {
    const forms = ['createUserForm', 'searchUserForm', 'updateUserForm', 'deleteUserForm'];
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', handleUserFormSubmit);
        }
    });
}

// Обработка отправки форм пользователей
async function handleUserFormSubmit(event) {
    event.preventDefault();
    const formId = event.target.id;
    
    switch(formId) {
        case 'createUserForm':
            await createUser();
            break;
        case 'searchUserForm':
            await searchUsers();
            break;
        case 'updateUserForm':
            await updateUser();
            break;
        case 'deleteUserForm':
            await deleteUser();
            break;
    }
}

// Создание пользователя
async function createUser() {
    const formData = {
        first_name: document.getElementById('first_name').value,
        second_name: document.getElementById('second_name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value
    };
    
    // Простая валидация
    if (formData.password.length < 8) {
        showNotification('Пароль должен быть не менее 8 символов', 'error');
        return;
    }
    
    const resultContainer = document.getElementById('create-result');
    if (resultContainer) {
        resultContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Создание пользователя...</div>';
    }
    
    try {
        const response = await fetch(`${API_URL}/user/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="notification success">
                    <i class="fas fa-check-circle"></i>
                    <div>
                        <strong>Пользователь успешно создан!</strong><br>
                        ID: ${result.id}<br>
                        Имя: ${result.first_name}<br>
                        Фамилия: ${result.second_name}<br>
                        Email: ${result.email}
                    </div>
                </div>
            `;
        }
        
        showNotification('Пользователь успешно создан!', 'success');
        
        // Очищаем форму
        document.getElementById('createUserForm').reset();
        
    } catch (error) {
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="notification error">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Ошибка создания пользователя:</strong><br>
                        ${error.message}
                    </div>
                </div>
            `;
        }
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Поиск пользователей
async function searchUsers() {
    const firstName = document.getElementById('search_first_name').value;
    const secondName = document.getElementById('search_second_name').value;
    
    let url = `${API_URL}/user/get`;
    const params = new URLSearchParams();
    
    if (firstName) params.append('first_name', firstName);
    if (secondName) params.append('second_name', secondName);
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const users = await response.json();
        displayUsers(users);
        
    } catch (error) {
        showNotification(`Ошибка поиска: ${error.message}`, 'error');
    }
}

// Загрузка всех пользователей
async function loadAllUsers() {
    try {
        const response = await fetch(`${API_URL}/user/get`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const users = await response.json();
        displayUsers(users);
        
    } catch (error) {
        showNotification(`Ошибка загрузки: ${error.message}`, 'error');
    }
}

// Отображение пользователей в таблице
function displayUsers(users) {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-users-slash" style="font-size: 2rem; color: #6c757d; margin-bottom: 1rem;"></i>
                    <p>Пользователи не найдены</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.id || 'N/A'}</td>
                <td>${user.first_name}</td>
                <td>${user.second_name}</td>
                <td>${user.email}</td>
                <td>${user.age}</td>
                <td>${user.gender === 'male' ? 'Мужской' : 'Женский'}</td>
                <td>
                    <button class="btn btn-sm" onclick="viewUser(${user.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Обновление пользователя
async function updateUser() {
    const userId = document.getElementById('update_id').value;
    const password = document.getElementById('update_password').value;
    
    if (!userId || !password) {
        showNotification('ID и пароль обязательны', 'error');
        return;
    }
    
    const updateData = {};
    
    const firstName = document.getElementById('update_first_name').value;
    const secondName = document.getElementById('update_second_name').value;
    const email = document.getElementById('update_email').value;
    const age = document.getElementById('update_age').value;
    const gender = document.getElementById('update_gender').value;
    
    if (firstName) updateData.first_name = firstName;
    if (secondName) updateData.second_name = secondName;
    if (email) updateData.email = email;
    if (age) updateData.age = parseInt(age);
    if (gender) updateData.gender = gender;
    
    if (Object.keys(updateData).length === 0) {
        showNotification('Не указаны данные для обновления', 'error');
        return;
    }
    
    const requestData = {
        user_password: password,
        update_data: updateData
    };
    
    const resultContainer = document.getElementById('update-result');
    if (resultContainer) {
        resultContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Обновление пользователя...</div>';
    }
    
    try {
        const response = await fetch(`${API_URL}/user/user_${userId}/update`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="notification success">
                    <i class="fas fa-check-circle"></i>
                    <div>
                        <strong>Пользователь успешно обновлен!</strong><br>
                        ID: ${result.id}<br>
                        Имя: ${result.first_name}<br>
                        Фамилия: ${result.second_name}
                    </div>
                </div>
            `;
        }
        
        showNotification('Пользователь успешно обновлен', 'success');
        document.getElementById('updateUserForm').reset();
        
    } catch (error) {
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="notification error">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Ошибка обновления:</strong><br>
                        ${error.message}
                    </div>
                </div>
            `;
        }
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Удаление пользователя
async function deleteUser() {
    const userId = document.getElementById('delete_id').value;
    const password = document.getElementById('delete_password').value;
    
    if (!userId || !password) {
        showNotification('ID и пароль обязательны', 'error');
        return;
    }
    
    if (!confirm(`Вы уверены, что хотите удалить пользователя с ID ${userId}?`)) {
        return;
    }
    
    const requestData = {
        input_password: password
    };
    
    const resultContainer = document.getElementById('delete-result');
    if (resultContainer) {
        resultContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Удаление пользователя...</div>';
    }
    
    try {
        const response = await fetch(`${API_URL}/user/${userId}/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="notification success">
                    <i class="fas fa-check-circle"></i>
                    <div>
                        <strong>Пользователь успешно удален!</strong><br>
                        ${result.message || 'Операция выполнена успешно'}
                    </div>
                </div>
            `;
        }
        
        showNotification('Пользователь успешно удален', 'success');
        document.getElementById('deleteUserForm').reset();
        
    } catch (error) {
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="notification error">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Ошибка удаления:</strong><br>
                        ${error.message}
                    </div>
                </div>
            `;
        }
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Просмотр пользователя (заглушка)
function viewUser(userId) {
    showNotification(`Просмотр пользователя ${userId} (в разработке)`, 'info');
}

// Редактирование пользователя (заглушка)
function editUser(userId) {
    showNotification(`Редактирование пользователя ${userId} (в разработке)`, 'info');
}

// Переключение вкладок пользователей
function showTab(tabName) {
    // Скрываем все вкладки
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Деактивируем все кнопки
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Показываем нужную вкладку
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Активируем нужную кнопку
    const activeButton = Array.from(tabButtons).find(btn => 
        btn.textContent.includes(tabName.charAt(0).toUpperCase() + tabName.slice(1))
    );
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// ==================== ПОСТЫ ====================

// Инициализация вкладок постов
function initPostTabs() {
    const forms = ['createPostForm', 'searchPostForm', 'updatePostForm'];
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', handlePostFormSubmit);
        }
    });
}

// Обработка отправки форм постов
async function handlePostFormSubmit(event) {
    event.preventDefault();
    const formId = event.target.id;
    
    switch(formId) {
        case 'createPostForm':
            await createPost();
            break;
        case 'searchPostForm':
            await searchPost();
            break;
        case 'updatePostForm':
            await updatePost();
            break;
    }
}

// Создание поста
async function createPost() {
    const formData = {
        author_id: parseInt(document.getElementById('post_author_id').value),
        title: document.getElementById('post_title').value,
        body: document.getElementById('post_body').value
    };
    
    const resultContainer = document.getElementById('create-post-result');
    if (resultContainer) {
        resultContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Создание поста...</div>';
    }
    
    try {
        const response = await fetch(`${API_URL}/post/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="notification success">
                    <i class="fas fa-check-circle"></i>
                    <div>
                        <strong>Пост успешно создан!</strong><br>
                        ID: ${result.id}<br>
                        Заголовок: ${result.title}<br>
                        Автор ID: ${result.author_id}
                    </div>
                </div>
            `;
        }
        
        showNotification('Пост успешно создан!', 'success');
        document.getElementById('createPostForm').reset();
        
    } catch (error) {
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="notification error">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Ошибка создания поста:</strong><br>
                        ${error.message}
                    </div>
                </div>
            `;
        }
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Загрузка постов
async function loadPosts() {
    const postsList = document.getElementById('posts-list');
    if (!postsList) return;
    
    postsList.innerHTML = '<div class="loading"><div class="spinner"></div> Загрузка постов...</div>';
    
    try {
        // Note: В вашем API пока нет эндпоинта для получения всех постов
        // Используем примерные данные
        const examplePosts = [
            {
                id: 1,
                title: "Как я начал изучать программирование",
                body: "Сегодня я начал изучать Python и FastAPI. Это оказалось не так сложно, как я думал! Уже создал свой первый API для социальной сети.",
                author_id: 1,
                author_name: "Иван Петров",
                created_at: "2024-01-20T14:30:00",
                likes: 15
            },
            {
                id: 2,
                title: "Мой первый проект на FastAPI",
                body: "Наконец-то закончил свой первый проект на FastAPI! Это API для блога с возможностью создания постов, комментариев и лайков.",
                author_id: 2,
                author_name: "Мария Иванова",
                created_at: "2024-01-18T10:15:00",
                likes: 32
            }
        ];
        
        displayPosts(examplePosts);
        
    } catch (error) {
        postsList.innerHTML = `
            <div class="notification error">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                    <strong>Ошибка загрузки постов:</strong><br>
                    ${error.message}
                </div>
            </div>
        `;
    }
}

// Отображение постов
function displayPosts(posts) {
    const postsList = document.getElementById('posts-list');
    if (!postsList) return;
    
    if (!posts || posts.length === 0) {
        postsList.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-newspaper" style="font-size: 3rem; color: #6c757d; margin-bottom: 1rem;"></i>
                <p>Посты не найдены</p>
                <button class="btn btn-primary" onclick="showPostTab('create')">
                    <i class="fas fa-edit"></i> Написать первый пост
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    posts.forEach(post => {
        const date = new Date(post.created_at).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <div class="post-card">
                <div class="post-header">
                    <h3>${post.title}</h3>
                    <div class="post-date">
                        <i class="far fa-clock"></i> ${date}
                    </div>
                </div>
                
                <div class="post-author">
                    <i class="fas fa-user"></i> ${post.author_name || `Пользователь #${post.author_id}`}
                </div>
                
                <div class="post-body">
                    ${post.body}
                </div>
                
                <div class="post-footer">
                    <span><i class="far fa-heart"></i> ${post.likes || 0} лайков</span>
                    <span><i class="far fa-comment"></i> 0 комментариев</span>
                    <button class="btn btn-sm" onclick="viewPost(${post.id})">
                        <i class="fas fa-eye"></i> Подробнее
                    </button>
                </div>
            </div>
        `;
    });
    
    postsList.innerHTML = html;
}

// Поиск поста
async function searchPost() {
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    const resultContainer = document.getElementById('search-post-result');
    
    if (!resultContainer) return;
    
    resultContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Поиск поста...</div>';
    
    try {
        let result;
        
        if (searchType === 'id') {
            const postId = document.getElementById('search_post_id').value;
            if (!postId) {
                showNotification('Введите ID поста', 'error');
                return;
            }
            
            const response = await fetch(`${API_URL}/post/get_by_id?post_id=${postId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            result = await response.json();
            result = result ? [result] : [];
            
        } else {
            const title = document.getElementById('search_post_title').value;
            if (!title) {
                showNotification('Введите заголовок для поиска', 'error');
                return;
            }
            
            const response = await fetch(`${API_URL}/post/get_by_title?title=${encodeURIComponent(title)}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            result = await response.json();
            result = result ? [result] : [];
        }
        
        if (result.length === 0) {
            resultContainer.innerHTML = `
                <div class="notification info">
                    <i class="fas fa-info-circle"></i>
                    <div>Посты не найдены</div>
                </div>
            `;
            return;
        }
        
        let resultHtml = '<h3>Найденные посты:</h3>';
        result.forEach(post => {
            resultHtml += `
                <div class="post-card" style="margin-top: 1rem;">
                    <h4>${post.title}</h4>
                    <p><strong>ID:</strong> ${post.id}</p>
                    <p><strong>Автор ID:</strong> ${post.author_id}</p>
                    <p><strong>Текст:</strong> ${post.body.substring(0, 100)}...</p>
                </div>
            `;
        });
        
        resultContainer.innerHTML = resultHtml;
        
    } catch (error) {
        resultContainer.innerHTML = `
            <div class="notification error">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                    <strong>Ошибка поиска:</strong><br>
                    ${error.message}
                </div>
            </div>
        `;
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Обновление поста
async function updatePost() {
    const postId = document.getElementById('update_post_id').value;
    
    if (!postId) {
        showNotification('Введите ID поста', 'error');
        return;
    }
    
    const updateData = {};
    const title = document.getElementById('update_post_title').value;
    const body = document.getElementById('update_post_body').value;
    
    if (title) updateData.title = title;
    if (body) updateData.body = body;
    
    if (Object.keys(updateData).length === 0) {
        showNotification('Не указаны данные для обновления', 'error');
        return;
    }
    
    const resultContainer = document.getElementById('update-post-result');
    if (resultContainer) {
        resultContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Обновление поста...</div>';
    }
    
    try {
        // Note: В вашем API есть только обновление заголовка
        const response = await fetch(`${API_URL}/post/post_${postId}/update_title`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="notification success">
                    <i class="fas fa-check-circle"></i>
                    <div>
                        <strong>Пост успешно обновлен!</strong><br>
                        ID: ${result.id}<br>
                        Новый заголовок: ${result.title}
                    </div>
                </div>
            `;
        }
        
        showNotification('Пост успешно обновлен', 'success');
        document.getElementById('updatePostForm').reset();
        
    } catch (error) {
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="notification error">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <strong>Ошибка обновления:</strong><br>
                        ${error.message}
                    </div>
                </div>
            `;
        }
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
}

// Переключение типа поиска постов
function toggleSearchType() {
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    const idGroup = document.getElementById('search-id-group');
    const titleGroup = document.getElementById('search-title-group');
    
    if (searchType === 'id') {
        idGroup.style.display = 'block';
        titleGroup.style.display = 'none';
    } else {
        idGroup.style.display = 'none';
        titleGroup.style.display = 'block';
    }
}

// Фильтрация постов (клиентская)
function filterPosts() {
    const searchText = document.getElementById('post-search').value.toLowerCase();
    const posts = document.querySelectorAll('.post-card');
    
    posts.forEach(post => {
        const title = post.querySelector('h3').textContent.toLowerCase();
        const body = post.querySelector('.post-body').textContent.toLowerCase();
        
        if (title.includes(searchText) || body.includes(searchText)) {
            post.style.display = 'block';
        } else {
            post.style.display = 'none';
        }
    });
}

// Просмотр поста (заглушка)
function viewPost(postId) {
    showNotification(`Просмотр поста ${postId} (в разработке)`, 'info');
}

// Переключение вкладок постов
function showPostTab(tabName) {
    // Скрываем все вкладки
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Деактивируем все кнопки
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Показываем нужную вкладку
    const activeTab = document.getElementById(`${tabName}-post-tab`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Активируем нужную кнопку
    const activeButton = Array.from(tabButtons).find(btn => 
        btn.textContent.toLowerCase().includes(tabName)
    );
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Загружаем посты если открыли вкладку со списком
    if (tabName === 'list') {
        loadPosts();
    }
}

// ==================== API ДОКУМЕНТАЦИЯ ====================

// Инициализация вкладок API документации
function initApiTabs() {
    // Копирование кода
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const codeId = this.getAttribute('onclick').match(/copyToClipboard\('(.*?)'\)/)[1];
            copyToClipboard(codeId);
        });
    });
}

// Копирование в буфер обмена
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const text = element.textContent;
    
    navigator.clipboard.writeText(text)
        .then(() => {
            showNotification('Код скопирован в буфер обмена', 'success');
        })
        .catch(err => {
            showNotification('Ошибка копирования: ' + err, 'error');
        });
}

// Переключение секций API документации
function showApiSection(sectionName) {
    // Скрываем все секции
    const sections = document.querySelectorAll('.api-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Деактивируем все кнопки
    const buttons = document.querySelectorAll('.api-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Показываем нужную секцию
    const activeSection = document.getElementById(`api-${sectionName}`);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Активируем нужную кнопку
    const activeButton = Array.from(buttons).find(btn => 
        btn.getAttribute('onclick').includes(sectionName)
    );
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Тестирование эндпоинта
function testEndpoint(endpoint) {
    showNotification(`Тестирование эндпоинта ${endpoint} (в разработке)`, 'info');
}

// Открытие Swagger UI
function openSwagger() {
    window.open(`${API_URL}/docs`, '_blank');
}

// Открытие ReDoc
function openRedoc() {
    window.open(`${API_URL}/redoc`, '_blank');
}