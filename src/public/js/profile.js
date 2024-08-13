document.addEventListener('DOMContentLoaded', function() {
    const changeAvatarLink = document.getElementById('changeAvatarLink');
    const avatarFileInput = document.getElementById('avatarFileInput');

    changeAvatarLink.addEventListener('click', function(event) {
        event.preventDefault();
        avatarFileInput.click();
    });

    avatarFileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('avatar', file);

            fetch('/update-avatar', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error updating avatar');
                }
                return response.json();
            })
            .then(data => {
                console.log('Avatar updated successfully:', data);
                // Update UI with new avatar if needed
            })
            .catch(error => {
                console.error('Error updating avatar:', error);
                // Handle error, show an error message, etc.
            });
        }
    });

    const categorySelect = document.getElementById('categorySelect');
    const sortLinks = document.querySelectorAll('.sortOptions a');
    const blogsContainer = document.querySelector('#userBlogs');
    
    let blogs = Array.from(blogsContainer.children);
    let filteredBlogs = [...blogs]; // Track the currently filtered blogs
    
    // Function to render blogs
    function renderBlogs(blogs) {
        blogsContainer.innerHTML = '';
        blogs.forEach(blog => blogsContainer.appendChild(blog));
    }

    // Filter blogs
    categorySelect.addEventListener('change', function () {
        const category = categorySelect.value;
        
        if (category === 'all') {
            filteredBlogs = [...blogs];
        } else {
            filteredBlogs = blogs.filter(blog => {
                const categoryElement = blog.querySelector('.category');
                return categoryElement && categoryElement.innerText.includes(category);
            });
        }

        // Reset the sorting links active state
        sortLinks.forEach(link => link.classList.remove('active'));
        renderBlogs(filteredBlogs);
    });

    // Sort blogs
    sortLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sort = link.getAttribute('data-sort');
            const order = link.getAttribute('data-order');
            
            let sortedBlogs = [...filteredBlogs];

            if (sort === 'likesCount' || sort === 'dislikesCount') {
                sortedBlogs.sort((a, b) => {
                    const aCountElement = a.querySelector(`.${sort} span`);
                    const bCountElement = b.querySelector(`.${sort} span`);

                    const aCount = aCountElement ? parseInt(aCountElement.textContent.trim(), 10) : 0;
                    const bCount = bCountElement ? parseInt(bCountElement.textContent.trim(), 10) : 0;
                    
                    return order === 'asc' ? aCount - bCount : bCount - aCount;
                });
            } else if (sort === 'updatedAt') {
                sortedBlogs.sort((a, b) => {
                    const aDateElement = a.querySelector('.date');
                    const bDateElement = b.querySelector('.date');

                    const aDate = aDateElement ? new Date(aDateElement.getAttribute('data-date')) : new Date(0);  // Fallback to a very old date
                    const bDate = bDateElement ? new Date(bDateElement.getAttribute('data-date')) : new Date(0);  // Fallback to a very old date
                    
                    
                    return order === 'asc' ? aDate - bDate : bDate - aDate;
                });
            }

            renderBlogs(sortedBlogs);
        });
    });
});
