function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.transform === 'translateX(0px)') {
        sidebar.style.transform = 'translateX(-400px)';
    } else {
        sidebar.style.transform = 'translateX(0px)';
    }
}

function searchBlogs() {
    const query = document.getElementById('searchInput').value;
    if (query) {
        window.location.href = `/search?query=${query}`;
    }
}

function checkEnter(event) {
    if (event.key === 'Enter') {
        searchBlogs();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const avatarLink = document.querySelector('.right a[href="/profile"]');
    
    if (avatarLink) {
        avatarLink.addEventListener('click', async function(event) {
            event.preventDefault();
            try {
                const response = await fetch('/users/header-detail', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId: '<%= user._id %>' })
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch user details');
                }
                const data = await response.json();
                console.log('User details:', data);
                // Update UI with user details if necessary
                window.location.href = '/profile';
            } catch (error) {
                console.error('Error fetching user details:', error);
            }
        });
    }
});

fetch('/')
    .then(response => response.json())
    .then(data => {
        if (data.isLoggedIn) {
        }
    })
    .catch(error => console.error(error));