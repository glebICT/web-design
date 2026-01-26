// Utility Functions
const showElement = (element) => element.classList.remove('hidden');
const hideElement = (element) => element.classList.add('hidden');
const setLoading = (button, isLoading) => {
    button.disabled = isLoading;
    if (isLoading) {
        button.textContent = 'Loading...';
        button.classList.add('loading');
    } else {
        button.textContent = button.dataset.originalText || button.textContent.replace('Loading...', 'Load');
        button.classList.remove('loading');
    }
};

// API Endpoints
const API_BASE = 'https://jsonplaceholder.typicode.com';

// Example 1: Basic Spinner with User Data
document.getElementById('load-users-btn').addEventListener('click', async function() {
    const button = this;
    const spinner = document.getElementById('users-spinner');
    const content = document.getElementById('users-content');
    
    button.dataset.originalText = button.textContent;
    setLoading(button, true);
    showElement(spinner);
    content.innerHTML = '';
    
    try {
        // Simulate network delay for demonstration
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const response = await fetch(`${API_BASE}/users`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        
        // Display users with a slight delay to show spinner
        setTimeout(() => {
            hideElement(spinner);
            content.innerHTML = users.slice(0, 5).map(user => `
                <div class="user-card">
                    <h3>👤 ${user.name}</h3>
                    <div class="user-details">
                        <p>📧 <strong>Email:</strong> ${user.email}</p>
                        <p>📱 <strong>Phone:</strong> ${user.phone}</p>
                        <p>🌐 <strong>Website:</strong> ${user.website}</p>
                        <p>🏢 <strong>Company:</strong> ${user.company?.name || 'Self-employed'}</p>
                        <p>📍 <strong>Address:</strong> ${user.address?.city}, ${user.address?.zipcode || ''}</p>
                    </div>
                </div>
            `).join('');
            setLoading(button, false);
        }, 500);
        
    } catch (error) {
        hideElement(spinner);
        content.innerHTML = `<div class="error-message">
            <h3>Error Loading Users</h3>
            <p>${error.message}</p>
        </div>`;
        setLoading(button, false);
    }
});

// Example 2: Progress Bar with Meaningful Posts Data
document.getElementById('load-posts-btn').addEventListener('click', async function() {
    const button = this;
    const progressBar = document.getElementById('posts-progress');
    const progressFill = progressBar.querySelector('.progress-fill');
    const progressText = document.getElementById('progress-text');
    const container = document.getElementById('posts-container');
    
    button.dataset.originalText = button.textContent;
    setLoading(button, true);
    showElement(progressBar);
    container.innerHTML = '';
    
    try {
        // Simulate progress
        const simulateProgress = (percent) => {
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `${Math.round(percent)}%`;
        };
        
        // Show initial progress
        simulateProgress(10);
        
        // First delay - 30%
        await new Promise(resolve => setTimeout(resolve, 300));
        simulateProgress(30);
        
        // Make API calls for both posts and users to create meaningful content
        const [postsResponse, usersResponse] = await Promise.all([
            fetch(`${API_BASE}/posts`),
            fetch(`${API_BASE}/users`)
        ]);
        
        simulateProgress(70);
        
        if (!postsResponse.ok || !usersResponse.ok) {
            throw new Error('Failed to load required data');
        }
        
        const [posts, users] = await Promise.all([
            postsResponse.json(),
            usersResponse.json()
        ]);
        
        simulateProgress(90);
        
        // Create a mapping of userId to user names
        const userMap = {};
        users.forEach(user => {
            userMap[user.id] = user;
        });
        
        // Final delay before showing content
        await new Promise(resolve => setTimeout(resolve, 200));
        simulateProgress(100);
        
        // Display posts with meaningful user information
        setTimeout(() => {
            hideElement(progressBar);
            progressText.textContent = '';
            container.innerHTML = posts.slice(0, 5).map(post => {
                const author = userMap[post.userId] || { name: 'Unknown Author' };
                return `
                <div class="post-card">
                    <h3>📝 ${post.title}</h3>
                    <div class="post-meta">
                        <span class="author">👤 Author: ${author.name}</span>
                        <span class="company">🏢 ${author.company?.name || 'Freelancer'}</span>
                        <span class="email">📧 ${author.email}</span>
                    </div>
                    <div class="post-content">
                        <p>${post.body}</p>
                    </div>
                    <div class="post-footer">
                        <span class="post-id">Post #${post.id}</span>
                        <span class="user-id">User ID: ${post.userId}</span>
                    </div>
                </div>
            `}).join('');
            setLoading(button, false);
        }, 300);
        
    } catch (error) {
        hideElement(progressBar);
        progressText.textContent = '';
        container.innerHTML = `<div class="error-message">
            <h3>❌ Error Loading Blog Posts</h3>
            <p>${error.message}</p>
            <p>Please try again later.</p>
        </div>`;
        setLoading(button, false);
    }
});

// Example 3: Complex Skeleton Loading with Pet Data
document.getElementById('load-photos-btn').addEventListener('click', async function() {
    const button = this;
    const container = document.getElementById('photos-container');
    
    button.dataset.originalText = button.textContent;
    setLoading(button, true);
    
    // Show complex skeleton loading with 3 structural elements
    container.innerHTML = Array(6).fill().map(() => `
        <div class="skeleton-pet-card">
            <div class="skeleton-pet-header">
                <div class="skeleton-pet-avatar"></div>
                <div class="skeleton-pet-info">
                    <div class="skeleton-text-large"></div>
                    <div class="skeleton-text-small"></div>
                </div>
            </div>
            <div class="skeleton-pet-image"></div>
            <div class="skeleton-pet-details">
                <div class="skeleton-detail-row">
                    <div class="skeleton-label"></div>
                    <div class="skeleton-value"></div>
                </div>
                <div class="skeleton-detail-row">
                    <div class="skeleton-label"></div>
                    <div class="skeleton-value"></div>
                </div>
                <div class="skeleton-detail-row">
                    <div class="skeleton-label"></div>
                    <div class="skeleton-value"></div>
                </div>
            </div>
            <div class="skeleton-pet-description">
                <div class="skeleton-text-line"></div>
                <div class="skeleton-text-line"></div>
                <div class="skeleton-text-line short"></div>
            </div>
        </div>
    `).join('');
    
    try {
        // Wait to show skeleton effect
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Fetch from Dog CEO API (free dog images)
        const response = await fetch('https://dog.ceo/api/breeds/image/random/6');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const dogImages = data.message;
        
        // Fetch breed information
        const breedResponse = await fetch('https://dog.ceo/api/breeds/list/all');
        const breedData = await breedResponse.json();
        const breeds = Object.keys(breedData.message);
        
        // Generate pet data
        const petData = dogImages.map((imageUrl, index) => ({
            id: index + 1,
            name: [`Buddy`, `Max`, `Charlie`, `Cooper`, `Rocky`, `Duke`][index],
            breed: breeds[Math.floor(Math.random() * Math.min(breeds.length, 20))],
            age: `${Math.floor(Math.random() * 10) + 1} years`,
            weight: `${Math.floor(Math.random() * 30) + 15} lbs`,
            temperament: [`Friendly`, `Playful`, `Loyal`, `Energetic`, `Gentle`, `Smart`][index],
            imageUrl: imageUrl,
            description: [
                "A wonderful companion who loves playing fetch and going on walks.",
                "Very social and gets along great with children and other pets.",
                "Has a gentle nature and enjoys cuddling on the couch.",
                "Full of energy and always ready for adventure!",
                "Well-trained and responds well to commands.",
                "Affectionate and loyal member of the family."
            ][index]
        }));
        
        // Display pet cards with meaningful data
        setTimeout(() => {
            container.innerHTML = petData.map(pet => `
                <div class="pet-card">
                    <div class="pet-header">
                        <img src="${pet.imageUrl}" alt="${pet.name}" class="pet-avatar">
                        <div class="pet-info">
                            <h3>🐕 ${pet.name}</h3>
                            <p class="pet-breed">${pet.breed}</p>
                        </div>
                    </div>
                    <img src="${pet.imageUrl}" alt="${pet.name}" class="pet-main-image">
                    <div class="pet-details">
                        <div class="detail-row">
                            <span class="detail-label">Age:</span>
                            <span class="detail-value">${pet.age}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Weight:</span>
                            <span class="detail-value">${pet.weight}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Temperament:</span>
                            <span class="detail-value">${pet.temperament}</span>
                        </div>
                    </div>
                    <div class="pet-description">
                        <p>${pet.description}</p>
                    </div>
                </div>
            `).join('');
            setLoading(button, false);
        }, 400);
        
    } catch (error) {
        // Fallback to cat API if dog API fails
        try {
            const catResponse = await fetch('https://api.thecatapi.com/v1/images/search?limit=6');
            if (catResponse.ok) {
                const catData = await catResponse.json();
                const catBreeds = ['Siamese', 'Persian', 'Maine Coon', 'Bengal', 'Russian Blue', 'Scottish Fold'];
                
                const catPetData = catData.map((cat, index) => ({
                    id: index + 1,
                    name: [`Whiskers`, `Luna`, `Oliver`, `Milo`, `Chloe`, `Simba`][index],
                    breed: catBreeds[index],
                    age: `${Math.floor(Math.random() * 8) + 1} years`,
                    weight: `${Math.floor(Math.random() * 10) + 8} lbs`,
                    temperament: [`Independent`, `Curious`, `Affectionate`, `Playful`, `Calm`, `Social`][index],
                    imageUrl: cat.url,
                    description: [
                        "Enjoys sunny spots and gentle pets.",
                        "Loves interactive toys and puzzle feeders.",
                        "Very curious and explores every corner.",
                        "Playful and energetic, especially at night.",
                        "Peaceful companion who enjoys quiet time.",
                        "Social cat who gets along with everyone."
                    ][index]
                }));
                
                setTimeout(() => {
                    container.innerHTML = catPetData.map(pet => `
                        <div class="pet-card">
                            <div class="pet-header">
                                <img src="${pet.imageUrl}" alt="${pet.name}" class="pet-avatar">
                                <div class="pet-info">
                                    <h3>🐱 ${pet.name}</h3>
                                    <p class="pet-breed">${pet.breed}</p>
                                </div>
                            </div>
                            <img src="${pet.imageUrl}" alt="${pet.name}" class="pet-main-image">
                            <div class="pet-details">
                                <div class="detail-row">
                                    <span class="detail-label">Age:</span>
                                    <span class="detail-value">${pet.age}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Weight:</span>
                                    <span class="detail-value">${pet.weight}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Temperament:</span>
                                    <span class="detail-value">${pet.temperament}</span>
                                </div>
                            </div>
                            <div class="pet-description">
                                <p>${pet.description}</p>
                            </div>
                        </div>
                    `).join('');
                    setLoading(button, false);
                }, 400);
            } else {
                throw new Error('Both pet APIs unavailable');
            }
        } catch (fallbackError) {
            container.innerHTML = `<div class="error-message">
                <h3>🐾 Error Loading Pet Data</h3>
                <p>${error.message}</p>
                <p>Try again later or check your internet connection.</p>
            </div>`;
            setLoading(button, false);
        }
    }
});

// Example 4: Multiple Simultaneous Requests with Promise.all()
document.getElementById('load-all-btn').addEventListener('click', async function() {
    const button = this;
    const spinner = document.getElementById('all-spinner');
    const usersContainer = document.getElementById('all-users');
    const postsContainer = document.getElementById('all-posts');
    const photosContainer = document.getElementById('all-photos');
    
    button.dataset.originalText = button.textContent;
    setLoading(button, true);
    showElement(spinner);
    
    // Clear containers
    usersContainer.innerHTML = '';
    postsContainer.innerHTML = '';
    photosContainer.innerHTML = '';
    
    try {
        // Make all requests simultaneously
        const [usersResponse, postsResponse, photosResponse] = await Promise.all([
            fetch(`${API_BASE}/users`),
            fetch(`${API_BASE}/posts`),
            fetch(`${API_BASE}/photos`)
        ]);
        
        // Check if all responses are ok
        if (!usersResponse.ok || !postsResponse.ok || !photosResponse.ok) {
            throw new Error('One or more API requests failed');
        }
        
        // Parse all responses
        const [users, posts, photos] = await Promise.all([
            usersResponse.json(),
            postsResponse.json(),
            photosResponse.json()
        ]);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Hide spinner and display data
        hideElement(spinner);
        
        // Create user mapping for posts
        const userMapping = {};
        users.forEach(user => {
            userMapping[user.id] = user;
        });
        
        usersContainer.innerHTML = users.slice(0, 3).map(user => `
            <div class="user-card">
                <h3>👤 ${user.name}</h3>
                <p>📧 ${user.email}</p>
                <p>📱 ${user.phone}</p>
                <p>🏢 ${user.company?.name || 'Independent'}</p>
            </div>
        `).join('');
        
        postsContainer.innerHTML = posts.slice(0, 3).map(post => {
            const author = userMapping[post.userId] || { name: 'Unknown' };
            return `
            <div class="post-card">
                <h3>📝 ${post.title}</h3>
                <div class="post-meta">
                    <span class="author">Author: ${author.name}</span>
                </div>
                <div class="post-content">
                    <p>${post.body.substring(0, 120)}...</p>
                </div>
            </div>
        `}).join('');
        
        photosContainer.innerHTML = photos.slice(0, 3).map(photo => `
            <div class="photo-card">
                <h3>${photo.title}</h3>
                <img src="${photo.thumbnailUrl}" alt="${photo.title}" class="photo-img">
            </div>
        `).join('');
        
        setLoading(button, false);
        
    } catch (error) {
        hideElement(spinner);
        usersContainer.innerHTML = `<div class="error-message">
            <h3>Error Loading Data</h3>
            <p>${error.message}</p>
        </div>`;
        postsContainer.innerHTML = '';
        photosContainer.innerHTML = '';
        setLoading(button, false);
    }
});

// Example 5: Comprehensive Error Handling Examples

// 1. Network Error Simulation
document.getElementById('network-error-btn').addEventListener('click', async function() {
    const button = this;
    const container = document.getElementById('network-error-container');
    const errorMessage = document.getElementById('network-error-message');
    
    button.dataset.originalText = button.textContent;
    setLoading(button, true);
    hideElement(errorMessage);
    
    try {
        // Simulate network failure by trying to reach an unreachable host
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 100); // Very short timeout
        
        const response = await fetch('https://this-domain-definitely-does-not-exist-12345.com/api', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
    } catch (error) {
        showElement(errorMessage);
        errorMessage.className = 'error-message network-error';
        errorMessage.innerHTML = `
            <h3>🌐 Network Error</h3>
            <p><strong>Type:</strong> ${error.constructor.name}</p>
            <p><strong>Message:</strong> ${error.message}</p>
            <p><strong>Possible Causes:</strong></p>
            <ul>
                <li>No internet connection</li>
                <li>Server is unreachable</li>
                <li>DNS resolution failed</li>
                <li>Firewall blocking request</li>
            </ul>
            <p><strong>Solution:</strong> Check network connectivity and try again.</p>
        `;
        setLoading(button, false);
    }
});

// 2. 404 Not Found Error
document.getElementById('notfound-error-btn').addEventListener('click', async function() {
    const button = this;
    const container = document.getElementById('notfound-error-container');
    const errorMessage = document.getElementById('notfound-error-message');
    
    button.dataset.originalText = button.textContent;
    setLoading(button, true);
    hideElement(errorMessage);
    
    try {
        // Request non-existent resource
        const response = await fetch(`${API_BASE}/nonexistent-resource/999999`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Resource not found (404)');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
    } catch (error) {
        showElement(errorMessage);
        errorMessage.className = 'error-message notfound-error';
        errorMessage.innerHTML = `
            <h3>🔍 404 Not Found</h3>
            <p><strong>Type:</strong> ${error.constructor.name}</p>
            <p><strong>Message:</strong> ${error.message}</p>
            <p><strong>Possible Causes:</strong></p>
            <ul>
                <li>Requested resource doesn't exist</li>
                <li>Incorrect URL or endpoint</li>
                <li>Resource was deleted</li>
                <li>Typo in the request path</li>
            </ul>
            <p><strong>Solution:</strong> Verify the URL and check if the resource exists.</p>
        `;
        setLoading(button, false);
    }
});

// 3. 500 Server Error
document.getElementById('server-error-btn').addEventListener('click', async function() {
    const button = this;
    const container = document.getElementById('server-error-container');
    const errorMessage = document.getElementById('server-error-message');
    
    button.dataset.originalText = button.textContent;
    setLoading(button, true);
    hideElement(errorMessage);
    
    try {
        // Using HTTPBin service to simulate server errors
        const response = await fetch('https://httpbin.org/status/500');
        
        if (!response.ok) {
            if (response.status >= 500) {
                throw new Error(`Server error (${response.status}): Internal server problem`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
    } catch (error) {
        showElement(errorMessage);
        errorMessage.className = 'error-message server-error';
        errorMessage.innerHTML = `
            <h3>🔧 500 Server Error</h3>
            <p><strong>Type:</strong> ${error.constructor.name}</p>
            <p><strong>Message:</strong> ${error.message}</p>
            <p><strong>Possible Causes:</strong></p>
            <ul>
                <li>Server-side application crash</li>
                <li>Database connection issues</li>
                <li>Server overload or maintenance</li>
                <li>Bug in server code</li>
            </ul>
            <p><strong>Solution:</strong> Try again later or contact support.</p>
        `;
        setLoading(button, false);
    }
});

// 4. Timeout Error
document.getElementById('timeout-error-btn').addEventListener('click', async function() {
    const button = this;
    const container = document.getElementById('timeout-error-container');
    const errorMessage = document.getElementById('timeout-error-message');
    
    button.dataset.originalText = button.textContent;
    setLoading(button, true);
    hideElement(errorMessage);
    
    try {
        // Create abort controller with very short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 50); // Extremely short timeout
        
        const response = await fetch(`${API_BASE}/photos`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
    } catch (error) {
        showElement(errorMessage);
        errorMessage.className = 'error-message timeout-error';
        
        if (error.name === 'AbortError') {
            errorMessage.innerHTML = `
                <h3>⏱️ Timeout Error</h3>
                <p><strong>Type:</strong> AbortError</p>
                <p><strong>Message:</strong> Request timed out</p>
                <p><strong>Possible Causes:</strong></p>
                <ul>
                    <li>Slow network connection</li>
                    <li>Server taking too long to respond</li>
                    <li>Large data transfer</li>
                    <li>Server busy or overloaded</li>
                </ul>
                <p><strong>Solution:</strong> Increase timeout duration or try again with better connection.</p>
            `;
        } else {
            errorMessage.innerHTML = `
                <h3>⏱️ Timeout Error</h3>
                <p><strong>Type:</strong> ${error.constructor.name}</p>
                <p><strong>Message:</strong> ${error.message}</p>
                <p><strong>Solution:</strong> Check network speed and server responsiveness.</p>
            `;
        }
        setLoading(button, false);
    }
});

// 5. Invalid JSON Response
document.getElementById('json-error-btn').addEventListener('click', async function() {
    const button = this;
    const container = document.getElementById('json-error-container');
    const errorMessage = document.getElementById('json-error-message');
    
    button.dataset.originalText = button.textContent;
    setLoading(button, true);
    hideElement(errorMessage);
    
    try {
        // Fetch HTML content and try to parse as JSON
        const response = await fetch('https://httpbin.org/html');
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
        // This will fail because we're trying to parse HTML as JSON
        const data = await response.json();
        
    } catch (error) {
        showElement(errorMessage);
        errorMessage.className = 'error-message json-error';
        errorMessage.innerHTML = `
            <h3>📄 JSON Parsing Error</h3>
            <p><strong>Type:</strong> ${error.constructor.name}</p>
            <p><strong>Message:</strong> ${error.message}</p>
            <p><strong>Possible Causes:</strong></p>
            <ul>
                <li>Server returned HTML instead of JSON</li>
                <li>Malformed JSON response</li>
                <li>CORS issues affecting response</li>
                <li>Unexpected content type</li>
            </ul>
            <p><strong>Solution:</strong> Check response format and content-type header.</p>
        `;
        setLoading(button, false);
    }
});

// 6. Rate Limiting Error
document.getElementById('rate-limit-btn').addEventListener('click', async function() {
    const button = this;
    const container = document.getElementById('rate-limit-container');
    const errorMessage = document.getElementById('rate-limit-message');
    
    button.dataset.originalText = button.textContent;
    setLoading(button, true);
    hideElement(errorMessage);
    
    try {
        // Using HTTPBin to simulate rate limiting
        const response = await fetch('https://httpbin.org/status/429');
        
        if (!response.ok) {
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After') || '30';
                throw new Error(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
    } catch (error) {
        showElement(errorMessage);
        errorMessage.className = 'error-message rate-limit-error';
        errorMessage.innerHTML = `
            <h3>🚦 Rate Limit Exceeded</h3>
            <p><strong>Type:</strong> ${error.constructor.name}</p>
            <p><strong>Message:</strong> ${error.message}</p>
            <p><strong>Possible Causes:</strong></p>
            <ul>
                <li>Too many requests in short time period</li>
                <li>API usage quota exceeded</li>
                <li>Missing authentication headers</li>
                <li>Shared API key limitations</li>
            </ul>
            <p><strong>Solution:</strong> Wait before retrying or upgrade your API plan.</p>
        `;
        setLoading(button, false);
    }
});

// Advanced Example: Chaining Promises with Sequential Loading
async function loadSequentialData() {
    console.log('Starting sequential data loading...');
    
    try {
        // Step 1: Load users
        console.log('Loading users...');
        const usersResponse = await fetch(`${API_BASE}/users`);
        const users = await usersResponse.json();
        console.log(`Loaded ${users.length} users`);
        
        // Step 2: Load posts for first user
        console.log('Loading posts...');
        const postsResponse = await fetch(`${API_BASE}/posts?userId=${users[0].id}`);
        const posts = await postsResponse.json();
        console.log(`Loaded ${posts.length} posts for user ${users[0].name}`);
        
        // Step 3: Load comments for first post
        console.log('Loading comments...');
        const commentsResponse = await fetch(`${API_BASE}/comments?postId=${posts[0].id}`);
        const comments = await commentsResponse.json();
        console.log(`Loaded ${comments.length} comments for post "${posts[0].title}"`);
        
        return { users, posts, comments };
        
    } catch (error) {
        console.error('Sequential loading failed:', error);
        throw error;
    }
}

// Promise Race Example - Fastest request wins
async function raceExample() {
    const urls = [
        `${API_BASE}/users`,
        `${API_BASE}/posts`,
        `${API_BASE}/photos`
    ];
    
    const requests = urls.map(url => fetch(url));
    
    try {
        const response = await Promise.race(requests);
        const data = await response.json();
        console.log(`Fastest response: ${response.url} with ${data.length} items`);
        return data;
    } catch (error) {
        console.error('Race failed:', error);
        throw error;
    }
}

console.log('📚 Educational Examples Loaded!');
console.log('Try these in the browser console:');
console.log('- loadSequentialData()');
console.log('- raceExample()');