// Admin page logic

let adminUser = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in as admin
    const user = getCurrentUser();
    if (user && user.is_admin) {
        adminUser = user;
        showAdminDashboard();
    } else {
        showAdminLogin();
    }
});

function showAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';

    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    document.getElementById('cancelAdminLogin').addEventListener('click', () => {
        window.location.href = 'login.html';
    });
}

async function handleAdminLogin(e) {
    e.preventDefault();

    const nickname = document.getElementById('adminNickname').value.trim();
    const password = document.getElementById('adminPassword').value;

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('nickname', nickname)
            .eq('password', password)
            .eq('is_admin', true)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            adminUser = data;
            setCurrentUser(data);
            showAdminDashboard();
        } else {
            alert('Invalid admin credentials');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Login failed. Please try again.');
    }
}

function showAdminDashboard() {
    document.getElementById('adminLoginModal').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';

    document.getElementById('adminUsername').textContent = adminUser.nickname;

    // Setup event listeners
    document.getElementById('adminLogoutBtn').addEventListener('click', adminLogout);
    document.getElementById('refreshBtn').addEventListener('click', loadAllResults);

    // Load data
    loadStatistics();
    loadAllResults();

    // Auto-refresh every 10 seconds
    setInterval(() => {
        loadStatistics();
        loadAllResults();
    }, 10000);
}

function adminLogout() {
    clearCurrentUser();
    adminUser = null;
    window.location.href = 'login.html';
}

async function loadStatistics() {
    try {
        // Total games
        const { count: totalGamesCount, error: gamesError } = await supabase
            .from('game_results')
            .select('*', { count: 'exact', head: true });

        if (gamesError) throw gamesError;

        // Total players (non-admin)
        const { count: totalPlayersCount, error: playersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('is_admin', false);

        if (playersError) throw playersError;

        // Active games
        const { count: activeGamesCount, error: activeError } = await supabase
            .from('games')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending', 'active']);

        if (activeError) throw activeError;

        // Completed games
        const { count: completedGamesCount, error: completedError } = await supabase
            .from('games')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        if (completedError) throw completedError;

        // Update UI
        document.getElementById('totalGames').textContent = totalGamesCount || 0;
        document.getElementById('totalPlayers').textContent = totalPlayersCount || 0;
        document.getElementById('activeGames').textContent = activeGamesCount || 0;
        document.getElementById('completedGames').textContent = completedGamesCount || 0;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function loadAllResults() {
    try {
        const { data, error } = await supabase
            .from('game_results')
            .select(`
                *,
                challenger:challenger_id(nickname),
                defender:defender_id(nickname),
                winner:winner_id(nickname)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const resultsDiv = document.getElementById('allResults');

        if (!data || data.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">No game results found.</p>';
            return;
        }

        let tableHTML = `
            <table class="results-table admin-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Challenger</th>
                        <th>Defender</th>
                        <th>Result</th>
                        <th>Winner</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(result => {
            const date = new Date(result.created_at).toLocaleString();
            const challenger = result.challenger.nickname;
            const defender = result.defender.nickname;

            let resultText = '';
            let winner = '-';

            if (result.result === 'aborted') {
                resultText = 'Aborted';
            } else if (result.result === 'draw') {
                resultText = 'Draw';
            } else if (result.result === 'win') {
                resultText = 'Win';
                winner = result.winner.nickname;
            }

            tableHTML += `
                <tr>
                    <td>${date}</td>
                    <td>${challenger}</td>
                    <td>${defender}</td>
                    <td class="result-${resultText.toLowerCase()}">${resultText}</td>
                    <td>${winner}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        resultsDiv.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('allResults').innerHTML = '<p class="error">Error loading results.</p>';
    }
}
