const blogContainer = document.getElementById('blog-container');
const blogId = blogContainer.getAttribute('data-blog-id');
const userId = blogContainer.getAttribute('data-user-id');
let commentsData;
        

function incrementViewCount(blogId) {
    fetch(`/blog/incrementViewCount/${blogId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => data.message)
    .catch(error => console.error('Error updating view count:', error));
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
    .catch(error => console.error('Error updating share count:', error));
  }
  function postComment() {
    if (!commentInput || !commentInput.value.trim()) {
        alert('Comment cannot be empty');
        return;
    }

    const commentData = {
        text: commentInput.value.trim(),
    };
    console.log(commentData);
    
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
        console.log('Comment added successfully:', data.data);
        
        // Clear the input
        commentInput.value = '';

        // fetch all comments
         fetchComments(blogId);

        
    })
    .catch(error => {
        console.error('Error adding comment:', error);
        alert('There was an error adding your comment. Please try again later.');
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
                <img src="${ comment.author.avatar || 'https://i.pravatar.cc/100' }" alt="avatar">
                <div class="content">
                    <div class="commentator">
                        <h4 class="name">${ comment.author.username }</h4>
                        <span id="commentDate-${ comment._id }" class="date"> &nbsp;  ${ comment.createdAt.toLocaleString('en-In') } </span>
                        ${ comment.createdAt !== comment.updatedAt ? '<span class="edited">&nbsp; (edited)</span>' : '' }
                        ${ comment.author._id === userId ?
                            `<a onclick="editComment('${comment._id}')" class="edit-comment"><i class="fa fa-edit"></i>Edit</a>
                            <a onclick="deleteComment('${comment._id}')" class="delete-comment"><i class="fa fa-trash"></i>Delete</a>`
                             : '' }
                    </div>
                    <p id="commentText-${ comment._id }" class="text">${ comment.content }</p>
                    <div class="reaction" id="comment-${ comment._id }">
                        <p><i onclick="likeTheComment('${comment._id}')" class="${ comment.likedByUser ? 'liked' : '' } fa fa-thumbs-up"></i>${ comment.likesCount }</p>
                        <p><i onclick="dislikeTheComment('${comment._id}')" class="${ comment.dislikedByUser ? 'disliked' : '' } fa fa-thumbs-down"></i>${ comment.dislikesCount }</p>
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
        console.log(filter);
        
        generateComments(commentsData, filter);

        
    })
    .catch(error => console.error('Error fetching comments:', error));
  }
function likeTheComment(commentId) {
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
        // console.log(data);
        const reaction = document.getElementById(`comment-${commentId}`);
        reaction.innerHTML =
        `<p><i onclick="likeTheComment('${commentId}')" class="${data.likedByUser ? 'liked' : ''} fa fa-thumbs-up"></i>${data.likesCount}</p>
        <p><i onclick="dislikeTheComment('${commentId}')" class="fa fa-thumbs-down"></i>${data.dislikesCount}</p>`
    })
    .catch(error => console.error('Error liking comment:', error));

    // const likeIcon = document.
}
function dislikeTheComment(commentId) {
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
        // console.log(data);
        const reaction = document.getElementById(`comment-${commentId}`);
        reaction.innerHTML =
        `<p><i onclick="likeTheComment('${commentId}')" class="fa fa-thumbs-up"></i>${data.likesCount}</p>
        <p><i onclick="dislikeTheComment('${commentId}')" class="${data.dislikedByUser ? 'disliked' : ''} fa fa-thumbs-down"></i>${data.dislikesCount}</p>`
    })
    .catch(error => console.error('Error liking comment:', error));
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
        console.log(data);
        document.getElementById(`comment-${commentId}`).parentElement.parentElement.outerHTML = '';
    })
    .catch(error => console.error('Error deleting comment:', error));
}
}
function editComment(commentId) {
    const commentText = document.getElementById(`commentText-${commentId}`);
    const oldContent = commentText.textContent;
    // console.log("Old content:", oldContent);
    
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
    const oldContent = commentInput.value;
    const newContent = commentInput.value;
    if (newContent === oldContent) {
        // console.log("No changes made to the comment.");
        commentInput.nextSibling.outerHTML = '';
        commentInput.outerHTML = `<p id="commentText-${ commentId }" class="text">${newContent}</p>`;
        return;
    }
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
        // console.log("Updated comment:", data);
        commentInput.nextSibling.outerHTML = '';
        commentInput.outerHTML = `<p id="commentText-${ commentId }" class="text">${newContent}</p>`;

        const commentDateElement = document.getElementById(`commentDate-${commentId}`);

        // Check if the element already contains the "(edited)" span
        if (!commentDateElement.nextSibling.innerHTML == '(edited)') {
            // If not, append the "(edited)" span
            commentDateElement.outerHTML += `<span class="edited">&nbsp; (edited)</span>`;
        }

        
    })
    .catch(error => console.error('Error updating comment:', error));
}






  // Assuming you have a blogId available
document.addEventListener('DOMContentLoaded', () => {
    fetchComments(blogId);
    incrementViewCount(blogId);
    const viewSpan = document.getElementById('view-count');
    // viewSpan.textContent = parseInt(viewSpan.textContent, 10) + 1;

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
const postCommentBtn = document.getElementById('postCommentBtn');
postCommentBtn.addEventListener('click', postComment);



const showAllBtn = document.getElementById('showAllComments');
showAllBtn.addEventListener('click', () => {
    const commentsContainer = document.getElementById('commentsContainer');
    console.log(commentsContainer.style.maxHeight);
    console.log(showAllBtn.innerText);
    
    commentsContainer.style.maxHeight = commentsContainer.style.maxHeight === 'none' ? '500px' : 'none';
    showAllBtn.innerText = showAllBtn.innerText === 'Show All' ? 'Show Less' : 'Show All';
});


