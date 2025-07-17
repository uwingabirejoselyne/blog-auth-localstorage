class BlogApp {
  constructor () {
    this.users = this.loadUsers()
    this.currentUser = this.loadCurrentUser()
    this.posts = this.loadPosts()
    this.init()
  }

  init () {
    this.setupEventListeners().setupTabs().checkAuthStatus().setupSearch()
  }

  setupEventListeners () {
    document
      .getElementById('loginForm')
      .addEventListener('submit', e => this.handleLogin(e))
    document
      .getElementById('registerForm')
      .addEventListener('submit', e => this.handleRegister(e))
    document
      .getElementById('createPostForm')
      .addEventListener('submit', e => this.handleCreatePost(e))
    return this
  }

  setupTabs () {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab))
    })
    return this
  }

  setupSearch() {
  const searchInput = document.getElementById('searchInput')
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      this.renderPosts(e.target.value.trim().toLowerCase())
    })
  }
  return this
}




  switchTab (tabName) {
    document
      .querySelectorAll('.tab')
      .forEach(tab => tab.classList.remove('active'))
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')

    document
      .querySelectorAll('.auth-form')
      .forEach(form => (form.style.display = 'none'))
    document.getElementById(`${tabName}Form`).style.display = 'block'

    this.hideMessage()
    return this
  }

  handleLogin (e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const username = formData.get('username').trim()
    const password = formData.get('password')

    if (!this.validateInput(username, password)) {
      return this.showMessage('Please fill in all fields', 'error')
    }

    const user = this.users.find(
      u => u.username === username && u.password === password
    )

    if (user) {
      this.loginUser(user)
        .showMessage('Login successful! Redirecting...', 'success')
        .redirectToDashboard()
    } else {
      this.showMessage('Invalid username or password', 'error')
    }

    return this
  }

  handleRegister (e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const username = formData.get('username').trim()
    const password = formData.get('password')
    const role = formData.get('role')

    if (!this.validateInput(username, password) || !role) {
      return this.showMessage('Please fill in all fields', 'error')
    }

    if (this.users.some(u => u.username === username)) {
      return this.showMessage('Username already exists', 'error')
    }

    const newUser = {
      id: Date.now(),
      username,
      password,
      role
    }

    this.users.push(newUser)
    this.saveUsers()
      .showMessage('Registration successful! Please login.', 'success')
      .switchTab('login')

    e.target.reset()
    return this
  }

  handleCreatePost (e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const title = formData.get('title').trim()
    const content = formData.get('content').trim()
    const image = formData.get('image').trim()
    const postId = document.getElementById('createPostForm').dataset
      .editingPostId

    if (!title || !content) {
      return this.showMessage('Please fill in title and content', 'error')
    }

    if (postId) {
      const postIndex = this.posts.findIndex(p => p.id === parseInt(postId))
      if (postIndex !== -1) {
        this.posts[postIndex] = {
          ...this.posts[postIndex],
          title,
          content,
          image: image || null,
          updatedAt: new Date().toISOString()
        }

        this.savePosts()
          .renderPosts()
          .showMessage('Blog post updated successfully!', 'success')

        document.getElementById('createPostForm').reset()
        delete document.getElementById('createPostForm').dataset.editingPostId
        document.getElementById('postAuthor').value = this.currentUser.username
        document.querySelector('.create-post-btn').textContent = 'Create Post'
      }
    } else {
      const newPost = {
        id: Date.now(),
        title,
        content,
        image: image || null,
        author: this.currentUser.username,
        createdAt: new Date().toISOString(),
        updatedAt: null
      }

      this.posts.unshift(newPost)
      this.savePosts()
        .renderPosts()
        .showMessage('Blog post created successfully!', 'success')

      e.target.reset()
      document.getElementById('postAuthor').value = this.currentUser.username
    }

    return this
  }

  loginUser (user) {
    this.currentUser = user
    this.saveCurrentUser()
    return this
  }

  validateInput (username, password) {
    return username.length > 0 && password.length > 0
  }

  showMessage (text, type) {
    const messageEl = document.getElementById('message')
    messageEl.textContent = text
    messageEl.className = `message ${type}`
    messageEl.style.display = 'block'
    messageEl.classList.add('slide-in')

    if (type === 'success') {
      setTimeout(() => this.hideMessage(), 3000)
    }
    return this
  }

  hideMessage () {
    const messageEl = document.getElementById('message')
    messageEl.style.display = 'none'
    messageEl.classList.remove('slide-in')
    return this
  }

  redirectToDashboard () {
    setTimeout(() => {
      document.getElementById('authContainer').style.display = 'none'
      document.getElementById('dashboard').style.display = 'block'
      document.getElementById('dashboard').classList.add('fade-in')
      this.populateDashboard()
    }, 1000)
    return this
  }

  populateDashboard () {
    if (!this.currentUser) return this

    document.getElementById(
      'dashboardUsername'
    ).textContent = this.currentUser.username
    document.getElementById(
      'dashboardUserId'
    ).textContent = this.currentUser.id

    const roleEl = document.getElementById('dashboardRole')
    roleEl.textContent = this.currentUser.role
    roleEl.className = `role-badge ${this.currentUser.role}`

    const createPostSection = document.getElementById('createPostSection')
    if (this.currentUser.role === 'author') {
      createPostSection.style.display = 'block'
      document.getElementById('postAuthor').value = this.currentUser.username
    } else {
      createPostSection.style.display = 'none'
    }

    if (this.currentUser.role === 'admin') {
      document.getElementById('adminPanel').style.display = 'block'
      this.renderUserList()
    } else {
      document.getElementById('adminPanel').style.display = 'none'
    }

    this.renderPosts()
    return this
  }

  renderPosts (searchQuery = "") {
    const postsContainer = document.getElementById('postsContainer')
  let filteredPosts = this.posts

   if (searchQuery) {
    filteredPosts = filteredPosts.filter(post =>
      post.title.toLowerCase().includes(searchQuery) ||
      post.content.toLowerCase().includes(searchQuery) ||
      post.author.toLowerCase().includes(searchQuery)
    )
  }
    if (filteredPosts.length === 0) {
      postsContainer.innerHTML = `
                <div class="no-posts">
                    <p>No blog posts yet. ${this.currentUser.role === 'author'
                      ? 'Create your first post!'
                      : 'Check back later for new posts!'}</p>
                </div>
            `
      return this
    }

    postsContainer.innerHTML = filteredPosts
      .map(
        post => `
            <div class="post-card fade-in" data-post-id="${post.id}">
                <div class="post-header">
                    <h4 class="post-title">${this.escapeHtml(post.title)}</h4>
                    <div class="post-meta">
                        <div class="post-author">By ${this.escapeHtml(
                          post.author
                        )}</div>
                        <div>${this.formatDate(post.createdAt)}${post.updatedAt
          ? ` (updated ${this.formatDate(post.updatedAt)})`
          : ''}</div>
                    </div>
                </div>
                ${post.image
                  ? `<img src="${post.image}" alt="${this.escapeHtml(
                      post.title
                    )}" class="post-image" onerror="this.style.display='none'">`
                  : ''}
                <div class="post-content">${this.escapeHtml(post.content)}</div>
                ${this.currentUser && this.currentUser.username === post.author
                  ? `
                    <div class="post-actions">
                        <button class="btn edit-post-btn" data-post-id="${post.id}">Edit</button>
                        <button class="btn delete-post-btn" data-post-id="${post.id}">Delete</button>
                    </div>
                `
                  : ''}
            </div>
        `
      )
      .join('')

    document.querySelectorAll('.edit-post-btn').forEach(btn => {
      btn.addEventListener('click', e => this.handleEditPost(e))
    })

    document.querySelectorAll('.delete-post-btn').forEach(btn => {
      btn.addEventListener('click', e => this.handleDeletePost(e))
    })

    return this
  }

  handleEditPost (e) {
    const postId = parseInt(e.target.dataset.postId)
    const post = this.posts.find(p => p.id === postId)

    if (post) {
      document.getElementById('postTitle').value = post.title
      document.getElementById('postContent').value = post.content
      document.getElementById('postImage').value = post.image || ''
      document.getElementById('postAuthor').value = post.author

      document.querySelector('.create-post-btn').textContent = 'Update Post'
      document.getElementById('createPostForm').dataset.editingPostId = postId

      document
        .getElementById('createPostSection')
        .scrollIntoView({ behavior: 'smooth' })
    }

    return this
  }

  handleDeletePost (e) {
    if (confirm('Are you sure you want to delete this post?')) {
      const postId = parseInt(e.target.dataset.postId)
      const postIndex = this.posts.findIndex(p => p.id === postId)

      if (postIndex !== -1) {
        this.posts.splice(postIndex, 1)
        this.savePosts()
          .renderPosts()
          .showMessage('Post deleted successfully!', 'success')

        const editingPostId = document.getElementById('createPostForm').dataset
          .editingPostId
        if (editingPostId && parseInt(editingPostId) === postId) {
          document.getElementById('createPostForm').reset()
          delete document.getElementById('createPostForm').dataset
            .editingPostId
          document.querySelector('.create-post-btn').textContent =
            'Create Post'
        }
      }
    }
    return this
  }

  formatDate (dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  escapeHtml (text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  checkAuthStatus () {
    if (this.currentUser) {
      this.redirectToDashboard()
    }
    return this
  }

  loadUsers () {
    return JSON.parse(localStorage.getItem('blogUsers') || '[]')
  }
  renderUserList () {
    const userListContainer = document.getElementById('userListContainer')
    if (!userListContainer || this.currentUser.role !== 'admin') return this

    if (this.users.length === 0) {
      userListContainer.innerHTML = '<p>No users registered yet.</p>'
      return this
    }

    const userHTML = this.users
      .map(user => {
        const blogCount = this.posts.filter(p => p.author === user.username)
          .length

        return `
                <div class="user-card">
                    <div><strong>Username:</strong> ${this.escapeHtml(
                      user.username
                    )}</div>
                    <div><strong>Role:</strong> ${user.role}</div>
                    <div><strong>Blog Posts:</strong> ${blogCount}</div>
                    ${this.currentUser.username !== user.username
                      ? `
                        <button class="btn delete-user-btn" data-user-id="${user.id}">Delete User</button>
                    `
                      : ''}
                </div>
            `
      })
      .join('')

    userListContainer.innerHTML = userHTML

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', e => this.handleDeleteUser(e))
    })

    return this
  }
  handleDeleteUser (e) {
    const userId = parseInt(e.target.dataset.userId)
    const user = this.users.find(u => u.id === userId)

    if (!user) return this

    if (
      confirm(
        `Are you sure you want to delete user "${user.username}" and all their blog posts?`
      )
    ) {
      this.users = this.users.filter(u => u.id !== userId)

      this.posts = this.posts.filter(p => p.author !== user.username)

      this.saveUsers()
        .savePosts()
        .renderUserList()
        .renderPosts()
        .showMessage('User and their posts deleted successfully!', 'success')
    }

    return this
  }

  saveUsers () {
    localStorage.setItem('blogUsers', JSON.stringify(this.users))
    return this
  }

  loadCurrentUser () {
    return JSON.parse(localStorage.getItem('loggedInUser') || 'null')
  }

  saveCurrentUser () {
    localStorage.setItem('loggedInUser', JSON.stringify(this.currentUser))
    return this
  }

  loadPosts () {
    return JSON.parse(localStorage.getItem('posts') || '[]')
  }

  savePosts () {
    localStorage.setItem('posts', JSON.stringify(this.posts))
    return this
  }

  logout () {
    this.currentUser = null
    localStorage.removeItem('loggedInUser')
    document.getElementById('dashboard').style.display = 'none'
    document.getElementById('authContainer').style.display = 'block'
    document.getElementById('authContainer').classList.add('fade-in')
    this.hideMessage()
    return this
  }
}

function logout () {
  app.logout()
}

document.addEventListener('DOMContentLoaded', () => {
    
  window.app = new BlogApp()
})


