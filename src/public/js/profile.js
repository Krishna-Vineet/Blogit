    function toggleFollow(authorId) {
        fetch(`/follow/${authorId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => data.data)
        .then(data => {
            document.getElementById('followBtn').outerHTML =
        `<a id="followBtn" class="btn ${ data.isFollowed ? 'followed' : 'notfollowed' }" onclick="toggleFollow('${ authorId }')">${ data.isFollowed ? 'Unfollow' : 'Follow' }</a>`
            if (data.isFollowed) {
                document.getElementById('followerCount').textContent = parseInt(document.getElementById('followerCount').textContent, 10) + 1;
                showToast('You have followed ' + data.displayName, 'success');
            } else if (!data.isFollowed) {
                document.getElementById('followerCount').textContent = parseInt(document.getElementById('followerCount').textContent, 10) - 1;
                showToast('You have unfollowed ' + data.displayName, 'success');
            }
        }).catch(error => {
            console.error('Error while following/unfollowing:', error)
            showToast('Error while following/unfollowing');
        });
    }


document.addEventListener('DOMContentLoaded', function() {
    function showToast(message, type = "error") {
        Toastify({
            text: message,
            style: {
                borderRadius: "10px",
                color: "#fff",
                padding: "15px 10px",
                background: type === "success" ? "#28a745" : "#ff4141",
            },
            duration: 2000,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
        }).showToast();
    }



        const changeAvatarLink = document.getElementById('changeAvatarLink');
        const avatarFileInput = document.getElementById('avatarFileInput');
    
        // Trigger file input click when "Change Avatar" link is clicked
        changeAvatarLink?.addEventListener('click', function(event) {
            event.preventDefault();
            avatarFileInput.click();
        });
    
        // Handle avatar file selection
        avatarFileInput?.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('avatar', file); // Append the file to the FormData
    
                fetch('/user/update-avatar', {
                    method: 'PATCH',
                    credentials: 'same-origin',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        showToast('Failed to update avatar. Please try again.');
                    }
                    return response.json();
                })
                .then(data => {
                    showToast('Avatar updated successfully.', 'success');
                    // Refresh the page to reflect changes
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error updating avatar:', error);
                    showToast('Failed to update avatar. Please try again.');
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
        blogsContainer.innerHTML = ''; // Clear the container
        blogs.forEach(blog => blogsContainer.appendChild(blog)); // Append each blog element
    }

    // Filter blogs by category
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
        renderBlogs(filteredBlogs); // Re-render the filtered blogs
    });

    // Sort blogs by the selected criteria
    sortLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sort = link.getAttribute('data-sort');
            const order = link.getAttribute('data-order');

            let sortedBlogs = [...filteredBlogs]; // Start with the currently filtered blogs

            if (sort === 'likesCount' || sort === 'dislikesCount') {
                sortedBlogs.sort((a, b) => {
                    const aCountElement = a.querySelector(`.${sort} span`);
                    const bCountElement = b.querySelector(`.${sort} span`);

                    const aCount = aCountElement ? parseInt(aCountElement.textContent.trim(), 10) : 0;
                    const bCount = bCountElement ? parseInt(bCountElement.textContent.trim(), 10) : 0;

                    // return order === 'asc' ?  aCount - bCount : bCount - aCount ;
                    return order === 'asc' ?  bCount - aCount : aCount - bCount ;
                });
            } else if (sort === 'updatedAt') {
                sortedBlogs.sort((a, b) => {
                    const aDateElement = a.querySelector('.date');
                    const bDateElement = b.querySelector('.date');

                    const aDate = aDateElement ? new Date(aDateElement.getAttribute('data-date')) : new Date(0);
                    const bDate = bDateElement ? new Date(bDateElement.getAttribute('data-date')) : new Date(0);

                    // Check if both dates are valid
                    if (isNaN(aDate) || isNaN(bDate)) {
                        showToast('Invalid date encountered during sorting.');
                        return 0; // Treat invalid dates as equal
                    }

                    return order === 'asc' ? aDate - bDate : bDate - aDate;
                });
            }

            // Set the clicked link as active
            sortLinks.forEach(link => link.classList.remove('active'));
            e.target.classList.add('active');

            renderBlogs(sortedBlogs); // Re-render the sorted blogs
        });
    });
        
});
