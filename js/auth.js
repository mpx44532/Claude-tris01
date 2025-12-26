// Authentication logic for login/register

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const nicknameInput = document.getElementById('nickname');
    const passwordInput = document.getElementById('password');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const loginBtn = document.getElementById('loginBtn');
    const infoText = document.getElementById('infoText');

    let isNewUser = false;
    let checkingUser = false;

    // Check if user exists when nickname field loses focus
    nicknameInput.addEventListener('blur', async function() {
        const nickname = nicknameInput.value.trim();

        if (!nickname || checkingUser) return;

        checkingUser = true;
        infoText.textContent = 'Checking user...';

        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, nickname')
                .eq('nickname', nickname)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                // Existing user
                isNewUser = false;
                confirmPasswordGroup.style.display = 'none';
                confirmPasswordInput.removeAttribute('required');
                infoText.textContent = 'Welcome back!';
                loginBtn.textContent = 'Login';
            } else {
                // New user
                isNewUser = true;
                confirmPasswordGroup.style.display = 'block';
                confirmPasswordInput.setAttribute('required', 'required');
                infoText.textContent = 'New user - please confirm your password';
                loginBtn.textContent = 'Register';
            }
        } catch (error) {
            console.error('Error checking user:', error);
            infoText.textContent = 'Error checking user. Please try again.';
        } finally {
            checkingUser = false;
        }
    });

    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nickname = nicknameInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!nickname || !password) {
            alert('Please enter nickname and password');
            return;
        }

        if (isNewUser) {
            // Register new user
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            if (password.length < 4) {
                alert('Password must be at least 4 characters');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('users')
                    .insert([
                        { nickname: nickname, password: password, is_admin: false }
                    ])
                    .select()
                    .single();

                if (error) {
                    if (error.code === '23505') { // Unique constraint violation
                        alert('This nickname is already taken');
                    } else {
                        throw error;
                    }
                    return;
                }

                // Save user to session
                setCurrentUser(data);
                alert('Registration successful! Welcome, ' + nickname);
                window.location.href = 'game.html';
            } catch (error) {
                console.error('Error registering:', error);
                alert('Registration failed. Please try again.');
            }
        } else {
            // Login existing user
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('nickname', nickname)
                    .eq('password', password)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    // Save user to session
                    setCurrentUser(data);
                    window.location.href = 'game.html';
                } else {
                    alert('Invalid password');
                }
            } catch (error) {
                console.error('Error logging in:', error);
                alert('Login failed. Please try again.');
            }
        }
    });

    // Clear session on page load
    clearCurrentUser();
});
