// Spotify API Configuration
const SPOTIFY_TOKEN = 'BQCBB3Ph4cyewnZ-X2uy-jttAjjvn50l1BB2vQG6ynWHPlgFY0DfTvu74VsZhVZL456m7njU6Q2V5FTUAanoz27TEsigBmDe-SBGHu3i-livvJ9daa7mqXmBqL2J01V4mPMIn0s7aBE';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Global Variables
let currentAudio = null;
let currentTrackIndex = 0;
let currentTracks = [];
let isPlaying = false;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchType = document.getElementById('searchType');
const resultsLimit = document.getElementById('resultsLimit');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');

// Audio Player Elements
const audioPlayer = document.getElementById('audioPlayer');
const nowPlayingArt = document.getElementById('nowPlayingArt');
const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const nowPlayingArtist = document.getElementById('nowPlayingArtist');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progress = document.getElementById('progress');
const currentTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const volumeSlider = document.getElementById('volumeSlider');
const closePlayer = document.getElementById('closePlayer');

// Results Containers
const artistResults = document.getElementById('artistResults');
const trackResults = document.getElementById('trackResults');
const albumResults = document.getElementById('albumResults');
const featuredSection = document.getElementById('featuredSection');

// Count Elements
const artistCount = document.getElementById('artistCount');
const trackCount = document.getElementById('trackCount');
const albumCount = document.getElementById('albumCount');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    loadFeaturedContent();
    setupEventListeners();
    setupAudioPlayer();
});

// Setup Event Listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Audio player events
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    volumeSlider.addEventListener('input', setVolume);
    closePlayer.addEventListener('click', closeAudioPlayer);
    
    // Progress bar seeking
    document.querySelector('.progress-bar').addEventListener('click', seekAudio);
}

// Setup Audio Player
function setupAudioPlayer() {
    currentAudio = new Audio();
    currentAudio.volume = volumeSlider.value / 100;
    
    currentAudio.addEventListener('loadedmetadata', function() {
        duration.textContent = formatTime(currentAudio.duration);
    });
    
    currentAudio.addEventListener('timeupdate', function() {
        if (currentAudio.duration) {
            const progressPercent = (currentAudio.currentTime / currentAudio.duration) * 100;
            progress.style.width = `${progressPercent}%`;
            currentTime.textContent = formatTime(currentAudio.currentTime);
        }
    });
    
    currentAudio.addEventListener('ended', playNext);
}

// Perform Search
async function performSearch() {
    const query = searchInput.value.trim();
    const type = searchType.value;
    const limit = resultsLimit.value;
    
    if (!query) {
        showNotification('Please enter a search term', 'warning');
        return;
    }
    
    showLoading();
    hideAllResults();
    hideError();
    
    try {
        const results = await searchSpotify(query, type, limit);
        displayResults(results, type);
        showNotification(`Found ${getResultCount(results, type)} results for "${query}"`, 'success');
    } catch (error) {
        console.error('Search error:', error);
        showError();
        showNotification('Search failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Search Spotify API
async function searchSpotify(query, type, limit = 12) {
    const url = `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${SPOTIFY_TOKEN}`
        }
    });
    
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
}

// Get result count
function getResultCount(results, type) {
    switch (type) {
        case 'artist': return results.artists.items.length;
        case 'track': return results.tracks.items.length;
        case 'album': return results.albums.items.length;
        default: return 0;
    }
}

// Display Results
function displayResults(results, type) {
    switch (type) {
        case 'artist':
            displayArtists(results.artists.items);
            break;
        case 'track':
            displayTracks(results.tracks.items);
            break;
        case 'album':
            displayAlbums(results.albums.items);
            break;
    }
}

// Display Artists
function displayArtists(artists) {
    const container = document.getElementById('artistList');
    container.innerHTML = '';
    
    if (artists.length === 0) {
        container.innerHTML = '<p class="no-results">No artists found</p>';
    } else {
        artists.forEach(artist => {
            const card = createArtistCard(artist);
            container.appendChild(card);
        });
    }
    
    artistCount.textContent = `${artists.length} artists`;
    artistResults.classList.remove('hidden');
}

// Display Tracks
function displayTracks(tracks) {
    const container = document.getElementById('trackList');
    container.innerHTML = '';
    
    if (tracks.length === 0) {
        container.innerHTML = '<p class="no-results">No tracks found</p>';
    } else {
        tracks.forEach((track, index) => {
            const card = createTrackCard(track, index);
            container.appendChild(card);
        });
        currentTracks = tracks; // Store for audio player
    }
    
    trackCount.textContent = `${tracks.length} tracks`;
    trackResults.classList.remove('hidden');
}

// Display Albums
function displayAlbums(albums) {
    const container = document.getElementById('albumList');
    container.innerHTML = '';
    
    if (albums.length === 0) {
        container.innerHTML = '<p class="no-results">No albums found</p>';
    } else {
        albums.forEach(album => {
            const card = createAlbumCard(album);
            container.appendChild(card);
        });
    }
    
    albumCount.textContent = `${albums.length} albums`;
    albumResults.classList.remove('hidden');
}

// Create Artist Card
function createArtistCard(artist) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const imageUrl = artist.images.length > 0 ? artist.images[0].url : 'https://via.placeholder.com/300x300/191414/1db954?text=No+Image';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${artist.name}" class="card-img">
        <div class="card-content">
            <h3 class="card-title">${artist.name}</h3>
            <p class="card-subtitle">${artist.genres.join(', ') || 'No genre information'}</p>
            <div class="card-popularity">
                <span>Popularity: ${artist.popularity}%</span>
                <div class="popularity-bar">
                    <div class="popularity-fill" style="width: ${artist.popularity}%"></div>
                </div>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        showNotification(`Viewing ${artist.name} details`, 'info');
        // In a real app, this would navigate to artist details
    });
    
    return card;
}

// Create Track Card
function createTrackCard(track, index) {
    const card = document.createElement('div');
    card.className = 'card track-card';
    
    const imageUrl = track.album.images.length > 0 ? track.album.images[0].url : 'https://via.placeholder.com/300x300/191414/1db954?text=No+Image';
    const artists = track.artists.map(artist => artist.name).join(', ');
    const duration = formatTime(track.duration_ms / 1000);
    
    card.innerHTML = `
        <div class="card-image-container">
            <img src="${imageUrl}" alt="${track.name}" class="card-img">
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
        </div>
        <div class="card-content">
            <h3 class="card-title">${track.name}</h3>
            <p class="card-subtitle">${artists}</p>
            <p class="card-subtitle">Album: ${track.album.name}</p>
            <p class="card-subtitle">Duration: ${duration}</p>
            <div class="card-popularity">
                <span>Popularity: ${track.popularity}%</span>
                <div class="popularity-bar">
                    <div class="popularity-fill" style="width: ${track.popularity}%"></div>
                </div>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        playTrack(track, index);
    });
    
    return card;
}

// Create Album Card
function createAlbumCard(album) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const imageUrl = album.images.length > 0 ? album.images[0].url : 'https://via.placeholder.com/300x300/191414/1db954?text=No+Image';
    const artists = album.artists.map(artist => artist.name).join(', ');
    const releaseYear = new Date(album.release_date).getFullYear();
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${album.name}" class="card-img">
        <div class="card-content">
            <h3 class="card-title">${album.name}</h3>
            <p class="card-subtitle">${artists}</p>
            <p class="card-subtitle">Released: ${releaseYear}</p>
            <p class="card-subtitle">Tracks: ${album.total_tracks}</p>
        </div>
    `;
    
    card.addEventListener('click', () => {
        showNotification(`Viewing album: ${album.name}`, 'info');
        // In a real app, this would show album details
    });
    
    return card;
}

// Audio Player Functions
function playTrack(track, index) {
    if (!track.preview_url) {
        showNotification('No preview available for this track', 'warning');
        return;
    }
    
    currentTrackIndex = index;
    
    // Update player UI
    nowPlayingArt.src = track.album.images[0]?.url || '';
    nowPlayingTitle.textContent = track.name;
    nowPlayingArtist.textContent = track.artists.map(artist => artist.name).join(', ');
    
    // Load and play audio
    currentAudio.src = track.preview_url;
    currentAudio.load();
    
    playAudio();
    showAudioPlayer();
    
    showNotification(`Now playing: ${track.name}`, 'success');
}

function playAudio() {
    currentAudio.play()
        .then(() => {
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        })
        .catch(error => {
            console.error('Playback failed:', error);
            showNotification('Playback failed. Please try another track.', 'error');
        });
}

function pauseAudio() {
    currentAudio.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
}

function togglePlay() {
    if (!currentAudio.src) return;
    
    if (isPlaying) {
        pauseAudio();
    } else {
        playAudio();
    }
}

function playPrevious() {
    if (currentTracks.length === 0) return;
    
    currentTrackIndex = (currentTrackIndex - 1 + currentTracks.length) % currentTracks.length;
    playTrack(currentTracks[currentTrackIndex], currentTrackIndex);
}

function playNext() {
    if (currentTracks.length === 0) return;
    
    currentTrackIndex = (currentTrackIndex + 1) % currentTracks.length;
    playTrack(currentTracks[currentTrackIndex], currentTrackIndex);
}

function setVolume() {
    currentAudio.volume = volumeSlider.value / 100;
}

function seekAudio(e) {
    if (!currentAudio.duration) return;
    
    const progressBar = e.currentTarget;
    const clickPosition = e.offsetX;
    const progressBarWidth = progressBar.clientWidth;
    const seekTime = (clickPosition / progressBarWidth) * currentAudio.duration;
    
    currentAudio.currentTime = seekTime;
}

function closeAudioPlayer() {
    pauseAudio();
    audioPlayer.classList.add('hidden');
}

function showAudioPlayer() {
    audioPlayer.classList.remove('hidden');
}

// Featured Content
async function loadFeaturedContent() {
    try {
        const featuredArtists = await getFeaturedArtists();
        displayFeaturedContent(featuredArtists);
    } catch (error) {
        console.error('Failed to load featured content:', error);
        featuredSection.classList.add('hidden');
    }
}

async function getFeaturedArtists() {
    const artistIds = [
        '3TVXtAsR1Inumwj472S9r4', // Drake
        '06HL4z0CvFAxyc27GXpf02', // Taylor Swift
        '1uNFoZAHBGtllmzznpCI3s', // Justin Bieber
        '0TnOYISbd1XYRBk9myaseg',  // Pitbull
        '5K4W6rqBFWDnAN6FQUkS6x', // Kanye West
        '4q3ewBCX7sLwd24euuV69X'  // Bad Bunny
    ];
    
    const url = `${SPOTIFY_API_BASE}/artists?ids=${artistIds.join(',')}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${SPOTIFY_TOKEN}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch featured artists');
    }
    
    const data = await response.json();
    return data.artists;
}

function displayFeaturedContent(artists) {
    const container = document.getElementById('featuredContent');
    container.innerHTML = '';
    
    artists.forEach(artist => {
        const card = createArtistCard(artist);
        container.appendChild(card);
    });
}

// Utility Functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1001;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'warning': return 'exclamation-triangle';
        case 'error': return 'times-circle';
        default: return 'info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#1db954';
        case 'warning': return '#ffa726';
        case 'error': return '#f44336';
        default: return '#2196f3';
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .no-results {
        text-align: center;
        color: var(--spotify-text-secondary);
        padding: 2rem;
        grid-column: 1 / -1;
    }
    
    .card-image-container {
        position: relative;
    }
`;
document.head.appendChild(style);

// UI Control Functions
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError() {
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function hideAllResults() {
    artistResults.classList.add('hidden');
    trackResults.classList.add('hidden');
    albumResults.classList.add('hidden');
}