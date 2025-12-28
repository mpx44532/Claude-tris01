// Supabase configuration
const SUPABASE_URL = 'https://zdkdvwyhorvmbkvltuci.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpka2R2d3lob3J2bWJrdmx0dWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjg1NDIsImV4cCI6MjA4MjMwNDU0Mn0.o76qtSYUlFSf3FfNIaZBe9wQreQ4JBe-1WugpemzCqs';

// Initialize Supabase client using the global library
// Store the library reference first to avoid naming conflicts
const supabaseLib = window.supabase;
const supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client initialized:', supabase ? 'Success' : 'Failed');

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
