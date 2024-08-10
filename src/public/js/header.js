

document.addEventListener('DOMContentLoaded', function() {
        fetch('/header-data')
            .then(response => response.json())
            .then(data => {
                const user = data.user;
                const trendingBlogs = data.trendingBlogs;
                const topAuthors = data.topAuthors;
                const followedUserBlogs = data.followedUserBlogs;

                // Populate user information
                const userProfile = document.getElementById('user-profile');
                if (user) {
                    userProfile.innerHTML = `<a href="/user/profile/${user._id}"><img src="${user.avatar || 'https://i.pravatar.cc/100'}" alt="User Avatar"></a>`;
                } else {
                    userProfile.innerHTML = '<button class="sign-in" onclick="location.href=\'/login\'"><i class="fa fa-user"></i> Sign In</button>';
                }

                // Populate trending blogs
                const trendingPosts = document.getElementById('trendingPosts');
                trendingPosts.innerHTML = ''; // Clear existing content
                trendingBlogs.forEach(blog => {
                    trendingPosts.innerHTML += `
                        <li class="blog-banner">
                            <img src="${blog.image}" alt="Blog Image">
                            <div class="blog-details">
                                <h3>${blog.title}</h3>
                                <p>by ${blog.author.username}</p>
                            </div>
                        </li>`;
                });

                // Populate top authors
                const topAuthorsList = document.getElementById('topAuthors');
                topAuthorsList.innerHTML = ''; // Clear existing content
                topAuthors.forEach(author => {
                    topAuthorsList.innerHTML += `
                        <li class="author-banner">
                            <img src="${author.avatar || 'https://i.pravatar.cc/100'}" alt="Author Avatar">
                            <div class="author-details">
                                <h3>${author.username}</h3>
                            </div>
                        </li>`;
                });

                // Populate followed user blogs if user is logged in
                if (user) {
                    const followedBlogsSection = document.getElementById('followedBlogsSection');
                    if (followedUserBlogs.length > 0) {
                    followedBlogsSection.innerHTML = '<h2>Blogs from People I Follow</h2><ul id="followedUsersBlogs"></ul>';
                    }
                    const followedUsersBlogs = document.getElementById('followedUsersBlogs');
                    followedUsersBlogs.innerHTML = ''; // Clear existing content
                    followedUserBlogs.forEach(blog => {
                        followedUsersBlogs.innerHTML += `
                            <li class="blog-banner">
                                <img src="${blog.image}" alt="Blog Image">
                                <div class="blog-details">
                                    <h3>${blog.title}</h3>
                                    <p>by ${blog.author.username}</p>
                                </div>
                            </li>`;
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching header data:', error);
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
    
    function searchBlogs() {
        // Get the search query
        const query = document.getElementById('searchInput').value.toLowerCase();
        
        // Remove existing highlights
        removeHighlights();
    
        if (query) {
            // Get all text nodes
            const content = document.querySelectorAll('.content');
            content.forEach(container => {
                highlightText(container, query);
            });
        }
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