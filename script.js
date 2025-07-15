class BlogApp {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.init();
    }

    init() {
        this.setupEventListeners()
            .setupTabs()
            .checkAuthStatus();
    }

    setupEventListeners() {
        // Method chaining for event listeners
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        return this;
    }

    setupTabs() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        return this;
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show/hide forms
        document.querySelectorAll('.auth-form').forEach(form => form.style.display = 'none');
        document.getElementById(`${tabName}Form`).style.display = 'block';

        // Clear messages
        this.hideMessage();
        return this;
    }

    handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username').trim();
        const password = formData.get('password');

        if (!this.validateInput(username, password)) {
            return this.showMessage('Please fill in all fields', 'error');
        }

        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.loginUser(user)
                .showMessage('Login successful! Redirecting...', 'success')
                .redirectToDashboard();
        } else {
            this.showMessage('Invalid username or password', 'error');
        }
        
        return this;
    }

    handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username').trim();
        const password = formData.get('password');
        const role = formData.get('role');

        if (!this.validateInput(username, password) || !role) {
            return this.showMessage('Please fill in all fields', 'error');
        }

        if (this.users.some(u => u.username === username)) {
            return this.showMessage('Username already exists', 'error');
        }

        const newUser = {
            id: Date.now(),
            username,
            password,
            role
        };

        this.users.push(newUser);
        this.saveUsers()
            .showMessage('Registration successful! Please login.', 'success')
            .switchTab('login');

        e.target.reset();
        return this;
    }

    loginUser(user) {
        this.currentUser = user;
        this.saveCurrentUser();
        return this;
    }

    validateInput(username, password) {
        return username.length > 0 && password.length > 0;
    }

    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';
        messageEl.classList.add('slide-in');
        
        if (type === 'success') {
            setTimeout(() => this.hideMessage(), 3000);
        }
        return this;
    }

    hideMessage() {
        const messageEl = document.getElementById('message');
        messageEl.style.display = 'none';
        messageEl.classList.remove('slide-in');
        return this;
    }

    redirectToDashboard() {
        setTimeout(() => {
            document.getElementById('authContainer').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('dashboard').classList.add('fade-in');
            this.populateDashboard();
        }, 1000);
        return this;
    }

    populateDashboard() {
        if (!this.currentUser) return this;

        document.getElementById('dashboardUsername').textContent = this.currentUser.username;
        document.getElementById('dashboardUserId').textContent = this.currentUser.id;
        
        const roleEl = document.getElementById('dashboardRole');
        roleEl.textContent = this.currentUser.role;
        roleEl.className = `role-badge ${this.currentUser.role}`;
        
        return this;
    }

    checkAuthStatus() {
        if (this.currentUser) {
            this.redirectToDashboard();
        }
        return this;
    }

    loadUsers() {
        return JSON.parse(localStorage.getItem('blogUsers') || '[]');
    }

    saveUsers() {
        localStorage.setItem('blogUsers', JSON.stringify(this.users));
        return this;
    }

    loadCurrentUser() {
        return JSON.parse(localStorage.getItem('loggedInUser') || 'null');
    }

    saveCurrentUser() {
        localStorage.setItem('loggedInUser', JSON.stringify(this.currentUser));
        return this;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('loggedInUser');
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('authContainer').classList.add('fade-in');
        this.hideMessage();
        return this;
    }
}

// Global logout function for the button
function logout() {
    app.logout();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BlogApp();
});