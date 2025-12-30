// Game logic for multiplayer tic-tac-toe

let currentUser = null;
let currentGame = null;
let pendingMove = null;
let lastMoveIndex = null;
let lastCheckedChallenges = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    currentUser = requireAuth();
    if (!currentUser) return;

    // Display username
    document.getElementById('currentUsername').textContent = currentUser.nickname;

    // Setup event listeners
    setupEventListeners();

    // Load initial data
    await loadOpponents();
    await checkPendingChallenges();
    await loadGamesList();
    await loadPlayerResults();

    // Set up auto-refresh for games list and challenges (every 5 seconds)
    setInterval(async () => {
        await loadGamesList();
        await checkForNewChallenges();
        if (currentGame) {
            await refreshCurrentGame();
        }
    }, 5000);
});

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('challengeBtn').addEventListener('click', sendChallenge);
    document.getElementById('confirmTurnBtn').addEventListener('click', confirmTurn);
    document.getElementById('cancelGameBtn').addEventListener('click', cancelGame);
    document.getElementById('backToListBtn').addEventListener('click', backToGamesList);

    // Setup board cell listeners
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => handleCellClick(index));
        cell.addEventListener('dblclick', () => handleCellDoubleClick(index));
    });
}

function logout() {
    clearCurrentUser();
    window.location.href = 'login.html';
}

// Load list of opponents
async function loadOpponents() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, nickname')
            .neq('id', currentUser.id)
            .eq('is_admin', false)
            .order('nickname');

        if (error) throw error;

        const select = document.getElementById('opponentSelect');
        select.innerHTML = '<option value="">-- Select Player --</option>';

        data.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.nickname;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading opponents:', error);
    }
}

// Check for pending challenges when user logs in
async function checkPendingChallenges() {
    try {
        const { data, error } = await supabase
            .from('games')
            .select(`
                id,
                status,
                challenger:challenger_id(nickname)
            `)
            .eq('defender_id', currentUser.id)
            .eq('status', 'pending');

        if (error) throw error;

        if (data && data.length > 0) {
            // Store these challenge IDs so we don't alert again
            lastCheckedChallenges = data.map(g => g.id);

            const challenges = data.map(g => g.challenger.nickname).join(', ');
            const accept = confirm(`You have ${data.length} pending challenge(s) from: ${challenges}\n\nView your games now?`);

            if (accept && data.length === 1) {
                // If only one challenge, auto-load it
                await loadGame(data[0].id);
            }
        }
    } catch (error) {
        console.error('Error checking challenges:', error);
    }
}

// Check for new challenges (called during auto-refresh)
async function checkForNewChallenges() {
    try {
        const { data, error } = await supabase
            .from('games')
            .select(`
                id,
                status,
                challenger:challenger_id(nickname)
            `)
            .eq('defender_id', currentUser.id)
            .eq('status', 'pending');

        if (error) throw error;

        if (data && data.length > 0) {
            // Find new challenges that weren't in the last check
            const newChallenges = data.filter(g => !lastCheckedChallenges.includes(g.id));

            if (newChallenges.length > 0) {
                // Update the tracked challenges
                lastCheckedChallenges = data.map(g => g.id);

                // Alert user about new challenges
                const challengerNames = newChallenges.map(g => g.challenger.nickname).join(', ');
                const accept = confirm(`New challenge(s) from: ${challengerNames}\n\nView your games now?`);

                if (accept) {
                    // If viewing a game, go back to list
                    if (currentGame) {
                        backToGamesList();
                    }
                    // If only one new challenge, auto-load it
                    if (newChallenges.length === 1) {
                        await loadGame(newChallenges[0].id);
                    }
                }
            }
        } else {
            // No pending challenges, clear the list
            lastCheckedChallenges = [];
        }
    } catch (error) {
        console.error('Error checking for new challenges:', error);
    }
}

// Send challenge to opponent
async function sendChallenge() {
    const opponentId = document.getElementById('opponentSelect').value;

    if (!opponentId) {
        alert('Please select an opponent');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('games')
            .insert([
                {
                    challenger_id: currentUser.id,
                    defender_id: opponentId,
                    board_state: ["","","","","","","","",""],
                    current_turn: currentUser.id,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        alert('Challenge sent successfully!');
        document.getElementById('opponentSelect').value = '';
        await loadGamesList();
    } catch (error) {
        console.error('Error sending challenge:', error);
        alert('Failed to send challenge. Please try again.');
    }
}

// Load list of user's games
async function loadGamesList() {
    try {
        const { data, error } = await supabase
            .from('games')
            .select(`
                id,
                status,
                current_turn,
                challenger:challenger_id(id, nickname),
                defender:defender_id(id, nickname),
                created_at
            `)
            .or(`challenger_id.eq.${currentUser.id},defender_id.eq.${currentUser.id}`)
            .in('status', ['pending', 'active'])
            .order('updated_at', { ascending: false });

        if (error) throw error;

        const gamesListDiv = document.getElementById('gamesList');

        if (!data || data.length === 0) {
            gamesListDiv.innerHTML = '<p class="no-games">No active games. Start a challenge!</p>';
            return;
        }

        gamesListDiv.innerHTML = '';
        data.forEach(game => {
            const isChallenger = game.challenger.id === currentUser.id;
            const opponent = isChallenger ? game.defender : game.challenger;
            const role = isChallenger ? 'Challenger (X)' : 'Defender (O)';

            let statusText = '';
            if (game.status === 'pending') {
                statusText = isChallenger ? 'Waiting for opponent...' : 'Waiting for you to accept!';
            } else {
                const isYourTurn = game.current_turn === currentUser.id;
                statusText = isYourTurn ? 'Your turn!' : `${opponent.nickname}'s turn`;
            }

            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.innerHTML = `
                <div class="game-card-info">
                    <strong>vs ${opponent.nickname}</strong>
                    <span class="game-role">${role}</span>
                    <span class="game-status ${game.status}">${statusText}</span>
                </div>
            `;
            gameCard.addEventListener('click', () => loadGame(game.id));
            gamesListDiv.appendChild(gameCard);
        });
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

// Load and display a specific game
async function loadGame(gameId) {
    try {
        const { data, error } = await supabase
            .from('games')
            .select(`
                *,
                challenger:challenger_id(id, nickname),
                defender:defender_id(id, nickname)
            `)
            .eq('id', gameId)
            .single();

        if (error) throw error;

        currentGame = data;
        pendingMove = null;
        lastMoveIndex = null;

        // Show game board, hide games list
        document.querySelector('.games-list-section').style.display = 'none';
        document.querySelector('.challenge-section').style.display = 'none';
        document.getElementById('gameBoardSection').style.display = 'block';

        // Update game info
        const isChallenger = currentGame.challenger.id === currentUser.id;
        const opponent = isChallenger ? currentGame.defender : currentGame.challenger;
        const mySymbol = isChallenger ? 'X' : 'O';

        document.getElementById('gameTitle').textContent = `Game vs ${opponent.nickname}`;

        if (currentGame.status === 'pending') {
            if (isChallenger) {
                document.getElementById('gameStatus').textContent = 'Waiting for opponent to accept...';
                document.getElementById('turnIndicator').textContent = '';
            } else {
                document.getElementById('gameStatus').textContent = 'Challenge received! Make your first move to accept.';
                document.getElementById('turnIndicator').textContent = `You play as: ${mySymbol}`;
            }
        } else if (currentGame.status === 'active') {
            const isMyTurn = currentGame.current_turn === currentUser.id;
            document.getElementById('gameStatus').textContent = isMyTurn ? "It's your turn!" : `Waiting for ${opponent.nickname}...`;
            document.getElementById('turnIndicator').textContent = `You play as: ${mySymbol}`;
        }

        // Render board
        renderBoard();

        // Update controls
        updateControls();
    } catch (error) {
        console.error('Error loading game:', error);
        alert('Failed to load game');
    }
}

// Refresh current game state
async function refreshCurrentGame() {
    if (!currentGame) return;

    try {
        const { data, error } = await supabase
            .from('games')
            .select(`
                *,
                challenger:challenger_id(id, nickname),
                defender:defender_id(id, nickname)
            `)
            .eq('id', currentGame.id)
            .single();

        if (error) throw error;

        // Check if game was completed or aborted
        if (data.status === 'completed' || data.status === 'aborted') {
            alert(`Game ${data.status}!`);
            backToGamesList();
            await loadPlayerResults();
            return;
        }

        // Preserve pending move during refresh
        const savedPendingMove = pendingMove;
        const savedLastMoveIndex = lastMoveIndex;

        currentGame = data;

        // If there was a pending move, restore it
        if (savedPendingMove !== null && savedLastMoveIndex !== null) {
            const isChallenger = currentGame.challenger.id === currentUser.id;
            const mySymbol = isChallenger ? 'X' : 'O';

            // Re-apply the pending move to the board state
            const newBoard = [...currentGame.board_state];
            newBoard[savedPendingMove] = mySymbol;
            currentGame.board_state = newBoard;

            pendingMove = savedPendingMove;
            lastMoveIndex = savedLastMoveIndex;
        }

        renderBoard();
        updateControls();

        // Update status text
        const isChallenger = currentGame.challenger.id === currentUser.id;
        const opponent = isChallenger ? currentGame.defender : currentGame.challenger;

        if (currentGame.status === 'active') {
            const isMyTurn = currentGame.current_turn === currentUser.id;
            document.getElementById('gameStatus').textContent = isMyTurn ? "It's your turn!" : `Waiting for ${opponent.nickname}...`;
        }
    } catch (error) {
        console.error('Error refreshing game:', error);
    }
}

// Render the game board
function renderBoard() {
    const cells = document.querySelectorAll('.cell');
    const board = currentGame.board_state;

    cells.forEach((cell, index) => {
        cell.textContent = board[index];
        cell.className = 'cell';

        if (board[index] === 'X') {
            cell.classList.add('x');
        } else if (board[index] === 'O') {
            cell.classList.add('o');
        }

        // Highlight pending move
        if (pendingMove && index === pendingMove) {
            cell.classList.add('pending');
        }
    });

    // Check for winner and highlight winning row
    const winningCombination = checkWinner();
    if (winningCombination) {
        winningCombination.forEach(index => {
            cells[index].classList.add('winner');
        });
    }
}

// Handle cell click
function handleCellClick(index) {
    // Check if it's player's turn
    if (currentGame.status === 'completed' || currentGame.status === 'aborted') {
        return;
    }

    const isChallenger = currentGame.challenger.id === currentUser.id;
    const isMyTurn = currentGame.current_turn === currentUser.id || currentGame.status === 'pending';

    if (!isMyTurn && currentGame.status === 'active') {
        alert("It's not your turn!");
        return;
    }

    // Check if cell is empty
    if (currentGame.board_state[index] !== '') {
        return;
    }

    // Place pending move
    const mySymbol = isChallenger ? 'X' : 'O';
    pendingMove = index;
    lastMoveIndex = index;

    // Update board state temporarily for preview
    const newBoard = [...currentGame.board_state];
    newBoard[index] = mySymbol;
    currentGame.board_state = newBoard;

    renderBoard();

    // Enable confirm button
    document.getElementById('confirmTurnBtn').disabled = false;
}

// Handle double-click to delete last move
function handleCellDoubleClick(index) {
    // Only allow deletion of pending move
    if (pendingMove === index && lastMoveIndex === index) {
        // Remove the pending move
        const newBoard = [...currentGame.board_state];
        newBoard[index] = '';
        currentGame.board_state = newBoard;

        pendingMove = null;
        lastMoveIndex = null;

        renderBoard();
        document.getElementById('confirmTurnBtn').disabled = true;
    }
}

// Confirm turn and save to database
async function confirmTurn() {
    if (pendingMove === null) return;

    try {
        const isChallenger = currentGame.challenger.id === currentUser.id;
        const opponentId = isChallenger ? currentGame.defender.id : currentGame.challenger.id;

        // Check for winner
        const winningCombination = checkWinner();
        let newStatus = currentGame.status === 'pending' ? 'active' : 'active';
        let winnerId = null;

        if (winningCombination) {
            newStatus = 'completed';
            winnerId = currentUser.id;
        } else if (checkDraw()) {
            newStatus = 'completed';
        }

        // Update game in database
        const { data, error } = await supabase
            .from('games')
            .update({
                board_state: currentGame.board_state,
                current_turn: opponentId,
                status: newStatus,
                winner_id: winnerId,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentGame.id)
            .select()
            .single();

        if (error) throw error;

        // If game is completed, save result
        if (newStatus === 'completed') {
            await saveGameResult(winnerId);

            if (winnerId === currentUser.id) {
                alert('You won! 🎉');
            } else if (winnerId) {
                alert('You lost!');
            } else {
                alert("It's a draw!");
            }

            backToGamesList();
            await loadPlayerResults();
        } else {
            // Reset pending move
            pendingMove = null;
            lastMoveIndex = null;
            document.getElementById('confirmTurnBtn').disabled = true;

            // Refresh game state
            await refreshCurrentGame();
        }
    } catch (error) {
        console.error('Error confirming turn:', error);
        alert('Failed to save move. Please try again.');
    }
}

// Cancel/abort game
async function cancelGame() {
    if (!confirm('Are you sure you want to cancel this game?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('games')
            .update({
                status: 'aborted',
                updated_at: new Date().toISOString()
            })
            .eq('id', currentGame.id);

        if (error) throw error;

        // Save result as aborted
        await saveGameResult(null, true);

        alert('Game cancelled');
        backToGamesList();
        await loadPlayerResults();
    } catch (error) {
        console.error('Error cancelling game:', error);
        alert('Failed to cancel game');
    }
}

// Save game result
async function saveGameResult(winnerId, isAborted = false) {
    try {
        let result = 'draw';
        if (isAborted) {
            result = 'aborted';
        } else if (winnerId) {
            result = 'win';
        }

        const { error } = await supabase
            .from('game_results')
            .insert([
                {
                    game_id: currentGame.id,
                    challenger_id: currentGame.challenger.id,
                    defender_id: currentGame.defender.id,
                    result: result,
                    winner_id: winnerId
                }
            ]);

        if (error) throw error;
    } catch (error) {
        console.error('Error saving result:', error);
    }
}

// Check for winner
function checkWinner() {
    const board = currentGame.board_state;
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return combo;
        }
    }

    return null;
}

// Check for draw
function checkDraw() {
    return currentGame.board_state.every(cell => cell !== '') && !checkWinner();
}

// Update control buttons based on game state
function updateControls() {
    const confirmBtn = document.getElementById('confirmTurnBtn');
    const isMyTurn = currentGame.current_turn === currentUser.id || currentGame.status === 'pending';

    if (currentGame.status === 'completed' || currentGame.status === 'aborted') {
        confirmBtn.disabled = true;
    } else if (!isMyTurn) {
        confirmBtn.disabled = true;
    } else {
        confirmBtn.disabled = pendingMove === null;
    }
}

// Back to games list
function backToGamesList() {
    currentGame = null;
    pendingMove = null;
    lastMoveIndex = null;

    document.querySelector('.games-list-section').style.display = 'block';
    document.querySelector('.challenge-section').style.display = 'block';
    document.getElementById('gameBoardSection').style.display = 'none';

    loadGamesList();
}

// Load player's game results
async function loadPlayerResults() {
    try {
        const { data, error } = await supabase
            .from('game_results')
            .select(`
                *,
                challenger:challenger_id(nickname),
                defender:defender_id(nickname),
                winner:winner_id(nickname)
            `)
            .or(`challenger_id.eq.${currentUser.id},defender_id.eq.${currentUser.id}`)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const resultsDiv = document.getElementById('playerResults');

        if (!data || data.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">No games played yet.</p>';
            return;
        }

        let tableHTML = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Opponent</th>
                        <th>Role</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach(result => {
            const isChallenger = result.challenger_id === currentUser.id;
            const opponent = isChallenger ? result.defender.nickname : result.challenger.nickname;
            const role = isChallenger ? 'Challenger (X)' : 'Defender (O)';

            let resultText = '';
            if (result.result === 'aborted') {
                resultText = 'Aborted';
            } else if (result.result === 'draw') {
                resultText = 'Draw';
            } else if (result.winner_id === currentUser.id) {
                resultText = 'Win';
            } else {
                resultText = 'Loss';
            }

            const date = new Date(result.created_at).toLocaleDateString();

            tableHTML += `
                <tr>
                    <td>${date}</td>
                    <td>${opponent}</td>
                    <td>${role}</td>
                    <td class="result-${resultText.toLowerCase()}">${resultText}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        resultsDiv.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error loading results:', error);
    }
}
