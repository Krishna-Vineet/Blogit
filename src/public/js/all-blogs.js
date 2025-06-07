document.addEventListener('DOMContentLoaded', function() {
    const categorySelect = document.getElementById('categorySelect');
    const sortLinks = document.querySelectorAll('.sortOptions a');
    const blogsContainer = document.getElementById('blogsGrid');
    
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
                        console.warn('Invalid date encountered during sorting.');
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
