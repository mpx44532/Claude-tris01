// Supabase configuration
const SUPABASE_URL = 'https://zdkdvwyhorvmbkvltuci.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpka2R2d3lob3J2bWJrdmx0dWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjg1NDIsImV4cCI6MjA4MjMwNDU0Mn0.o76qtSYUlFSf3FfNIaZBe9wQreQ4JBe-1WugpemzCqs';

// Initialize Supabase client - wait for library to load
let supabase;

// Function to initialize Supabase when library is ready
function initSupabase() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized successfully');
        return true;
    }
    return false;
}

// Try to initialize immediately
if (!initSupabase()) {
    // If not ready, wait for window load
    window.addEventListener('load', function() {
        if (!initSupabase()) {
            console.error('Failed to load Supabase library from CDN');
            alert('Error: Supabase library failed to load. Please refresh the page.');
        }
    });
}

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
