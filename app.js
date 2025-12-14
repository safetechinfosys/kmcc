// ===================================
// Supabase Database Setup
// ===================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG } from './supabase-config.js';

class SupabaseManager {
    constructor() {
        this.client = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('Initializing Supabase...');

            // Check if config is set
            if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
                throw new Error('Please configure Supabase credentials in supabase-config.js');
            }

            // Create Supabase client
            this.client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

            this.initialized = true;
            console.log('Supabase initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            throw error;
        }
    }

    // Helper method to execute queries
    getClient() {
        if (!this.initialized) {
            throw new Error('Supabase not initialized');
        }
        return this.client;
    }
}

// ===================================
// Application State & Management
// ===================================

class CommunityApp {
    constructor() {
        this.currentUser = null;
        this.dbManager = new SupabaseManager();
        this.init();
    }

    async init() {
        try {
            // Initialize Supabase
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
            document.getElementById('loadingScreen').innerHTML = `
                <div style="text-align: center; color: white; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                    <h2>Configuration Error</h2>
                    <p style="margin: 1rem 0;">Please configure Supabase credentials in supabase-config.js</p>
                    <p style="font-size: 0.9rem; color: #a0a0a0;">See setup instructions in the README</p>
                </div>
            `;
        }
    }

    // ===================================
    // Authentication
    // ===================================

    async checkAuth() {
        try {
            const savedUser = this.loadFromStorage('currentUser');

            if (savedUser && savedUser.id) {
                // Validate if ID is UUID (simple check)
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(savedUser.id);

                if (!isUUID) {
                    console.warn('Invalid user ID format (old data), clearing session');
                    localStorage.removeItem('currentUser');
                    this.showView('login');
                    return;
                }

                // Verify user still exists in database
                const { data, error } = await this.dbManager.getClient()
                    .from('users')
                    .select('*')
                    .eq('id', savedUser.id)
                    .single();

                if (data && !error) {
                    this.currentUser = data;
                    this.showView('dashboard');
                    this.updateUserName();
                } else {
                    console.log('User not found or error, logging out', error);
                    localStorage.removeItem('currentUser');
                    this.showView('login');
                }
            } else {
                this.showView('login');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('currentUser');
            this.showView('login');
        }
    }

    async login(emailOrMobile, password) {
        const { data, error } = await this.dbManager.getClient()
            .from('users')
            .select('*')
            .or(`email.eq.${emailOrMobile},mobile.eq.${emailOrMobile}`)
            .eq('password', password)
            .single();

        if (data && !error) {
            this.currentUser = data;

            // Load kids
            const { data: kids } = await this.dbManager.getClient()
                .from('kids')
                .select('*')
                .eq('user_id', this.currentUser.id);

            this.currentUser.kids = kids || [];

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
            const { data: existing } = await this.dbManager.getClient()
                .from('users')
                .select('id')
                .or(`email.eq.${userData.email},mobile.eq.${userData.mobile}`)
                .single();

            if (existing) {
                this.showToast('User with this email or mobile already exists', 'error');
                return false;
            }

            // Insert user
            const { data: newUser, error: userError } = await this.dbManager.getClient()
                .from('users')
                .insert([{
                    full_name: userData.fullName,
                    email: userData.email,
                    mobile: userData.mobile,
                    password: userData.password,
                    country: userData.country,
                    occupation: userData.occupation,
                    spouse_name: userData.spouseName || null,
                    address: userData.address || null,
                    district: userData.district || null,
                    pincode: userData.pincode || null
                }])
                .select()
                .single();

            if (userError) throw userError;

            // Insert kids if any
            if (userData.kids && userData.kids.length > 0) {
                const kidsData = userData.kids.map(kid => ({
                    user_id: newUser.id,
                    name: kid.name,
                    age: kid.age || null,
                    school: kid.school || null
                }));

                const { error: kidsError } = await this.dbManager.getClient()
                    .from('kids')
                    .insert(kidsData);

                if (kidsError) console.error('Error inserting kids:', kidsError);
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
            document.getElementById('userName').textContent = this.currentUser.full_name.split(' ')[0];
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
            const { data: events, error } = await this.dbManager.getClient()
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;

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
        const { data: event, error } = await this.dbManager.getClient()
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error || !event) return;

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
        const { data: event, error } = await this.dbManager.getClient()
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error || !event) return;

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
            const { data: event, error: eventError } = await this.dbManager.getClient()
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (eventError || !event) throw eventError;

            const adults = parseInt(document.getElementById('modalAdults').value) || 0;
            const kids = parseInt(document.getElementById('modalKids').value) || 0;
            const totalAmount = (adults * event.adult_rate) + (kids * event.kids_rate);

            const { error: regError } = await this.dbManager.getClient()
                .from('registrations')
                .insert([{
                    user_id: this.currentUser.id,
                    event_id: event.id,
                    event_name: event.name,
                    event_date: event.date,
                    event_venue: event.venue,
                    adults: adults,
                    kids: kids,
                    total_amount: totalAmount,
                    paid_amount: totalAmount,
                    status: 'booked'
                }]);

            if (regError) throw regError;

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
            const { data: users, error } = await this.dbManager.getClient()
                .from('users')
                .select('*')
                .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,mobile.ilike.%${query}%,district.ilike.%${query}%`)
                .limit(20);

            if (error) throw error;

            results.innerHTML = '';

            if (users.length === 0) {
                results.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No members found.</p>';
                return;
            }

            users.forEach(user => {
                const memberCard = document.createElement('div');
                memberCard.className = 'member-card';
                memberCard.innerHTML = `
                    <div class="member-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="member-info">
                        <h3>${user.full_name}</h3>
                        <div class="member-details">
                            <div class="member-detail">
                                <i class="fas fa-envelope"></i>
                                <span>${user.email}</span>
                            </div>
                            <div class="member-detail">
                                <i class="fas fa-phone"></i>
                                <span>${user.mobile}</span>
                            </div>
                            ${user.district ? `
                                <div class="member-detail">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${user.district}</span>
                                </div>
                            ` : ''}
                            ${user.occupation ? `
                                <div class="member-detail">
                                    <i class="fas fa-briefcase"></i>
                                    <span>${user.occupation}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                results.appendChild(memberCard);
            });
        } catch (error) {
            console.error('Search error:', error);
            results.innerHTML = '<p style="color: var(--error); text-align: center; padding: 2rem;">Search failed. Please try again.</p>';
        }
    }

    async renderSearchResults() {
        const results = document.getElementById('searchResults');
        results.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Enter at least 2 characters to search...</p>';
    }

    // ===================================
    // My Registrations
    // ===================================

    async renderMyRegistrations() {
        const container = document.getElementById('registrationsList');
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Loading registrations...</p>';

        try {
            const { data: registrations, error } = await this.dbManager.getClient()
                .from('registrations')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('registered_at', { ascending: false });

            if (error) throw error;

            container.innerHTML = '';

            if (registrations.length === 0) {
                container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No registrations yet.</p>';
                return;
            }

            registrations.forEach(reg => {
                const regCard = document.createElement('div');
                regCard.className = 'registration-card';
                regCard.innerHTML = `
                    <div class="registration-header">
                        <h3>${reg.event_name}</h3>
                        <span class="status-badge status-${reg.status}">${reg.status}</span>
                    </div>
                    <div class="registration-details">
                        <div class="registration-detail">
                            <i class="fas fa-calendar"></i>
                            <span>${this.formatDate(reg.event_date)}</span>
                        </div>
                        <div class="registration-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${reg.event_venue}</span>
                        </div>
                        <div class="registration-detail">
                            <i class="fas fa-users"></i>
                            <span>${reg.adults} Adults, ${reg.kids} Kids</span>
                        </div>
                        <div class="registration-detail">
                            <i class="fas fa-rupee-sign"></i>
                            <span>Total: ₹${reg.total_amount} | Paid: ₹${reg.paid_amount}</span>
                        </div>
                    </div>
                `;
                container.appendChild(regCard);
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
        if (!this.currentUser) return;

        const container = document.getElementById('profileContent');

        // Load fresh kids data
        const { data: kids } = await this.dbManager.getClient()
            .from('kids')
            .select('*')
            .eq('user_id', this.currentUser.id);

        const kidsHtml = kids && kids.length > 0 ? kids.map(kid => `
            <div class="kid-info">
                <h4><i class="fas fa-child"></i> ${kid.name}</h4>
                <p>Age: ${kid.age || 'N/A'} | School: ${kid.school || 'N/A'}</p>
            </div>
        `).join('') : '<p style="color: var(--text-secondary);">No children added</p>';

        container.innerHTML = `
            <div class="profile-section">
                <h3><i class="fas fa-user"></i> Personal Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Full Name</span>
                        <span class="info-value">${this.currentUser.full_name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">${this.currentUser.email}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Mobile</span>
                        <span class="info-value">${this.currentUser.mobile}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Country</span>
                        <span class="info-value">${this.currentUser.country || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Occupation</span>
                        <span class="info-value">${this.currentUser.occupation || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Spouse</span>
                        <span class="info-value">${this.currentUser.spouse_name || 'N/A'}</span>
                    </div>
                </div>
            </div>

            ${this.currentUser.address ? `
                <div class="profile-section">
                    <h3><i class="fas fa-map-marker-alt"></i> Address</h3>
                    <p>${this.currentUser.address}</p>
                    <p>${this.currentUser.district || ''} ${this.currentUser.pincode || ''}</p>
                </div>
            ` : ''}

            <div class="profile-section">
                <h3><i class="fas fa-users"></i> Family</h3>
                ${kidsHtml}
            </div>
        `;
    }

    // ===================================
    // Utility Methods
    // ===================================

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    saveToStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    loadFromStorage(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

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
            pincode: dbUser.pincode
        };
    }
}

// Initialize app
const app = new CommunityApp();
