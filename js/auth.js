// Authentication logic for login/register

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const nicknameInput = document.getElementById('nickname');
    const passwordInput = document.getElementById('password');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    const infoText = document.getElementById('infoText');
    const loginModeBtn = document.getElementById('loginModeBtn');
    const registerModeBtn = document.getElementById('registerModeBtn');

    let isRegisterMode = false;

    // Toggle between login and register mode
    loginModeBtn.addEventListener('click', function() {
        isRegisterMode = false;
        loginModeBtn.classList.add('active');
        registerModeBtn.classList.remove('active');
        confirmPasswordGroup.style.display = 'none';
        confirmPasswordInput.removeAttribute('required');
        submitBtn.textContent = 'Login';
        infoText.textContent = '';
    });

    registerModeBtn.addEventListener('click', function() {
        isRegisterMode = true;
        registerModeBtn.classList.add('active');
        loginModeBtn.classList.remove('active');
        confirmPasswordGroup.style.display = 'block';
        confirmPasswordInput.setAttribute('required', 'required');
        submitBtn.textContent = 'Register';
        infoText.textContent = 'Enter your details to register or update password';
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

        if (isRegisterMode) {
            // Register mode: Insert new user or update existing user's password
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            if (password.length < 4) {
                alert('Password must be at least 4 characters');
                return;
            }

            try {
                // Check if user exists
                const { data: existingUser, error: checkError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('nickname', nickname)
                    .maybeSingle();

                if (checkError) throw checkError;

                if (existingUser) {
                    // User exists - update password
                    const { data, error } = await supabase
                        .from('users')
                        .update({ password: password })
                        .eq('nickname', nickname)
                        .select()
                        .single();

                    if (error) throw error;

                    setCurrentUser(data);
                    alert('Password updated successfully! Welcome back, ' + nickname);
                    window.location.href = 'game.html';
                } else {
                    // New user - insert
                    const { data, error } = await supabase
                        .from('users')
                        .insert([
                            { nickname: nickname, password: password, is_admin: false }
                        ])
                        .select()
                        .single();

                    if (error) throw error;

                    setCurrentUser(data);
                    alert('Registration successful! Welcome, ' + nickname);
                    window.location.href = 'game.html';
                }
            } catch (error) {
                console.error('Error in register mode:', error);
                alert('Registration/Update failed. Please try again.');
            }
        } else {
            // Login mode: Authenticate existing user
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('nickname', nickname)
                    .eq('password', password)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setCurrentUser(data);
                    window.location.href = 'game.html';
                } else {
                    alert('Invalid nickname or password');
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
