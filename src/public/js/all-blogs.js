document.addEventListener('DOMContentLoaded', function () {
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Filter blogs based on the selected category
    function filterBlogs(category) {
        const filteredBlogs = blogs.filter(blog => blog.category === category);
        createBlogCards(filteredBlogs);
    }

    // Event listeners for filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            const category = this.getAttribute('data-filter');
            filterBlogs(category);
        });
    });

});
