import React, {
    useState,
    useEffect,
    createContext,
    useContext,
    useMemo,
    useRef,
} from 'react';
import {
    motion,
    AnimatePresence,
} from 'framer-motion';
import {
    Users,
    Package,
    CheckCircle,
    LogIn,
    LogOut,
    UserPlus,
    LayoutDashboard,
    PlusCircle,
    Trash2,
    AlertCircle,
    X,
    Loader2,
    UtensilsCrossed,
    HeartHandshake,
    CalendarDays,
    Clock,
    MapPin,
    List,
    Users2,
    ClipboardList,
    Edit3
} from 'lucide-react';

// CSS is imported in main.jsx
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// --- Authentication Context ---
const AuthContext = createContext(null);

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [role, setRole] = useState(localStorage.getItem('role'));
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('login');

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
                setRole(parsedUser.role);
                redirectToDashboard(parsedUser.role);
            } catch (e) {
                console.error("Failed to parse stored user:", e);
                logout();
            }
        } else {
            setCurrentPage('home');
        }
        setIsLoading(false);
    }, []);

    const redirectToDashboard = (userRole) => {
        if (userRole === 'Admin') setCurrentPage('adminDashboard');
        else if (userRole === 'Donor') setCurrentPage('donorDashboard');
        else if (userRole === 'Receiver') setCurrentPage('receiverDashboard');
        else setCurrentPage('login');
    };

    const apiLogin = async (email, password) => {
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');
        return data;
    };

    const apiRegister = async (name, email, password, role) => {
        const response = await fetch(`${BACKEND_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Registration failed');
        return data;
    };

    const login = async (email, password) => {
        const { token, user } = await apiLogin(email, password);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        setRole(user.role);
        redirectToDashboard(user.role);
    };

    const register = async (name, email, password, role) => {
        const { token, user } = await apiRegister(name, email, password, role);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        setRole(user.role);
        redirectToDashboard(user.role);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setToken(null);
        setUser(null);
        setRole(null);
        setCurrentPage('login');
    };

    const value = useMemo(
        () => ({
            user, token, role, isLoggedIn: !!token, isLoading,
            login, logout, register,
            currentPage, setCurrentPage,
        }), [user, token, role, isLoading, currentPage]
    );

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
}

function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}

// --- Main App Component ---
export default function App() {
    return (
        <AuthProvider>
            <div className="brand-tagline">
                🌿 Fighting hunger, one meal at a time — Connect donors &amp; receivers across your community
            </div>
            <Header />
            <main style={{ flex: 1 }}>
                <AnimatePresence mode="wait">
                    <PageContent />
                </AnimatePresence>
            </main>
            <footer style={{
                background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
                color: 'rgba(255,255,255,0.75)',
                textAlign: 'center',
                padding: '1.25rem',
                fontSize: '0.8rem',
                letterSpacing: '0.02em',
                marginTop: 'auto',
            }}>
                <span style={{ color: '#A5D6A7', fontWeight: 700 }}>LeftoverLink</span> &nbsp;|&nbsp; Reducing food waste, strengthening communities &nbsp;&nbsp;♻️ 🍱
            </footer>
        </AuthProvider>
    );
}

// --- Page-Switching Component ---
function PageContent() {
    const { currentPage, isLoggedIn } = useAuth();
    switch (currentPage) {
        case 'home': return <LandingPage key="home" />;
        case 'login': return <LoginPage key="login" />;
        case 'register': return <RegisterPage key="register" />;
        case 'donorDashboard': return isLoggedIn ? <DonorDashboard key="donor" /> : <LoginPage key="login" />;
        case 'receiverDashboard': return isLoggedIn ? <ReceiverDashboard key="receiver" /> : <LoginPage key="login" />;
        case 'adminDashboard': return isLoggedIn ? <AdminDashboard key="admin" /> : <LoginPage key="login" />;
        default: return <LandingPage key="home" />;
    }
}

// --- Reusable UI Components (PageWrapper, AuthCard, Input, Select, Button, Messages) ---
function PageWrapper({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="page-wrapper"
        >
            {children}
        </motion.div>
    );
}

function AuthCard({ title, children }) {
    return (
        <div className="auth-page-wrapper">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="auth-card"
            >
                <div className="auth-card-header">
                    <motion.div
                        animate={{ rotate: [0, 15, -10, 15, 0] }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="auth-card-icon"
                    >
                        <HeartHandshake style={{ height: '100%', width: '100%' }} />
                    </motion.div>
                    <h2 className="auth-card-title">{title}</h2>
                </div>
                {children}
            </motion.div>
        </div>
    );
}

const Input = React.forwardRef(({ id, name, type, placeholder, ...props }, ref) => (
    <div>
        <label htmlFor={id} className="sr-only">{placeholder}</label>
        <input ref={ref} id={id} name={name} type={type} required className="form-input" placeholder={placeholder} {...props} />
    </div>
));
Input.displayName = 'Input'; // Add display name for React DevTools

const Select = React.forwardRef(({ id, name, children, ...props }, ref) => (
    <div>
        <label htmlFor={id} className="sr-only">{name}</label>
        <select ref={ref} id={id} name={name} required className="form-select" {...props}>
            {children}
        </select>
    </div>
));
Select.displayName = 'Select'; // Add display name for React DevTools

function Button({ children, type = 'button', onClick, className = '', isLoading = false, ...props }) {
    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={isLoading}
            className={`button ${className}`}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            {...props}
        >
            {isLoading ? <Loader2 className="spinner-inline" /> : children}
        </motion.button>
    );
}

// --- Header ---
function Header() {
    const { isLoggedIn, role, logout, setCurrentPage, user } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);
    const goDash = () => {
        if (role === 'Admin') setCurrentPage('adminDashboard');
        else if (role === 'Donor') setCurrentPage('donorDashboard');
        else if (role === 'Receiver') setCurrentPage('receiverDashboard');
        closeMenu();
    };
    return (
        <nav className="header-nav">
            <div className="header-container">
                <button className="header-logo-btn" onClick={() => { closeMenu(); setCurrentPage(isLoggedIn ? (role === 'Admin' ? 'adminDashboard' : role === 'Donor' ? 'donorDashboard' : 'receiverDashboard') : 'home'); }}>
                    <UtensilsCrossed className="header-logo-icon" />
                    <span className="header-logo-text">LeftoverLink</span>
                </button>
                {/* Desktop links */}
                <div className="header-links desktop-only">
                    {isLoggedIn ? (
                        <>
                            <span className="header-user-greeting">Hi, <span>{user?.name}</span>{role === 'Admin' && ' (Admin)'}</span>
                            <HeaderButton onClick={goDash} icon={<LayoutDashboard className="header-button-icon" />}>Dashboard</HeaderButton>
                            <HeaderButton onClick={logout} icon={<LogOut className="header-button-icon" />} className="logout">Logout</HeaderButton>
                        </>
                    ) : (
                        <>
                            <HeaderButton onClick={() => setCurrentPage('home')} icon={<UtensilsCrossed className="header-button-icon" />}>Home</HeaderButton>
                            <HeaderButton onClick={() => setCurrentPage('login')} icon={<LogIn className="header-button-icon" />}>Login</HeaderButton>
                            <HeaderButton onClick={() => setCurrentPage('register')} icon={<UserPlus className="header-button-icon" />} className="register">Register</HeaderButton>
                        </>
                    )}
                </div>
                {/* Hamburger */}
                <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
                    <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
                    <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
                    <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
                </button>
            </div>
            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="mobile-menu">
                    {isLoggedIn ? (
                        <>
                            <div className="mobile-menu-greeting">Hi, {user?.name}</div>
                            <button className="mobile-menu-item" onClick={goDash}><LayoutDashboard size={16} /> Dashboard</button>
                            <button className="mobile-menu-item danger" onClick={() => { logout(); closeMenu(); }}><LogOut size={16} /> Logout</button>
                        </>
                    ) : (
                        <>
                            <button className="mobile-menu-item" onClick={() => { setCurrentPage('home'); closeMenu(); }}><UtensilsCrossed size={16} /> Home</button>
                            <button className="mobile-menu-item" onClick={() => { setCurrentPage('login'); closeMenu(); }}><LogIn size={16} /> Login</button>
                            <button className="mobile-menu-item accent" onClick={() => { setCurrentPage('register'); closeMenu(); }}><UserPlus size={16} /> Register</button>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}

function HeaderButton({ children, onClick, icon, className = '' }) {
    return (
        <motion.button
            onClick={onClick}
            className={`header-button ${className}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {icon}
            <span>{children}</span>
        </motion.button>
    );
}

function ErrorMessage({ message, onDismiss }) {
    if (!message) return null;
    return (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="message-base error-message" role="alert">
            <div className="message-content">
                <AlertCircle className="message-icon" />
                <span>{message}</span>
            </div>
            {onDismiss && <button onClick={onDismiss} className="message-dismiss-button"><X className="message-icon" /></button>}
        </motion.div>
    );
}

function SuccessMessage({ message, onDismiss }) {
    if (!message) return null;
    return (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="message-base success-message" role="alert">
            <div className="message-content">
                <CheckCircle className="message-icon" />
                <span>{message}</span>
            </div>
            {onDismiss && <button onClick={onDismiss} className="message-dismiss-button"><X className="message-icon" /></button>}
        </motion.div>
    );
}

function LoadingSpinner() {
    return <div className="spinner-page-wrapper"><Loader2 className="spinner-page" /></div>;
}

// --- API Helper Hook ---
function useApi() {
    const { token, logout } = useAuth();

    // Helper function for standard JSON fetches
    const jsonFetch = async (endpoint, options = {}) => {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${BACKEND_URL}${endpoint}`, { ...options, headers });
        return handleResponse(response);
    };

    // Helper function for FormData fetches (used for file uploads)
    const formFetch = async (endpoint, formData, method = 'POST') => {
        const headers = {}; // Content-Type is set automatically by browser for FormData
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: method,
            headers: headers,
            body: formData,
        });
        return handleResponse(response);
    };

    const handleResponse = async (response) => {
        if (response.status === 401) {
            logout();
            throw new Error('Your session has expired. Please log in again.');
        }
        const data = await response.json().catch(() => ({})); // Handle non-JSON response gracefully
        if (!response.ok) {
            throw new Error(data.message || 'An API error occurred');
        }
        return data;
    }

    return { jsonFetch, formFetch };
}
// ============================================================
// --- LANDING PAGE ---
// ============================================================
function LandingPage() {
    const { setCurrentPage } = useAuth();
    const stats = [
        { value: '12,400+', label: 'Meals Donated' },
        { value: '3,200+', label: 'Active Donors' },
        { value: '8,900+', label: 'Families Helped' },
        { value: '18 tons', label: 'Food Saved' },
    ];
    const steps = [
        { icon: <UserPlus size={28} />, title: 'Sign Up Free', desc: 'Create an account as a donor or a food receiver in under 60 seconds.' },
        { icon: <PlusCircle size={28} />, title: 'List or Browse', desc: 'Donors post surplus food with photos. Receivers search & filter by category or location.' },
        { icon: <HeartHandshake size={28} />, title: 'Claim & Connect', desc: 'Receivers claim a slot and coordinate pickup directly with the donor.' },
    ];
    const features = [
        { icon: <MapPin size={22} />, title: 'Location-Based', desc: 'Find donations close to you with detailed address info.' },
        { icon: <Clock size={22} />, title: 'Expiry Tracking', desc: 'Every listing shows MFG & expiry time so food is always fresh.' },
        { icon: <Users2 size={22} />, title: 'Multi-Claim Slots', desc: 'One listing can serve multiple families simultaneously.' },
        { icon: <ClipboardList size={22} />, title: 'My Claims History', desc: 'Track all the food you have claimed in one place.' },
        { icon: <Package size={22} />, title: 'Food Categories', desc: 'Meals, groceries, bakery, dairy — browse exactly what you need.' },
        { icon: <CheckCircle size={22} />, title: 'Verified Listings', desc: 'Photo-backed listings; admins moderate for community trust.' },
    ];

    return (
        <div className="landing">
            {/* ── HERO ── */}
            <section className="hero-section">
                <div className="hero-content">
                    <motion.div
                        className="hero-badge"
                        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    >
                        🌿 100% Free &amp; Community-Powered
                    </motion.div>
                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    >
                        Fight Hunger.<br />
                        <span className="hero-title-accent">Reduce Waste.</span><br />
                        Build Community.
                    </motion.h1>
                    <motion.p
                        className="hero-subtitle"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    >
                        LeftoverLink connects surplus food from homes, restaurants &amp; events with local families and NGOs who need it most — before it goes to waste.
                    </motion.p>
                    <motion.div
                        className="hero-actions"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    >
                        <button className="hero-btn-primary" onClick={() => setCurrentPage('register')}>
                            <UserPlus size={18} /> Get Started Free
                        </button>
                        <button className="hero-btn-secondary" onClick={() => setCurrentPage('login')}>
                            <LogIn size={18} /> Sign In
                        </button>
                    </motion.div>
                </div>
                <motion.div
                    className="hero-illustration"
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
                >
                    <div className="hero-emoji-grid">
                        {['🍱', '🥗', '🍞', '🥛', '🍎', '🍲', '🫙', '🥦', '🍛'].map((e, i) => (
                            <motion.span key={i} className="hero-emoji"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.15 }}
                            >{e}</motion.span>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── STATS ── */}
            <section className="stats-section">
                <div className="stats-inner">
                    {stats.map((s, i) => (
                        <motion.div key={i} className="stat-item"
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                        >
                            <span className="stat-number">{s.value}</span>
                            <span className="stat-label">{s.label}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section className="section-wrapper">
                <h2 className="section-title">How LeftoverLink Works</h2>
                <p className="section-sub">Three simple steps — from surplus to smiles</p>
                <div className="steps-grid">
                    {steps.map((s, i) => (
                        <motion.div key={i} className="step-card"
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                            whileHover={{ y: -6 }}
                        >
                            <div className="step-number">{i + 1}</div>
                            <div className="step-icon">{s.icon}</div>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section className="section-wrapper features-bg">
                <h2 className="section-title">Everything You Need</h2>
                <p className="section-sub">Built specifically for food donation workflows</p>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <motion.div key={i} className="feature-card"
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                            whileHover={{ scale: 1.03 }}
                        >
                            <div className="feature-icon">{f.icon}</div>
                            <div>
                                <h4>{f.title}</h4>
                                <p>{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section className="cta-section">
                <motion.div className="cta-inner"
                    initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                >
                    <UtensilsCrossed size={42} className="cta-icon" />
                    <h2>Ready to make a difference today?</h2>
                    <p>Join thousands of donors and receivers building a hunger-free community.</p>
                    <div className="cta-buttons">
                        <button className="hero-btn-primary" onClick={() => setCurrentPage('register')}>
                            <UserPlus size={18} /> Join as Donor
                        </button>
                        <button className="hero-btn-outline" onClick={() => setCurrentPage('register')}>
                            <HeartHandshake size={18} /> Join as Receiver
                        </button>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}

// --- Auth Pages (Login, Register) ---
function LoginPage() {
    const { login, setCurrentPage } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdminLoading, setIsAdminLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {

            await login(email, password);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleAdminLogin = async () => {
        setError(null);
        setIsAdminLoading(true);
        try {
            // NOTE: Hardcoded admin credentials for demo purposes
            await login("admin@gmail.com", "adminbalu");
        } catch (err) {
            setError("Admin login failed. Check credentials or server.");
            setIsAdminLoading(false);
        }
    };


    return (
        <PageWrapper>
            <AuthCard title="Sign in to your account">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-form-inputs">
                        <AnimatePresence>
                            <ErrorMessage message={error} onDismiss={() => setError(null)} />
                        </AnimatePresence>
                        <Input id="email-address" name="email" type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button type="submit" isLoading={isLoading}><LogIn className="button-icon" />Sign in</Button>
                    <div className="auth-form-footer">
                        <button type="button" onClick={() => setCurrentPage('register')}>Need an account? Register</button>
                    </div>

                    <Button
                        type="button"
                        className="button-admin-login"
                        isLoading={isAdminLoading}
                        onClick={handleAdminLogin}
                    >
                        <Users className="button-icon" />
                        Login as Admin
                    </Button>
                </form>
            </AuthCard>
        </PageWrapper>
    );
}

function RegisterPage() {
    const { register, setCurrentPage } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Receiver');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (email === "admin@gmail.com") {
            setError("This email is reserved. Please use another.");
            return;
        }
        setError(null);
        setIsLoading(true);
        try {
            await register(name, email, password, role);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <PageWrapper>
            <AuthCard title="Create your account">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-form-inputs">
                        <AnimatePresence>
                            <ErrorMessage message={error} onDismiss={() => setError(null)} />
                        </AnimatePresence>
                        <Input id="name" name="name" type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                        <Input id="email-address" name="email" type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="Receiver">I am a Receiver</option>
                            <option value="Donor">I am a Donor</option>
                        </Select>
                    </div>
                    <Button type="submit" isLoading={isLoading}><UserPlus className="button-icon" />Create Account</Button>
                    <div className="auth-form-footer">
                        <button type="button" onClick={() => setCurrentPage('login')}>Already have an account? Sign in</button>
                    </div>
                </form>
            </AuthCard>
        </PageWrapper>
    );
}

// --- Shared UI Component: FormInput ---
const FormInput = React.forwardRef(({
    label,
    id,
    type = 'text',
    placeholder,
    value,
    onChange,
    required = false,
    min,
    ...props
}, ref) => {

    // Determine input element based on type
    const InputElement = type === 'textarea' ? 'textarea' : 'input';

    return (
        <div className="form-group">
            <label htmlFor={id} className="form-label">{label}</label>
            <InputElement
                ref={ref}
                id={id}
                name={id}
                type={type}
                placeholder={placeholder}
                value={type !== 'file' ? value : undefined}
                onChange={type !== 'file' ? onChange : undefined}
                required={required}
                min={min}
                className={type === 'textarea' ? "form-textarea" : "form-input"}
                {...props}
            />
        </div>
    );
});
FormInput.displayName = 'FormInput';

// --- Shared UI Component: FoodCard ---
const CATEGORY_COLORS = {
    'Cooked Meal': { bg: '#E8F5E9', color: '#2E7D32' },
    'Groceries': { bg: '#E3F2FD', color: '#1565C0' },
    'Fruits & Vegetables': { bg: '#F3E5F5', color: '#6A1B9A' },
    'Bakery': { bg: '#FFF3E0', color: '#E65100' },
    'Dairy': { bg: '#E0F7FA', color: '#006064' },
    'Beverages': { bg: '#FCE4EC', color: '#AD1457' },
    'Other': { bg: '#F5F5F5', color: '#424242' },
};

function FoodCard({ listing, onDelete, onEdit, showDelete, showEdit, onClaim }) {
    const { user } = useAuth();
    const isExpired = new Date(listing.expiryTime) < new Date();
    const isFullyClaimed = listing.claims.length >= listing.maxClaims;
    const isClaimedByUser = user && listing.claims.some(claim => claim.userId.toString() === user._id.toString());
    const catStyle = CATEGORY_COLORS[listing.category] || CATEGORY_COLORS['Other'];
    const remainingClaims = listing.maxClaims - listing.claims.length;

    return (
        <motion.div
            className={`food-card ${isExpired ? 'card-expired' : ''} ${isFullyClaimed && !isExpired ? 'card-fully-claimed' : ''}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <div className="card-image-container">
                <img
                    src={listing.imageUrl || 'https://placehold.co/600x400/a7a7a7/FFF?text=No+Image'}
                    alt={listing.description}
                    className="card-image"
                />
                {listing.category && (
                    <span className="card-category-badge" style={{ background: catStyle.bg, color: catStyle.color }}>
                        {listing.category}
                    </span>
                )}
                {(isExpired || isFullyClaimed) && (
                    <div className="card-status-overlay">
                        {isExpired ? 'EXPIRED' : 'FULLY CLAIMED'}
                    </div>
                )}
            </div>
            <div className="card-content">
                <h3 className="card-title">{listing.description}</h3>
                <div className="card-details">
                    <p><Package className="detail-icon" /> Quantity: <strong>{listing.quantity}</strong></p>
                    <p><MapPin className="detail-icon" /> Location: <strong>{listing.location}</strong></p>
                    <p><CalendarDays className="detail-icon" /> Expiry: <strong>{new Date(listing.expiryTime).toLocaleString()}</strong></p>
                    <p><Users2 className="detail-icon" /> Slots: <strong>{remainingClaims} of {listing.maxClaims} remaining</strong></p>

                    {onClaim && (
                        <p className={isClaimedByUser ? 'claimed-status' : 'unclaimed-status'}>
                            {isClaimedByUser ? (<><CheckCircle className="detail-icon" /> Claimed by you!</>) : ''}
                        </p>
                    )}

                    {(showDelete || showEdit) && (
                        <div className="card-claims-list">
                            <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Current Claims ({listing.claims.length}):</p>
                            <ul>
                                {listing.claims.map((claim, index) => (
                                    <li key={index}>{claim.name}</li>
                                ))}
                                {listing.claims.length === 0 && <li>No claims yet.</li>}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            <div className="card-actions">
                {onClaim && (
                    <Button
                        onClick={onClaim}
                        disabled={isExpired || isFullyClaimed || isClaimedByUser}
                        className="button-claim"

                    >
                        {isClaimedByUser ? 'Already Claimed' : (isFullyClaimed ? 'Fully Claimed' : 'Claim Food')}
                    </Button>
                )}

                {(showEdit && onEdit) && (
                    <Button onClick={onEdit} className="button-secondary button-edit-delete"><Edit3 /></Button>
                )}

                {(showDelete && onDelete) && (
                    <Button onClick={onDelete} className="button-danger button-edit-delete"><Trash2 /></Button>
                )}
            </div>
        </motion.div>
    );
}

// --- Donor Dashboard Components (Add/Edit) ---
const FOOD_CATEGORIES = ['Cooked Meal', 'Groceries', 'Fruits & Vegetables', 'Bakery', 'Dairy', 'Beverages', 'Other'];

function AddFoodListingForm({ onListingCreated }) {
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState('Cooked Meal');
    const [mfgTime, setMfgTime] = useState('');
    const [expiryTime, setExpiryTime] = useState('');
    const [maxClaims, setMaxClaims] = useState(1);
    const imageRef = useRef(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { formFetch } = useApi();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (maxClaims < 1) {
            setError("Maximum claims must be 1 or more.");
            return;
        }
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('description', description);
        formData.append('quantity', quantity);
        formData.append('location', location);
        formData.append('category', category);
        formData.append('mfgTime', mfgTime);
        formData.append('expiryTime', expiryTime);
        formData.append('maxClaims', maxClaims);

        if (imageRef.current && imageRef.current.files[0]) {
            formData.append('image', imageRef.current.files[0]);
        }

        try {
            await formFetch('/food', formData, 'POST');
            setSuccess('Listing created successfully!');

            // Reset form fields
            setDescription(''); setQuantity(''); setLocation(''); setCategory('Cooked Meal'); setMfgTime(''); setExpiryTime(''); setMaxClaims(1);
            if (imageRef.current) imageRef.current.value = null;

            onListingCreated();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div className="add-food-form-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2>Create New Food Listing</h2>
            <form onSubmit={handleSubmit}>
                <AnimatePresence>
                    <ErrorMessage message={error} onDismiss={() => setError(null)} />
                    <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />
                </AnimatePresence>

                <FormInput label="Description" id="description" type="text" placeholder="e.g., 10 vegetable curry meals" value={description} onChange={(e) => setDescription(e.target.value)} required={true} />

                <div className="form-group">
                    <label className="form-label" htmlFor="category">Category</label>
                    <select id="category" className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                        {FOOD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="form-group-grid">
                    <FormInput label="Quantity" id="quantity" type="text" placeholder="e.g., 10 packets, 5 kg" value={quantity} onChange={(e) => setQuantity(e.target.value)} required={true} />
                    <FormInput label="Maximum Claims" id="maxClaims" type="number" min="1" placeholder="1" value={maxClaims} onChange={(e) => setMaxClaims(parseInt(e.target.value, 10) || 1)} required={true} />
                </div>

                <FormInput label="Pickup Location" id="location" type="text" placeholder="Full address" value={location} onChange={(e) => setLocation(e.target.value)} required={true} />

                <FormInput label="Image File" id="image" type="file" ref={imageRef} accept="image/*" required={false} />

                <div className="form-group-grid">
                    <FormInput label="Manufacture Time" id="mfgTime" type="datetime-local" value={mfgTime} onChange={(e) => setMfgTime(e.target.value)} required={true} />
                    <FormInput label="Expiry Time" id="expiryTime" type="datetime-local" value={expiryTime} onChange={(e) => setExpiryTime(e.target.value)} required={true} />
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                    <Button type="submit" isLoading={isLoading}><PlusCircle className="button-icon" />Add Listing</Button>
                </div>
            </form>
        </motion.div>
    );
}

function EditFoodListingForm({ listing, onListingUpdated, onCancel }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
    };

    const [description, setDescription] = useState(listing.description);
    const [quantity, setQuantity] = useState(listing.quantity);
    const [location, setLocation] = useState(listing.location);
    const [category, setCategory] = useState(listing.category || 'Other');
    const [mfgTime, setMfgTime] = useState(formatDate(listing.mfgTime));
    const [expiryTime, setExpiryTime] = useState(formatDate(listing.expiryTime));
    const [maxClaims, setMaxClaims] = useState(listing.maxClaims);
    const imageRef = useRef(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { formFetch } = useApi();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (maxClaims < 1) {
            setError("Maximum claims must be 1 or more.");
            return;
        }
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('description', description);
        formData.append('quantity', quantity);
        formData.append('location', location);
        formData.append('category', category);
        formData.append('mfgTime', mfgTime);
        formData.append('expiryTime', expiryTime);
        formData.append('maxClaims', maxClaims);

        if (imageRef.current && imageRef.current.files[0]) {
            formData.append('image', imageRef.current.files[0]);
        }

        try {
            const updatedListing = await formFetch(`/food/${listing._id}`, formData, 'PUT');
            setSuccess('Listing updated successfully!');
            onListingUpdated(updatedListing);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div className="add-food-form-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2>Edit Food Listing: {listing.description}</h2>
            <form onSubmit={handleSubmit}>
                <AnimatePresence>
                    <ErrorMessage message={error} onDismiss={() => setError(null)} />
                    <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />
                </AnimatePresence>

                <FormInput label="Description" id="description-edit" type="text" placeholder="e.g., 10 vegetable curry meals" value={description} onChange={(e) => setDescription(e.target.value)} required={true} />

                <div className="form-group">
                    <label className="form-label" htmlFor="category-edit">Category</label>
                    <select id="category-edit" className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                        {FOOD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="form-group-grid">
                    <FormInput label="Quantity" id="quantity-edit" type="text" placeholder="e.g., 10 packets, 5 kg" value={quantity} onChange={(e) => setQuantity(e.target.value)} required={true} />
                    <FormInput label="Maximum Claims" id="maxClaims-edit" type="number" min="1" placeholder="1" value={maxClaims} onChange={(e) => setMaxClaims(parseInt(e.target.value, 10) || 1)} required={true} />
                </div>

                <FormInput label="Pickup Location" id="location-edit" type="text" placeholder="Full address" value={location} onChange={(e) => setLocation(e.target.value)} required={true} />

                <FormInput
                    label="Image File (Leave blank to keep current)"
                    id="image-edit"
                    type="file"
                    ref={imageRef}
                    accept="image/*"
                    required={false}
                />

                {listing.imageUrl && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', paddingLeft: '0.2rem' }}>Current Image: <a href={listing.imageUrl} target="_blank" rel="noopener noreferrer">View</a></p>}

                <div className="form-group-grid">
                    <FormInput label="Manufacture Time" id="mfgTime-edit" type="datetime-local" value={mfgTime} onChange={(e) => setMfgTime(e.target.value)} required={true} />
                    <FormInput label="Expiry Time" id="expiryTime-edit" type="datetime-local" value={expiryTime} onChange={(e) => setExpiryTime(e.target.value)} required={true} />
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <Button type="submit" isLoading={isLoading} className="button-primary"><Edit3 className="button-icon" />Update Listing</Button>
                    <Button type="button" onClick={onCancel} className="button-secondary">Cancel</Button>
                </div>
            </form>
        </motion.div>
    );
}

// -------------------------------------------------------------------------------- //
// --- 3. Donor Dashboard (COMPLETED) ---
// -------------------------------------------------------------------------------- //
function DonorDashboard() {
    const [view, setView] = useState('view');
    const [listingToEdit, setListingToEdit] = useState(null);
    const [myListings, setMyListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { jsonFetch } = useApi();

    const fetchMyListings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // API call to fetch donor's own listings
            const data = await jsonFetch('/food/mylistings');
            setMyListings(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleListingCreatedOrUpdated = () => {
        setView('view'); // Switch back to view mode after success
        setListingToEdit(null); // Clear editing state
        fetchMyListings(); // Refresh the list
    };

    const handleDeleteListing = async (listingId) => {
        if (!window.confirm("Are you sure you want to delete this food listing? This action cannot be undone.")) return;

        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            await jsonFetch(`/food/${listingId}`, { method: 'DELETE' });
            setSuccessMessage('Listing deleted successfully!');
            fetchMyListings(); // Full refresh
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyListings();
    }, []);

    const renderContent = () => {
        if (view === 'add') {
            return (
                <AddFoodListingForm
                    onListingCreated={() => {
                        setSuccessMessage('Listing created successfully!');
                        handleListingCreatedOrUpdated();
                    }}
                />
            );
        }

        if (view === 'edit' && listingToEdit) {
            return (
                <EditFoodListingForm
                    listing={listingToEdit}
                    onListingUpdated={(updatedListing) => {
                        setSuccessMessage('Listing updated successfully!');
                        // Optimistically update the list with the new data
                        setMyListings(myListings.map(l => l._id === updatedListing._id ? updatedListing : l));
                        handleListingCreatedOrUpdated();
                    }}
                    onCancel={() => setView('view')}
                />
            );
        }

        // Default view: list of donor's food listings
        if (isLoading) return <LoadingSpinner />;

        return (
            <>
                <div className="dashboard-actions">
                    <Button onClick={() => setView('add')} className="button-success">
                        <PlusCircle className="button-icon" /> Add New Listing
                    </Button>
                </div>

                <AnimatePresence>
                    <ErrorMessage message={error} onDismiss={() => setError(null)} />
                    <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage(null)} />
                </AnimatePresence>

                <h2 className="dashboard-title">My Current Food Listings</h2>

                {myListings.length === 0 ? (
                    <div className="empty-state">
                        <Package />
                        <p>You haven't posted any food listings yet. Start sharing!</p>
                    </div>
                ) : (
                    <div className="food-list-grid">
                        <AnimatePresence>
                            {myListings.map(listing => (
                                <FoodCard
                                    key={listing._id}
                                    listing={listing}
                                    showDelete={true}
                                    showEdit={true}
                                    onDelete={() => handleDeleteListing(listing._id)}
                                    onEdit={() => {
                                        setListingToEdit(listing);
                                        setView('edit');
                                    }}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </>
        );
    };

    return (
        <PageWrapper>
            <h1 className="page-header"><HeartHandshake className="header-icon" /> Donor Dashboard</h1>
            <div className="dashboard-container">
                {renderContent()}
            </div>
        </PageWrapper>
    );
}

// -------------------------------------------------------------------------------- //
// --- 4. Receiver Dashboard ---
// -------------------------------------------------------------------------------- //
function ReceiverDashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState('browse'); // 'browse' | 'myclaims'
    const [allListings, setAllListings] = useState([]);
    const [myClaims, setMyClaims] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const { jsonFetch } = useApi();

    const fetchAll = async () => {
        setIsLoading(true); setError(null);
        try {
            const [listData, claimData] = await Promise.all([
                jsonFetch('/food'),
                jsonFetch('/food/myclaims'),
            ]);
            setAllListings(listData);
            setMyClaims(claimData);
        } catch (err) { setError(err.message); }
        finally { setIsLoading(false); }
    };

    const handleClaimFood = async (listingId) => {
        setError(null); setSuccessMessage(null);
        try {
            const data = await jsonFetch(`/food/${listingId}/claim`, { method: 'PUT' });
            setSuccessMessage('Food claimed successfully! Contact the donor for pickup details.');
            setAllListings(prev => prev.map(l => l._id === listingId ? data.listing : l));
            setMyClaims(prev => prev.some(l => l._id === listingId) ? prev : [...prev, data.listing]);
        } catch (err) { setError(err.message); }
    };

    useEffect(() => { fetchAll(); }, []);

    const allCategories = ['All', ...FOOD_CATEGORIES];
    const filtered = allListings.filter(l => {
        const matchSearch = l.description.toLowerCase().includes(search.toLowerCase()) ||
            l.location.toLowerCase().includes(search.toLowerCase()) ||
            l.donorName?.toLowerCase().includes(search.toLowerCase());
        const matchCat = catFilter === 'All' || l.category === catFilter;
        return matchSearch && matchCat;
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <PageWrapper>
            <h1 className="page-header"><List className="header-icon" /> Food Listings</h1>

            {/* Tabs */}
            <div className="tab-bar">
                <button className={`tab-btn${tab === 'browse' ? ' active' : ''}`} onClick={() => setTab('browse')}>
                    <Package size={15} /> Browse Available
                </button>
                <button className={`tab-btn${tab === 'myclaims' ? ' active' : ''}`} onClick={() => setTab('myclaims')}>
                    <ClipboardList size={15} /> My Claims
                    {myClaims.length > 0 && <span className="tab-badge">{myClaims.length}</span>}
                </button>
            </div>

            <div className="dashboard-container">
                <AnimatePresence>
                    {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
                    {successMessage && <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage(null)} />}
                </AnimatePresence>

                {tab === 'browse' && (
                    <>
                        {/* Search */}
                        <div className="search-bar-wrapper">
                            <span className="search-icon-wrap"><MapPin size={16} /></span>
                            <input
                                className="search-input"
                                placeholder="Search by description, location or donor name…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && <button className="search-clear" onClick={() => setSearch('')}><X size={14} /></button>}
                        </div>
                        {/* Category filter chips */}
                        <div className="filter-chips">
                            {allCategories.map(cat => (
                                <button
                                    key={cat}
                                    className={`filter-chip${catFilter === cat ? ' active' : ''}`}
                                    onClick={() => setCatFilter(cat)}
                                >{cat}</button>
                            ))}
                        </div>

                        {filtered.length === 0 ? (
                            <div className="empty-state">
                                <Package />
                                <p>{search || catFilter !== 'All' ? 'No listings match your search.' : 'No active food listings right now. Check back soon!'}</p>
                            </div>
                        ) : (
                            <div className="food-list-grid">
                                <AnimatePresence>
                                    {filtered.map(listing => (
                                        <FoodCard
                                            key={listing._id}
                                            listing={listing}
                                            onClaim={() => handleClaimFood(listing._id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}

                {tab === 'myclaims' && (
                    <>
                        {myClaims.length === 0 ? (
                            <div className="empty-state">
                                <ClipboardList />
                                <p>You haven't claimed any food yet. Browse available listings!</p>
                            </div>
                        ) : (
                            <div className="food-list-grid">
                                <AnimatePresence>
                                    {myClaims.map(listing => (
                                        <FoodCard key={listing._id} listing={listing} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageWrapper>
    );
}


// -------------------------------------------------------------------------------- //
// --- 5. Admin Dashboard (COMPLETED) ---
// -------------------------------------------------------------------------------- //
function StatCard({ title, value, icon, className }) {
    return (
        <motion.div className={`stat-card ${className}`} whileHover={{ scale: 1.02 }}>
            <div className="stat-icon-container">{icon}</div>
            <div className="stat-content">
                <p className="stat-value">{value}</p>
                <h3 className="stat-title">{title}</h3>
            </div>
        </motion.div>
    );
}

function UserListTable({ users }) {
    return (
        <div className="admin-table-card">
            <h3>Registered Users</h3>
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Registered</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td><span className={`role-tag role-${user.role.toLowerCase()}`}>{user.role}</span></td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {users.length === 0 && <tr><td colSpan="4">No users found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ListingListTable({ listings, onDelete }) {
    return (
        <div className="admin-table-card">
            <h3>All Food Listings</h3>
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Donor</th>
                            <th>Status</th>
                            <th>Expires</th>
                            <th>Claims</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listings.map(listing => {
                            const isExpired = new Date(listing.expiryTime) < new Date();
                            const isFullyClaimed = listing.claims.length >= listing.maxClaims;
                            return (
                                <tr key={listing._id} className={isExpired ? 'expired-row' : ''}>
                                    <td>{listing.description}</td>
                                    <td>{listing.donorName || 'N/A'}</td>
                                    <td>
                                        {isExpired ? <span className="status-tag status-expired">Expired</span> :
                                            (isFullyClaimed ? <span className="status-tag status-claimed">Full</span> :
                                                <span className="status-tag status-active">Active</span>)}
                                    </td>
                                    <td>{new Date(listing.expiryTime).toLocaleString()}</td>
                                    <td>{listing.claims.length}/{listing.maxClaims}</td>
                                    <td>
                                        <Button onClick={() => onDelete(listing._id)} className="button-icon-only button-danger" title="Delete Listing">
                                            <Trash2 />
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                        {listings.length === 0 && <tr><td colSpan="6">No listings found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const { jsonFetch } = useApi();

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch All Users - Requires Admin endpoint
            const usersData = await jsonFetch('/admin/users');
            setUsers(usersData);

            // Fetch All Listings - Requires Admin endpoint
            const listingsData = await jsonFetch('/admin/listings');
            setListings(listingsData);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteListing = async (listingId) => {
        if (!window.confirm("Admin: Are you sure you want to delete this food listing?")) return;

        setError(null);
        setSuccessMessage(null);

        try {
            // Delete listing via standard food route (admin role is allowed)
            await jsonFetch(`/food/${listingId}`, { method: 'DELETE' });
            setSuccessMessage('Listing deleted successfully by Admin.');
            setListings(prev => prev.filter(l => l._id !== listingId)); // Optimistic update
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading) return <LoadingSpinner />;

    return (
        <PageWrapper>
            <h1 className="page-header"><LayoutDashboard className="header-icon" /> Admin Dashboard</h1>
            <div className="dashboard-container admin-dashboard">
                <AnimatePresence>
                    <ErrorMessage message={error} onDismiss={() => setError(null)} />
                    <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage(null)} />
                </AnimatePresence>

                <div className="admin-stats-grid">
                    <StatCard title="Total Users" value={users.length} icon={<Users />} className="stat-users" />
                    <StatCard title="Total Donors" value={users.filter(u => u.role === 'Donor').length} icon={<HeartHandshake />} className="stat-donors" />
                    <StatCard title="Total Listings" value={listings.length} icon={<Package />} className="stat-listings" />
                    <StatCard title="Active Listings" value={listings.filter(l => new Date(l.expiryTime) > new Date()).length} icon={<CheckCircle />} className="stat-active" />
                </div>

                <div className="admin-tables-container">
                    <UserListTable users={users} />
                    <ListingListTable listings={listings} onDelete={handleDeleteListing} />
                </div>
            </div>
        </PageWrapper>
    );
}