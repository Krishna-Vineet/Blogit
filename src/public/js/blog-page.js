const blogContainer = document.getElementById('blog-container');
const blogId = blogContainer.getAttribute('data-blog-id');
const userId = blogContainer.getAttribute('data-user-id');
let commentsData;
        
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

function incrementViewCount(blogId) {
    fetch(`/blog/incrementViewCount/${blogId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => data.message)
    .catch(error => {
        console.error('Error updating view count:', error);
        showToast('Error updating view count');
    });
}
function incrementShareCount(blogId) {
    fetch(`/blog/incrementShareCount/${blogId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => data.message)
    .catch(error => {
        console.error('Error updating share count:', error);
        showToast('Error updating share count');
    });
}
function postComment() {
    if (!commentInput || !commentInput.value.trim()) {
        showToast('Please enter a comment.');
        return;
    }

    if (!userId) {
        showToast('You must be logged in to comment.');
        return;
    }

    const commentData = {
        text: commentInput.value.trim(),
    };
    
    fetch(`/comment/add/${blogId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // You may need to add Authorization header if JWT token is used
            // 'Authorization': 'Bearer ' + token,
        },
        credentials: 'same-origin',
        body: JSON.stringify(commentData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to post comment');
        }
        return response.json();
    })
    .then(data => {
        
        // Clear the input
        commentInput.value = '';

        // fetch all comments
         fetchComments(blogId);

        
    })
    .catch(error => {
        console.error('Error adding comment:', error);
        showToast('There was an error adding your comment. Please try again later.');
    });
}
function generateComments(comments, filter) {
    const commentsContainer = document.getElementById('commentsContainer');
    commentsContainer.innerHTML = ''; // Clear existing comments

    // Sort comments based on the selected filter
    if (filter === 'popular') {
        comments.sort((a, b) => b.likesCount - a.likesCount); // Sort by likes in descending order
    } 
    

    // Iterate through the sorted comments and generate HTML
    comments.forEach(comment => {
        commentsContainer.innerHTML +=
            `<div class="comment">
                <img onclick="window.location.href='/user/profile/${comment.author._id}'" src="${ comment.author.avatar || 'https://res.cloudinary.com/blogit-cloud/image/upload/v1749215907/808ad011a0f8bfe16369175cede99aa7_xzppy3.webp' }" alt="avatar">
                <div class="content">
                    <div class="commentator">
                        <h4 onclick="window.location.href='/user/profile/${comment.author._id}'" class="name">${ comment.author.displayName }</h4>
                        <span id="commentDate-${ comment._id }" class="date"> &nbsp;  ${ new Date(comment.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        }).replace(/ /g, ' ').replace(' 202', ', 202') } <span id="edited-${ comment._id }"> ${comment.edited ? '(Edited)' : ''} </span> </span>
                        ${ comment.author._id === userId ?
                            `<a onclick="editComment('${comment._id}')" class="edit-comment"><i class="fa fa-edit"></i>Edit</a>
                            <a onclick="deleteComment('${comment._id}')" class="delete-comment"><i class="fa fa-trash"></i>Delete</a>`
                             : '' }
                    </div>
                    <p id="commentText-${ comment._id }" class="text">${ comment.content }</p>
                    <div class="reaction" id="comment-${ comment._id }">
                        <p onclick="likeTheComment('${comment._id}')"><i class="${ comment.likedByUser ? 'liked' : '' } fa fa-thumbs-up"></i>${ comment.likesCount }</p>
                        <p onclick="dislikeTheComment('${comment._id}')"><i class="${ comment.dislikedByUser ? 'disliked' : '' } fa fa-thumbs-down"></i>${ comment.dislikesCount }</p>
                    </div>
                </div>
            </div>`;
    });
}
function fetchComments(blogId, filter = 'recent') {

    fetch(`/comment/get/${blogId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => data.data)
    .then(data => {
        commentsData = data;
        
        generateComments(commentsData, filter);

        
    })
    .catch(error => {
        console.error('Error fetching comments:', error);
        showToast('Error fetching comments');
    });
}
function likeTheComment(commentId) {
    if (!userId) {
        showToast('You must be logged in to like a comment.');
        return;
    }
    fetch (`/comment/like/${commentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => data.data)
    .then(data => {
        const reaction = document.getElementById(`comment-${commentId}`);
        reaction.innerHTML =
        `<p><i onclick="likeTheComment('${commentId}')" class="${data.likedByUser ? 'liked' : ''} fa fa-thumbs-up"></i>${data.likesCount}</p>
        <p><i onclick="dislikeTheComment('${commentId}')" class="fa fa-thumbs-down"></i>${data.dislikesCount}</p>`
    })
    .catch(error => {
        console.error('Error liking comment:', error);
        showToast('Error liking comment');
    });

    // const likeIcon = document.
}
function dislikeTheComment(commentId) {
    if (!userId) {
        showToast('You must be logged in to dislike a comment.');
        return;
    }
    fetch (`/comment/dislike/${commentId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => data.data)
    .then(data => {
        const reaction = document.getElementById(`comment-${commentId}`);
        reaction.innerHTML =
        `<p><i onclick="likeTheComment('${commentId}')" class="fa fa-thumbs-up"></i>${data.likesCount}</p>
        <p><i onclick="dislikeTheComment('${commentId}')" class="${data.dislikedByUser ? 'disliked' : ''} fa fa-thumbs-down"></i>${data.dislikesCount}</p>`
    })
    .catch(error => {
        console.error('Error liking comment:', error);
        showToast('Error liking comment');
    });
}
function deleteComment(commentId) {
    if (confirm('Are you sure you want to delete this comment?')) {
    fetch (`/comment/delete/${commentId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => data.data)
    .then(data => {
        document.getElementById(`comment-${commentId}`).parentElement.parentElement.outerHTML = '';
    })
    .catch(error => {
        console.error('Error deleting comment:', error);
        showToast('Error deleting comment');
    });
}
}
function editComment(commentId) {
    const commentText = document.getElementById(`commentText-${commentId}`);
    const oldContent = commentText.textContent;
    
    commentText.outerHTML =
    `<textarea class="text commentTextarea" id="commentInput-${commentId}">${oldContent}</textarea><button class="editTextBtn" onclick="updateCommentText('${commentId}')">Post</button>`;
    
    const textarea = document.getElementById(`commentInput-${commentId}`);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    textarea.addEventListener('input', function() {
        this.style.height = 'auto'; // Reset the height to auto to calculate the new height
        this.style.height = (this.scrollHeight) + 'px'; // Set the height based on the scrollHeight
    });
}
function updateCommentText(commentId) {
    
    const commentInput = document.getElementById('commentInput-' + commentId);
    const newContent = commentInput.value;
    fetch (`/comment/edit/${commentId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({text: newContent})
    })
    .then(response => response.json())
    .then(data => data.data)
    .then(data => {
        commentInput.nextSibling.outerHTML = '';
        commentInput.outerHTML = `<p id="commentText-${ commentId }" class="text">${newContent}</p>`;

        document.getElementById(`edited-${commentId}`).innerHTML = `(Edited)`;

        
    })
    .catch(error => {
        console.error('Error updating comment:', error);
        showToast('Error updating comment');
    });
}
function likeBlog() {
    if (!userId) {
        showToast('You must be logged in to like the blog.');
        return;
    }
    fetch(`/blog/like/${blogId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin'
  })
  .then(response => response.json())
  .then(data => data.data)
  .then(data => {
    
      
      document.querySelector('.likes').innerHTML =
      `<i onclick="likeBlog()" class=" ${data.likedByUser ? 'liked' : ''} fa fa-thumbs-up"></i> ${data.likesCount}`
      document.querySelector('.dislikes').innerHTML =
      `<i onclick="dislikeBlog()" class="fa fa-thumbs-down"></i> ${data.dislikesCount}`
      
      
  })
  .catch(error => {
    console.error('Error liking blog:', error);
    showToast('Error liking blog');
  });
}
function dislikeBlog() {
    if (!userId) {
        showToast('You must be logged in to dislike the blog.');
        return;
    }
    fetch(`/blog/dislike/${blogId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin'
  })
  .then(response => response.json())
  .then(data => data.data)
  .then(data => {
    

      document.querySelector('.likes').innerHTML =
      `<i onclick="likeBlog()" class="fa fa-thumbs-up"></i> ${data.likesCount}`
      document.querySelector('.dislikes').innerHTML =
      `<i onclick="dislikeBlog()" class=" ${data.dislikedByUser ? 'disliked' : ''} fa fa-thumbs-down"></i> ${data.dislikesCount}`

      
  })
  .catch(error => console.error('Error fetching comments:', error));
}
function deleteBlog() {
    if (confirm('Are you sure you want to delete this blog?')) {
        fetch (`/blog/delete/${blogId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            
            if (data.success) {
                if (document.referrer) {
                    window.location.href = document.referrer;
                } else {
                    window.location.href = '/'; // Redirect to home page
                }
            } else {
                showToast('Unable to delete Blog !');
            }
        })
        .catch(error => {
            console.error('Error deleting blog:', error);
            showToast('Error deleting blog');
        });
    }
}
function toggleFollow(authorId) {
    if (!userId) {
        showToast('You must be logged in to follow.');
        return;
    }
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
        `<button id="followBtn" class="${ data.isFollowed ? 'followed' : '' }" onclick="toggleFollow('${ authorId }')">${ data.isFollowed ? 'Unfollow' : 'Follow' }</button>`
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




  // Assuming you have a blogId available
document.addEventListener('DOMContentLoaded', () => {
    fetchComments(blogId);
    incrementViewCount(blogId);
    const viewSpan = document.getElementById('view-count');
    // viewSpan.textContent = parseInt(viewSpan.textContent, 10) + 1;


    const blogUrl = encodeURIComponent(`http://localhost:4000/blog/view/${blogId}`);
    const message = encodeURIComponent("Hey, I found this really Interesting blog on Blogit!! Do check it out : ");

    document.querySelector('#shareButton-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${blogUrl}&quote=${message}`;
    document.querySelector('#shareButton-facebook').target = '_blank';
    document.querySelector('#shareButton-twitter').href = `https://twitter.com/intent/tweet?text=${message}&url=${blogUrl}`;
    document.querySelector('#shareButton-twitter').target = '_blank';
    document.querySelector('#shareButton-linkedin').href = `https://www.linkedin.com/shareArticle?mini=true&url=${blogUrl}&title=${message}`;
    document.querySelector('#shareButton-linkedin').target = '_blank';
    document.querySelector('#shareButton-whatsapp').href = `https://api.whatsapp.com/send?text=${message} ${blogUrl}`;
    document.querySelector('#shareButton-whatsapp').target = '_blank';
    document.querySelector('#shareButton-telegram').href = `https://t.me/share/url?url=${blogUrl}&text=${message}`;
    document.querySelector('#shareButton-telegram').target = '_blank';


  });

document.getElementById('filter').addEventListener('change', function () {
  const selectedFilter = this.value;
  fetchComments(blogId, selectedFilter);
});

  
  const ShareBtns = document.querySelectorAll('.share-blog');
  ShareBtns.forEach(button => {
    button.addEventListener('click', () => {
        incrementShareCount(blogId);

        // Perform any additional logic or actions when the button is clicked

        document.querySelectorAll('.share-count').forEach(span => {
            const currentCount = parseInt(span.textContent, 10);
            span.textContent = currentCount + 1;
        });

    });
  });
  
  
const commentInput = document.getElementById('commentInput');



const showAllBtn = document.getElementById('showAllComments');
showAllBtn.addEventListener('click', () => {
    const commentsContainer = document.getElementById('commentsContainer');
    
    commentsContainer.style.maxHeight = commentsContainer.style.maxHeight === 'none' ? '500px' : 'none';
    showAllBtn.innerText = showAllBtn.innerText === 'Show All' ? 'Show Less' : 'Show All';
});


document.getElementById('shareButton').addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hey, I found this really interesting blog on Blogit!!',
          text: 'Do check it out : ',
          url: `https://blogit-gamma.vercel.app/blog/view/${blogId}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        showToast('Error sharing');
      }
    } else {
      // Fallback logic if the Web Share API is not supported
      showAllBtn('Sharing is not supported by your browser. Please copy the link and share manually.');
    }
  });
