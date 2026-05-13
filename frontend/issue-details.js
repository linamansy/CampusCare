// Issue Details Frontend Logic
const API_BASE = 'http://localhost:3000/api';
let currentUserId = null; // This should come from authentication
let currentIssueId = null;

// Get issue ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
currentIssueId = parseInt(urlParams.get('id'));

if (!currentIssueId) {
    alert('No issue ID provided');
}

// Mock authentication - replace with real auth
currentUserId = 1; // Example user ID

// Load issue details
async function loadIssue() {
    try {
        const response = await fetch(`${API_BASE}/issues/${currentIssueId}`);
        const data = await response.json();

        if (data.success) {
            const issue = data.data;
            document.getElementById('issue-title').textContent = issue.title;
            document.getElementById('issue-status').textContent = issue.status;
            document.getElementById('issue-category').textContent = issue.category;
            document.getElementById('issue-location').textContent = issue.location;
            document.getElementById('issue-description').textContent = issue.description;
            document.getElementById('issue-creator').textContent = issue.user.name;

            // Show verify button if user is creator and status is Resolved
            if (issue.userId === currentUserId && issue.status === 'Resolved') {
                document.getElementById('verify-section').style.display = 'block';
            }
        } else {
            alert('Error loading issue: ' + (data.error || data.message));
        }
    } catch (error) {
        console.error('Error loading issue:', error);
    }
}

// Load comments
async function loadComments() {
    try {
        const response = await fetch(`${API_BASE}/issues/${currentIssueId}/comments`);
        const data = await response.json();
        const comments = data.success ? data.data : [];

        const container = document.getElementById('comments-container');
        container.innerHTML = '<h3>Comments</h3>';

        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment';
            commentDiv.innerHTML = `
                <div class="comment-author">${comment.user.name} (${comment.user.role})</div>
                <div>${comment.text}</div>
                <small>${new Date(comment.createdAt).toLocaleString()}</small>
            `;
            container.appendChild(commentDiv);
        });
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Submit comment
document.getElementById('submit-comment').addEventListener('click', async () => {
    const text = document.getElementById('comment-text').value.trim();
    if (!text) {
        alert('Please enter a comment');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/issues/${currentIssueId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': currentUserId.toString()
            },
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('comment-text').value = '';
            loadComments(); // Refresh comments
            loadNotifications(); // Refresh notifications
        } else {
            alert('Error adding comment: ' + (data.error || data.message));
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
});

// Verify resolution
document.getElementById('verify-btn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE}/issues/${currentIssueId}/verify`, {
            method: 'POST',
            headers: {
                'x-user-id': currentUserId.toString()
            }
        });

        const data = await response.json();
        if (data.success) {
            alert('Issue verified successfully!');
            loadIssue(); // Refresh issue status
            loadNotifications(); // Refresh notifications
        } else {
            alert('Error verifying issue: ' + (data.error || data.message));
        }
    } catch (error) {
        console.error('Error verifying issue:', error);
    }
});

// Load notifications
async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE}/issues/notifications`, {
            headers: {
                'x-user-id': currentUserId.toString()
            }
        });

        const data = await response.json();
        if (data.success) {
            const container = document.getElementById('notifications-list');
            container.innerHTML = '';

            data.data.forEach(notification => {
                const notifDiv = document.createElement('div');
                notifDiv.className = `notification ${notification.read ? '' : 'unread'}`;
                notifDiv.innerHTML = `
                    <div>${notification.message}</div>
                    <small>${new Date(notification.createdAt).toLocaleString()}</small>
                    ${!notification.read ? '<button onclick="markRead(' + notification.id + ')">Mark Read</button>' : ''}
                `;
                container.appendChild(notifDiv);
            });

            document.getElementById('notifications').style.display = data.data.length > 0 ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Mark notification as read
async function markRead(notificationId) {
    try {
        const response = await fetch(`${API_BASE}/issues/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'x-user-id': currentUserId.toString()
            }
        });

        const data = await response.json();
        if (data.success) {
            loadNotifications(); // Refresh
        }
    } catch (error) {
        console.error('Error marking notification read:', error);
    }
}

// Load all data on page load
window.addEventListener('load', () => {
    loadIssue();
    loadComments();
    loadNotifications();
});
