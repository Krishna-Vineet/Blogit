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

document.addEventListener('DOMContentLoaded', function() {
        fetch('/header-data')
            .then(response => response.json())
            .then(data => data.data)
            .then(data => {
                
                const user = data.user;
                const trendingBlogs = data.trendingBlogs;
                const topAuthors = data.topAuthors;
                const followedUserBlogs = data.followedUserBlogs;

                // Populate user information
                const userProfile = document.getElementById('user-profile');
                if (user) {
                    userProfile.innerHTML = `<a href="/user/profile/${user?._id}"><img src="${user.avatar || 'https://res.cloudinary.com/blogit-cloud/image/upload/v1749215907/808ad011a0f8bfe16369175cede99aa7_xzppy3.webp'}" alt="User Avatar"></a>`;
                } else {
                    userProfile.innerHTML = '<button class="sign-in" onclick="location.href=\'/login\'"><i class="fa fa-user"></i> Sign In</button>';
                }

                // Populate trending blogs
                const trendingPosts = document.getElementById('trendingPosts');
                trendingPosts.innerHTML = ''; // Clear existing content
                const trendingPostsHeading = document.createElement('h2');
                trendingPostsHeading.textContent = 'Trending Blogs';
                trendingPosts.parentElement.insertBefore(trendingPostsHeading, trendingPosts);
                trendingBlogs.forEach(blog => {
                    trendingPosts.innerHTML += `
                        <li onclick="location.href='/blog/view/${blog._id}'" class="blog-banner">
                            <img src="${blog.image}" alt="Blog Image">
                            <div class="blog-details">
                                <h3>${blog.title}</h3>
                                <p>by ${blog.author.displayName}</p>
                            </div>
                        </li>`;
                });

                // Populate top authors
                const topAuthorsList = document.getElementById('topAuthors');
                topAuthorsList.innerHTML = ''; // Clear existing content
                const topAuthorHeading = document.createElement('h2');
                topAuthorHeading.textContent = 'Popular Authors';
                topAuthorsList.parentElement.insertBefore(topAuthorHeading, topAuthorsList);                
                topAuthors.forEach(author => {
                    topAuthorsList.innerHTML += `
                        <li onclick="location.href='/user/profile/${author._id}'" class="author-banner">
                            <img src="${author.avatar || 'https://res.cloudinary.com/blogit-cloud/image/upload/v1749215907/808ad011a0f8bfe16369175cede99aa7_xzppy3.webp'}" alt="Author Avatar">
                            <div class="author-details">
                                <h3>${author.displayName}</h3>
                            </div>
                        </li>`;
                });

                // Populate followed user blogs if user is logged in
                if (user) {
                    const followedBlogsSection = document.getElementById('followedBlogsSection');
                    if (followedUserBlogs.length > 0) {
                    followedBlogsSection.innerHTML = '<h2>Blogs from People I Follow</h2><ul id="followedUsersBlogs"></ul>';
                    }
                    // const followedBlogsSection = document.getElementById('followedUsersBlogs');
                    followedBlogsSection.innerHTML = ''; // Clear existing content
                    followedUserBlogs.forEach(blog => {
                        followedBlogsSection.innerHTML += `
                            <li onclick="location.href='/blog/view/${blog._id}'" class="blog-banner">
                                <img src="${blog.image}" alt="Blog Image">
                                <div class="blog-details">
                                    <h3>${blog.title}</h3>
                                    <p>by ${blog.author.displayName}</p>
                                </div>
                            </li>`;
                    });
                }
                
                
            })
                .catch(error => {
                console.error('Error fetching header data:', error);
                showToast('Error fetching header data');
            });
        

        
    });



    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.style.transform === 'translateX(0px)') {
            sidebar.style.transform = 'translateX(-400px)';
        } else {
            sidebar.style.transform = 'translateX(0px)';
        }
    }

    async function addBlog() {
        try {
            const response = await fetch('/add-blog', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                showToast(errorData.errorMessage);
            } else {
                // All good, now redirect to render the page
                window.location.href = '/add-blog';
            }
        } catch (error) {
            console.error('Error:', error);
            showToast(error.errorMessage);
        }
    }

    
    function searchBlogs() {
        // Get the search query
        const query = document.getElementById('searchInput').value.toLowerCase();

        if (!query) {
            showToast('Please enter a search query.');
            return;
        }
        
        window.location.href = `/search-blog?query=${encodeURIComponent(query)}`;
    }
    
    
    function highlightText(container, query) {
        // Use a TreeWalker to traverse text nodes
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        let node;
        
        while (node = walker.nextNode()) {
            const text = node.nodeValue;
            const index = text.toLowerCase().indexOf(query);
            if (index !== -1) {
                const span = document.createElement('span');
                span.className = 'highlight';
                const matchedText = text.substr(index, query.length);
                span.appendChild(document.createTextNode(matchedText));
    
                const after = document.createTextNode(text.substr(index + query.length));
                node.nodeValue = text.substr(0, index);
                node.parentNode.insertBefore(span, node.nextSibling);
                node.parentNode.insertBefore(after, span.nextSibling);
            }
        }
    }
    
    function removeHighlights() {
        const highlights = document.querySelectorAll('.highlight');
        highlights.forEach(span => {
            const parent = span.parentNode;
            parent.replaceChild(document.createTextNode(span.textContent), span);
            parent.normalize(); // Combine adjacent text nodes
        });
    }
    
    
    function checkEnter(event) {
        if (event.key === 'Enter') {
            searchBlogs();
        }
    }