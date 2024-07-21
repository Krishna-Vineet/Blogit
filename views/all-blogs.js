document.addEventListener('DOMContentLoaded', function () {
    const blogsGrid = document.querySelector('.blogs-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Dummy data for demonstration
    const blogs = [
        {
            id: 1,
            title: "Latest Blog Post 1",
            category: "latest",
            image: "https://via.placeholder.com/300",
            author: "John Doe",
            date: "July 20, 2024",
            content: "Lorem ipsum dolor sit amet consectetur adipisicing elit."
        },
        {
            id: 2,
            title: "Trending Blog Post 1",
            category: "trending",
            image: "https://via.placeholder.com/300",
            author: "Jane Doe",
            date: "July 18, 2024",
            content: "Lorem ipsum dolor sit amet consectetur adipisicing elit."
        },
        // Add more blog objects as needed
    ];

    // Function to create blog cards
    function createBlogCards(filteredBlogs) {
        blogsGrid.innerHTML = '';
        filteredBlogs.forEach(blog => {
            const blogCard = document.createElement('div');
            blogCard.classList.add('blog-card');
            blogCard.innerHTML = `
                <img src="${blog.image}" alt="${blog.title}">
                <div class="blog-content">
                    <h3>${blog.title}</h3>
                    <p>${blog.content}</p>
                    <div class="blog-meta">
                        <div class="author">
                            <img src="https://i.pravatar.cc/100" alt="${blog.author}">
                            <span>${blog.author}</span>
                        </div>
                        <span>${blog.date}</span>
                    </div>
                </div>
            `;
            blogsGrid.appendChild(blogCard);
        });
    }

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

    // Initially display all blogs
    createBlogCards(blogs);
});
