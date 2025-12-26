// Supabase configuration
// Replace these values with your actual Supabase project credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to get current user from session storage
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Helper function to set current user in session storage
function setCurrentUser(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

// Helper function to clear current user
function clearCurrentUser() {
    sessionStorage.removeItem('currentUser');
}

// Check if user is logged in
function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// Check if user is admin
function requireAdmin() {
    const user = getCurrentUser();
    if (!user || !user.is_admin) {
        alert('Admin access required');
        window.location.href = 'login.html';
        return null;
    }
    return user;
}
