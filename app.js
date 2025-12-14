// ===================================
// DuckDB-WASM Database Setup
// ===================================

import * as duckdb from 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/+esm';

class DuckDBManager {
    constructor() {
        this.db = null;
        this.conn = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('Initializing DuckDB-WASM...');

            // Select bundle based on browser capabilities
            const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
            const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

            // Instantiate worker
            const worker_url = URL.createObjectURL(
                new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
            );
            const worker = new Worker(worker_url);
            const logger = new duckdb.ConsoleLogger();

            // Create database
            this.db = new duckdb.AsyncDuckDB(logger, worker);
            await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
            URL.revokeObjectURL(worker_url);

            // Create connection
            this.conn = await this.db.connect();

            // Create tables
            await this.createTables();

            this.initialized = true;
            console.log('DuckDB-WASM initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize DuckDB:', error);
            throw error;
        }
    }

    async createTables() {
        // Users table
        await this.conn.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR PRIMARY KEY,
                full_name VARCHAR NOT NULL,
                email VARCHAR UNIQUE NOT NULL,
                mobile VARCHAR UNIQUE NOT NULL,
                password VARCHAR NOT NULL,
                country VARCHAR,
                occupation VARCHAR,
                spouse_name VARCHAR,
                address VARCHAR,
                district VARCHAR,
                pincode VARCHAR,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Kids table (one-to-many relationship with users)
        await this.conn.query(`
            CREATE TABLE IF NOT EXISTS kids (
                id VARCHAR PRIMARY KEY,
                user_id VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                age INTEGER,
                school VARCHAR,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Events table
        await this.conn.query(`
            CREATE TABLE IF NOT EXISTS events (
                id VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                date DATE NOT NULL,
                venue VARCHAR NOT NULL,
                adult_rate DECIMAL(10,2) NOT NULL,
                kids_rate DECIMAL(10,2) NOT NULL,
                description TEXT
            )
        `);

        // Registrations table
        await this.conn.query(`
            CREATE TABLE IF NOT EXISTS registrations (
                id VARCHAR PRIMARY KEY,
                user_id VARCHAR NOT NULL,
                event_id VARCHAR NOT NULL,
                event_name VARCHAR NOT NULL,
                event_date DATE NOT NULL,
                event_venue VARCHAR NOT NULL,
                adults INTEGER NOT NULL,
                kids INTEGER NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                paid_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR DEFAULT 'booked',
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (event_id) REFERENCES events(id)
            )
        `);

        // Insert default events if table is empty
        const eventsCount = await this.conn.query('SELECT COUNT(*) as count FROM events');
        const count = eventsCount.toArray()[0].count;

        if (count === 0) {
            await this.insertDefaultEvents();
        }
    }

    async insertDefaultEvents() {
        const defaultEvents = [
            {
                id: 'evt1',
                name: 'Annual Community Gathering 2025',
                date: '2025-03-15',
                venue: 'Community Hall, Ernakulam',
                adult_rate: 500,
                kids_rate: 250,
                description: 'Join us for our annual community gathering with cultural programs, food, and networking.'
            },
            {
                id: 'evt2',
                name: 'Youth Sports Festival',
                date: '2025-04-20',
                venue: 'Sports Complex, Kottayam',
                adult_rate: 300,
                kids_rate: 150,
                description: 'A day of sports activities, competitions, and fun for the whole family.'
            },
            {
                id: 'evt3',
                name: 'Cultural Night 2025',
                date: '2025-05-10',
                venue: 'Auditorium, Thiruvananthapuram',
                adult_rate: 600,
                kids_rate: 300,
                description: 'An evening of traditional music, dance performances, and cultural celebrations.'
            }
        ];

        for (const event of defaultEvents) {
            await this.conn.query(`
                INSERT INTO events (id, name, date, venue, adult_rate, kids_rate, description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [event.id, event.name, event.date, event.venue, event.adult_rate, event.kids_rate, event.description]);
        }
    }

    async query(sql, params = []) {
        if (!this.initialized) {
            await this.initialize();
        }
        return await this.conn.query(sql, params);
    }

    async exportDatabase() {
        // Export database to file for backup
        const data = await this.db.exportDatabase();
        return data;
    }

    async importDatabase(data) {
        // Import database from backup
        await this.db.importDatabase(data);
    }
}

// ===================================
// Application State & Management
// ===================================

class CommunityApp {
    constructor() {
        this.currentUser = null;
        this.dbManager = new DuckDBManager();
        this.init();
    }

    async init() {
        try {
            // Initialize DuckDB
            await this.dbManager.initialize();

            // Hide loading screen
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
                document.getElementById('app').style.display = 'flex';
                this.checkAuth();
            }, 1500);

            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Failed to initialize database. Please refresh the page.', 'error');
        }
    }

    // ===================================
    // Authentication
    // ===================================

    async checkAuth() {
        const savedUser = this.loadFromStorage('currentUser');
        if (savedUser) {
            // Verify user still exists in database
            const result = await this.dbManager.query(
                'SELECT * FROM users WHERE id = ?',
                [savedUser.id]
            );
            const users = result.toArray();

            if (users.length > 0) {
                this.currentUser = this.mapUserFromDB(users[0]);
                this.showView('dashboard');
                this.updateUserName();
            } else {
                localStorage.removeItem('currentUser');
                this.showView('login');
            }
        } else {
            this.showView('login');
        }
    }

    async login(emailOrMobile, password) {
        const result = await this.dbManager.query(`
            SELECT * FROM users 
            WHERE (email = ? OR mobile = ?) AND password = ?
        `, [emailOrMobile, emailOrMobile, password]);

        const users = result.toArray();

        if (users.length > 0) {
            this.currentUser = this.mapUserFromDB(users[0]);

            // Load kids
            const kidsResult = await this.dbManager.query(
                'SELECT * FROM kids WHERE user_id = ?',
                [this.currentUser.id]
            );
            this.currentUser.kids = kidsResult.toArray();

            this.saveToStorage('currentUser', this.currentUser);
            this.showView('dashboard');
            this.updateUserName();
            this.showToast('Welcome back!', 'success');
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showView('login');
        this.showToast('Logged out successfully', 'info');
    }

    async register(userData) {
        try {
            // Check if user already exists
            const checkResult = await this.dbManager.query(`
                SELECT id FROM users WHERE email = ? OR mobile = ?
            `, [userData.email, userData.mobile]);

            if (checkResult.toArray().length > 0) {
                this.showToast('User with this email or mobile already exists', 'error');
                return false;
            }

            // Insert user
            const userId = this.generateId();
            await this.dbManager.query(`
                INSERT INTO users (id, full_name, email, mobile, password, country, occupation, 
                                  spouse_name, address, district, pincode)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId,
                userData.fullName,
                userData.email,
                userData.mobile,
                userData.password,
                userData.country,
                userData.occupation,
                userData.spouseName || null,
                userData.address || null,
                userData.district || null,
                userData.pincode || null
            ]);

            // Insert kids if any
            if (userData.kids && userData.kids.length > 0) {
                for (const kid of userData.kids) {
                    await this.dbManager.query(`
                        INSERT INTO kids (id, user_id, name, age, school)
                        VALUES (?, ?, ?, ?, ?)
                    `, [this.generateId(), userId, kid.name, kid.age || null, kid.school || null]);
                }
            }

            this.showToast('Registration successful! Please login.', 'success');
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Registration failed. Please try again.', 'error');
            return false;
        }
    }

    // ===================================
    // View Management
    // ===================================

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show requested view
        const viewMap = {
            'login': 'loginView',
            'register': 'registerView',
            'dashboard': 'dashboardView',
            'events': 'eventsView',
            'search': 'searchView',
            'myRegistrations': 'myRegistrationsView',
            'profile': 'profileView'
        };

        const viewId = viewMap[viewName];
        if (viewId) {
            document.getElementById(viewId).classList.add('active');

            // Update bottom nav
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.view === viewName) {
                    item.classList.add('active');
                }
            });

            // Load view-specific content
            this.loadViewContent(viewName);
        }
    }

    loadViewContent(viewName) {
        switch (viewName) {
            case 'events':
                this.renderEvents();
                break;
            case 'search':
                this.renderSearchResults();
                break;
            case 'myRegistrations':
                this.renderMyRegistrations();
                break;
            case 'profile':
                this.renderProfile();
                break;
        }
    }

    updateUserName() {
        if (this.currentUser) {
            document.getElementById('userName').textContent = this.currentUser.fullName.split(' ')[0];
        }
    }

    // ===================================
    // Event Listeners
    // ===================================

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!await this.login(email, password)) {
                this.showToast('Invalid credentials', 'error');
            }
        });

        // Show register view
        document.getElementById('showRegisterBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('register');
        });

        // Back to login
        document.getElementById('backToLoginBtn').addEventListener('click', () => {
            this.showView('login');
        });

        // Registration form
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = this.collectRegistrationData();
            if (await this.register(userData)) {
                this.showView('login');
            }
        });

        // Add kid button
        document.getElementById('addKidBtn').addEventListener('click', () => {
            this.addKidField();
        });

        // Password toggle buttons
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                const input = document.getElementById(targetId);
                const icon = e.currentTarget.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });

        // Dashboard cards
        document.getElementById('viewEventsCard').addEventListener('click', () => {
            this.showView('events');
        });

        document.getElementById('searchMembersCard').addEventListener('click', () => {
            this.showView('search');
        });

        document.getElementById('myRegistrationsCard').addEventListener('click', () => {
            this.showView('myRegistrations');
        });

        document.getElementById('profileCard').addEventListener('click', () => {
            this.showView('profile');
        });

        // Back buttons
        document.getElementById('backToDashboard1').addEventListener('click', () => {
            this.showView('dashboard');
        });

        document.getElementById('backToDashboard2').addEventListener('click', () => {
            this.showView('dashboard');
        });

        document.getElementById('backToDashboard3').addEventListener('click', () => {
            this.showView('dashboard');
        });

        document.getElementById('backToDashboard4').addEventListener('click', () => {
            this.showView('dashboard');
        });

        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.showView(view);
            });
        });

        // User menu
        document.getElementById('userMenuBtn').addEventListener('click', () => {
            if (this.currentUser) {
                if (confirm('Do you want to logout?')) {
                    this.logout();
                }
            }
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchMembers(e.target.value);
        });

        // Modal close
        document.getElementById('closeEventModal').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') {
                this.closeModal();
            }
        });
    }

    // ===================================
    // Registration Form
    // ===================================

    addKidField() {
        const container = document.getElementById('kidsContainer');
        const kidIndex = container.children.length;

        const kidItem = document.createElement('div');
        kidItem.className = 'kid-item';
        kidItem.innerHTML = `
            <div class="kid-header">
                <h4>Child ${kidIndex + 1}</h4>
                <button type="button" class="btn-remove" onclick="app.removeKid(this)">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" class="kid-name" placeholder="Child's name">
                </div>
                <div class="form-group">
                    <label>Age</label>
                    <input type="number" class="kid-age" placeholder="Age" min="0" max="25">
                </div>
            </div>
            <div class="form-group">
                <label>School/College</label>
                <input type="text" class="kid-school" placeholder="School or college name">
            </div>
        `;

        container.appendChild(kidItem);
    }

    removeKid(button) {
        button.closest('.kid-item').remove();
        // Update kid numbers
        document.querySelectorAll('.kid-item').forEach((item, index) => {
            item.querySelector('h4').textContent = `Child ${index + 1}`;
        });
    }

    collectRegistrationData() {
        const kids = [];
        document.querySelectorAll('.kid-item').forEach(item => {
            const name = item.querySelector('.kid-name').value;
            const age = item.querySelector('.kid-age').value;
            const school = item.querySelector('.kid-school').value;

            if (name) {
                kids.push({ name, age, school });
            }
        });

        return {
            fullName: document.getElementById('regFullName').value,
            mobile: document.getElementById('regMobile').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            country: document.getElementById('regCountry').value,
            occupation: document.getElementById('regOccupation').value,
            spouseName: document.getElementById('regSpouseName').value,
            kids: kids,
            address: document.getElementById('regAddress').value,
            district: document.getElementById('regDistrict').value,
            pincode: document.getElementById('regPincode').value
        };
    }

    // ===================================
    // Events Management
    // ===================================

    async renderEvents() {
        const container = document.getElementById('eventsGrid');
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Loading events...</p>';

        try {
            const result = await this.dbManager.query('SELECT * FROM events ORDER BY date');
            const events = result.toArray();

            container.innerHTML = '';

            events.forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                eventCard.innerHTML = `
                    <div class="event-image">
                        <i class="fas fa-calendar-star"></i>
                    </div>
                    <div class="event-content">
                        <h3 class="event-title">${event.name}</h3>
                        <div class="event-details">
                            <div class="event-detail">
                                <i class="fas fa-calendar"></i>
                                <span>${this.formatDate(event.date)}</span>
                            </div>
                            <div class="event-detail">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${event.venue}</span>
                            </div>
                        </div>
                        <div class="event-pricing">
                            <h4>Registration Fees</h4>
                            <div class="pricing-row">
                                <span>Adult:</span>
                                <strong>₹${event.adult_rate}</strong>
                            </div>
                            <div class="pricing-row">
                                <span>Kids:</span>
                                <strong>₹${event.kids_rate}</strong>
                            </div>
                        </div>
                        <div class="event-actions">
                            <button class="btn btn-primary btn-block" onclick="app.openEventRegistration('${event.id}')">
                                <i class="fas fa-ticket-alt"></i> Register Now
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(eventCard);
            });
        } catch (error) {
            console.error('Error loading events:', error);
            container.innerHTML = '<p style="color: var(--error); text-align: center; padding: 2rem;">Failed to load events.</p>';
        }
    }

    async openEventRegistration(eventId) {
        const result = await this.dbManager.query('SELECT * FROM events WHERE id = ?', [eventId]);
        const events = result.toArray();

        if (events.length === 0) return;
        const event = events[0];

        const modal = document.getElementById('eventModal');
        const modalBody = document.getElementById('eventModalBody');

        document.getElementById('modalEventName').textContent = event.name;

        const adults = this.currentUser ? 1 : 0;
        const kidsCount = this.currentUser?.kids?.length || 0;
        const totalAdults = adults;
        const totalKids = kidsCount;
        const totalAmount = (totalAdults * event.adult_rate) + (totalKids * event.kids_rate);

        modalBody.innerHTML = `
            <div class="form-section">
                <h3><i class="fas fa-info-circle"></i> Event Details</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Date</span>
                        <span class="info-value">${this.formatDate(event.date)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Venue</span>
                        <span class="info-value">${event.venue}</span>
                    </div>
                </div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">${event.description}</p>
            </div>

            <div class="form-section">
                <h3><i class="fas fa-users"></i> Attendees</h3>
                <div class="form-group">
                    <label for="modalAdults">Number of Adults</label>
                    <input type="number" id="modalAdults" value="${totalAdults}" min="0" max="10" onchange="app.updateEventTotal('${eventId}')">
                </div>
                <div class="form-group">
                    <label for="modalKids">Number of Kids</label>
                    <input type="number" id="modalKids" value="${totalKids}" min="0" max="10" onchange="app.updateEventTotal('${eventId}')">
                </div>
            </div>

            <div class="form-section">
                <h3><i class="fas fa-rupee-sign"></i> Payment Summary</h3>
                <div class="event-pricing">
                    <div class="pricing-row">
                        <span>Adults (<span id="adultCount">${totalAdults}</span> × ₹${event.adult_rate}):</span>
                        <strong>₹<span id="adultTotal">${totalAdults * event.adult_rate}</span></strong>
                    </div>
                    <div class="pricing-row">
                        <span>Kids (<span id="kidsCount">${totalKids}</span> × ₹${event.kids_rate}):</span>
                        <strong>₹<span id="kidsTotal">${totalKids * event.kids_rate}</span></strong>
                    </div>
                    <div class="pricing-row" style="border-top: 2px solid var(--primary-500); padding-top: 0.5rem; margin-top: 0.5rem;">
                        <span style="font-size: 1.1rem; font-weight: 600;">Total Amount:</span>
                        <strong style="font-size: 1.25rem; color: var(--primary-400);">₹<span id="totalAmount">${totalAmount}</span></strong>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <button class="btn btn-secondary" onclick="app.closeModal()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="btn btn-primary" onclick="app.confirmEventRegistration('${eventId}')">
                    <i class="fas fa-check"></i> Confirm Registration
                </button>
            </div>
        `;

        modal.classList.add('active');
    }

    async updateEventTotal(eventId) {
        const result = await this.dbManager.query('SELECT * FROM events WHERE id = ?', [eventId]);
        const events = result.toArray();

        if (events.length === 0) return;
        const event = events[0];

        const adults = parseInt(document.getElementById('modalAdults').value) || 0;
        const kids = parseInt(document.getElementById('modalKids').value) || 0;

        const adultTotal = adults * event.adult_rate;
        const kidsTotal = kids * event.kids_rate;
        const total = adultTotal + kidsTotal;

        document.getElementById('adultCount').textContent = adults;
        document.getElementById('kidsCount').textContent = kids;
        document.getElementById('adultTotal').textContent = adultTotal;
        document.getElementById('kidsTotal').textContent = kidsTotal;
        document.getElementById('totalAmount').textContent = total;
    }

    async confirmEventRegistration(eventId) {
        try {
            const result = await this.dbManager.query('SELECT * FROM events WHERE id = ?', [eventId]);
            const events = result.toArray();

            if (events.length === 0) return;
            const event = events[0];

            const adults = parseInt(document.getElementById('modalAdults').value) || 0;
            const kids = parseInt(document.getElementById('modalKids').value) || 0;
            const totalAmount = (adults * event.adult_rate) + (kids * event.kids_rate);

            await this.dbManager.query(`
                INSERT INTO registrations (id, user_id, event_id, event_name, event_date, event_venue,
                                          adults, kids, total_amount, paid_amount, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                this.generateId(),
                this.currentUser.id,
                event.id,
                event.name,
                event.date,
                event.venue,
                adults,
                kids,
                totalAmount,
                totalAmount,
                'booked'
            ]);

            this.closeModal();
            this.showToast('Event registration successful!', 'success');
            this.showView('myRegistrations');
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Registration failed. Please try again.', 'error');
        }
    }

    closeModal() {
        document.getElementById('eventModal').classList.remove('active');
    }

    // ===================================
    // Search Members
    // ===================================

    async searchMembers(query) {
        const results = document.getElementById('searchResults');

        if (!query || query.length < 2) {
            results.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Enter at least 2 characters to search...</p>';
            return;
        }

        try {
            const searchQuery = `%${query}%`;
            const result = await this.dbManager.query(`
                SELECT * FROM users 
                WHERE full_name LIKE ? 
                   OR email LIKE ? 
                   OR mobile LIKE ? 
                   OR district LIKE ? 
                   OR country LIKE ?
            `, [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery]);

            const users = result.toArray();

            if (users.length === 0) {
                results.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No members found.</p>';
                return;
            }

            results.innerHTML = '';
            users.forEach(user => {
                const memberCard = document.createElement('div');
                memberCard.className = 'member-card';

                const initials = user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                memberCard.innerHTML = `
                    <div class="member-header">
                        <div class="member-avatar">${initials}</div>
                        <div class="member-info">
                            <h3>${user.full_name}</h3>
                            <p>${user.occupation || 'Member'}</p>
                        </div>
                    </div>
                    <div class="member-details">
                        <div class="member-detail">
                            <i class="fas fa-envelope"></i>
                            <span>${user.email}</span>
                        </div>
                        <div class="member-detail">
                            <i class="fas fa-phone"></i>
                            <span>${user.mobile}</span>
                        </div>
                        <div class="member-detail">
                            <i class="fas fa-globe"></i>
                            <span>${user.country}</span>
                        </div>
                        ${user.district ? `
                        <div class="member-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${user.district}</span>
                        </div>
                        ` : ''}
                    </div>
                `;

                results.appendChild(memberCard);
            });
        } catch (error) {
            console.error('Search error:', error);
            results.innerHTML = '<p style="color: var(--error); text-align: center; padding: 2rem;">Search failed.</p>';
        }
    }

    renderSearchResults() {
        const results = document.getElementById('searchResults');
        results.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Enter a search term to find members...</p>';
        document.getElementById('searchInput').value = '';
    }

    // ===================================
    // My Registrations
    // ===================================

    async renderMyRegistrations() {
        const container = document.getElementById('myRegistrationsList');

        if (!this.currentUser) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Please login to view registrations.</p>';
            return;
        }

        try {
            const result = await this.dbManager.query(`
                SELECT * FROM registrations 
                WHERE user_id = ? 
                ORDER BY registered_at DESC
            `, [this.currentUser.id]);

            const registrations = result.toArray();

            if (registrations.length === 0) {
                container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">You have no event registrations yet.</p>';
                return;
            }

            container.innerHTML = '';
            registrations.forEach(reg => {
                const card = document.createElement('div');
                card.className = 'registration-card';
                card.innerHTML = `
                    <div class="registration-header">
                        <div>
                            <h3 class="registration-title">${reg.event_name}</h3>
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">
                                <i class="fas fa-calendar"></i> ${this.formatDate(reg.event_date)}
                            </p>
                        </div>
                        <span class="status-badge ${reg.status}">${reg.status}</span>
                    </div>
                    <div class="registration-details">
                        <div class="detail-item">
                            <span class="detail-label">Venue</span>
                            <span class="detail-value">${reg.event_venue}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Adults</span>
                            <span class="detail-value">${reg.adults}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Kids</span>
                            <span class="detail-value">${reg.kids}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Total Amount</span>
                            <span class="detail-value">₹${reg.total_amount}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Paid Amount</span>
                            <span class="detail-value">₹${reg.paid_amount}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Registered On</span>
                            <span class="detail-value">${this.formatDate(reg.registered_at)}</span>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading registrations:', error);
            container.innerHTML = '<p style="color: var(--error); text-align: center; padding: 2rem;">Failed to load registrations.</p>';
        }
    }

    // ===================================
    // Profile
    // ===================================

    async renderProfile() {
        const container = document.getElementById('profileContent');

        if (!this.currentUser) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Please login to view profile.</p>';
            return;
        }

        try {
            // Reload user data from database
            const userResult = await this.dbManager.query('SELECT * FROM users WHERE id = ?', [this.currentUser.id]);
            const users = userResult.toArray();

            if (users.length === 0) {
                container.innerHTML = '<p style="color: var(--error); text-align: center; padding: 2rem;">User not found.</p>';
                return;
            }

            const user = this.mapUserFromDB(users[0]);

            // Load kids
            const kidsResult = await this.dbManager.query('SELECT * FROM kids WHERE user_id = ?', [user.id]);
            const kids = kidsResult.toArray();

            container.innerHTML = `
                <div class="profile-section">
                    <h2><i class="fas fa-user"></i> Personal Information</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Full Name</span>
                            <span class="info-value">${user.fullName}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Email</span>
                            <span class="info-value">${user.email}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Mobile</span>
                            <span class="info-value">${user.mobile}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Country</span>
                            <span class="info-value">${user.country}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Occupation</span>
                            <span class="info-value">${user.occupation}</span>
                        </div>
                    </div>
                </div>

                ${user.spouseName ? `
                <div class="profile-section">
                    <h2><i class="fas fa-heart"></i> Family Information</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Spouse Name</span>
                            <span class="info-value">${user.spouseName}</span>
                        </div>
                    </div>
                    ${kids.length > 0 ? `
                        <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; font-size: 1rem; color: var(--text-secondary);">Children</h3>
                        ${kids.map((kid, index) => `
                            <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                                <strong>${kid.name}</strong> - Age: ${kid.age || 'N/A'}${kid.school ? `, ${kid.school}` : ''}
                            </div>
                        `).join('')}
                    ` : ''}
                </div>
                ` : ''}

                ${user.address || user.district ? `
                <div class="profile-section">
                    <h2><i class="fas fa-map-marker-alt"></i> Address in India</h2>
                    <div class="info-grid">
                        ${user.address ? `
                        <div class="info-item" style="grid-column: 1 / -1;">
                            <span class="info-label">Street Address</span>
                            <span class="info-value">${user.address}</span>
                        </div>
                        ` : ''}
                        ${user.district ? `
                        <div class="info-item">
                            <span class="info-label">District</span>
                            <span class="info-value">${user.district}</span>
                        </div>
                        ` : ''}
                        ${user.pincode ? `
                        <div class="info-item">
                            <span class="info-label">Pincode</span>
                            <span class="info-value">${user.pincode}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <div class="form-actions">
                    <button class="btn btn-secondary btn-block" onclick="app.logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            `;
        } catch (error) {
            console.error('Error loading profile:', error);
            container.innerHTML = '<p style="color: var(--error); text-align: center; padding: 2rem;">Failed to load profile.</p>';
        }
    }

    // ===================================
    // Utilities
    // ===================================

    mapUserFromDB(dbUser) {
        return {
            id: dbUser.id,
            fullName: dbUser.full_name,
            email: dbUser.email,
            mobile: dbUser.mobile,
            country: dbUser.country,
            occupation: dbUser.occupation,
            spouseName: dbUser.spouse_name,
            address: dbUser.address,
            district: dbUser.district,
            pincode: dbUser.pincode,
            createdAt: dbUser.created_at
        };
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from storage:', error);
            return null;
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-IN', options);
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// ===================================
// Initialize Application
// ===================================

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CommunityApp();
});
