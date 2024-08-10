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
                filteredBlogs = blogs.filter(blog => blog.querySelector('.category').innerText.includes(category));
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
    
                sortLinks.forEach(link => link.classList.remove('active'));
                link.classList.add('active');
    
                let sortedBlogs = [...filteredBlogs];
                if (sort === 'likesCount' || sort === 'dislikesCount') {
                    sortedBlogs.sort((a, b) => {
                        const aCount = parseInt(a.querySelector(`.${sort} span`).innerText, 10);
                        const bCount = parseInt(b.querySelector(`.${sort} span`).innerText, 10);
                        return order === 'asc' ? aCount - bCount : bCount - aCount;
                    });
                } else if (sort === 'updatedAt') {
                    sortedBlogs.sort((a, b) => {
                        const aDate = new Date(a.querySelector('.date').innerText);
                        const bDate = new Date(b.querySelector('.date').innerText);
                        return order === 'asc' ? aDate - bDate : bDate - aDate;
                    });
                }
    
                renderBlogs(sortedBlogs);
            });
        });
    
    
});
