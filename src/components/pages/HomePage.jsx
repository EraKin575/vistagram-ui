// src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import PostModal from '../PostModal';
function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  // State to manage the currently selected post for the modal
  const [selectedPost, setSelectedPost] = useState(null);

  // Helper to find and parse image URL from content
  const parsePostContent = (content) => {
    const match = content.match(/\[Image: (.*?)\]/);
    const imageUrl = match ? match[1] : null;
    const text = content.replace(/\[Image: (.*?)\]/, '').trim();
    return { text, imageUrl };
  };
  
  // Fetch posts when the component loads
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get('/posts?filter=recent');
        const formattedPosts = (response.data || []).map(post => ({
          ...post,
          ...parsePostContent(post.content)
        }));
        setPosts(formattedPosts);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // --- COMPLETED FUNCTIONS ---

  const handleLike = async (postId) => {
    try {
      await api.post(`/like?id=${postId}`);
      // Optimistically update the UI to feel responsive
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ));
    } catch (error) {
      console.error("Failed to like post:", error);
      // Let the user know if they've already liked it
      alert(error.response?.data || "You may have already liked this post.");
    }
  };

  const handleDislike = async (postId) => {
    try {
      await api.post(`/dislike?id=${postId}`);
      // Optimistically update the UI to feel responsive
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, dislikes: (p.dislikes || 0) + 1 } : p
      ));
    } catch (error) {
      console.error("Failed to dislike post:", error);
      // Let the user know if they've already disliked it
      alert(error.response?.data || "You may have already disliked this post.");
    }
  };

  const handleShare = async (postId) => {
    try {
        await api.post(`/share?id=${postId}`);
        // Copy the post link to the clipboard
        navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
        alert('Post link copied to clipboard!');
        // Optimistically update the UI
        setPosts(posts.map(p => 
          p.id === postId ? { ...p, share_count: (p.share_count || 0) + 1 } : p
        ));
    } catch(error) {
        console.error("Failed to share post:", error);
        alert("Could not share the post. Please try again.");
    }
  };

  if (loading) return <p className="text-center text-gray-500 mt-8">Loading posts...</p>;

  return (
    // Use a React Fragment to return multiple elements
    <>
      <div className="space-y-8">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">No posts yet. Be the first to create one!</p>
        ) : (
          posts.map(post => (
            // Make the entire card clickable to open the modal
            <div 
              key={post.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105 cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              {post.imageUrl && (
                <img src={post.imageUrl} alt={post.title} className="w-full h-96 object-cover" />
              )}
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{post.title}</h3>
                {/* Truncate long text to 2 lines on the main feed */}
                <p className="text-gray-700 mb-4 line-clamp-2">{post.text}</p>
                <div className="text-sm text-gray-500 mb-4">
                  <span>Posted by: User {post.user_id.substring(0, 8)}...</span>
                  <span className="mx-2">·</span>
                  <span>{new Date(post.created_at).toLocaleString()}</span>
                </div>
                {/* Stop propagation so clicking buttons doesn't open the modal */}
                <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                   <button onClick={() => handleLike(post.id)} className="flex items-center space-x-2 text-gray-600 hover:text-red-500">
                      <span>❤️</span> <span>Like ({post.likes})</span>
                   </button>
                   <button onClick={() => handleDislike(post.id)} className="flex items-center space-x-2 text-gray-600 hover:text-blue-500">
                      <span>👎</span> <span>Dislike ({post.dislikes || 0})</span>
                   </button>
                   <button onClick={() => handleShare(post.id)} className="flex items-center space-x-2 text-gray-600 hover:text-indigo-500">
                      <span>🔗</span> <span>Share ({post.share_count || 0})</span>
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Conditionally render the modal when a post is selected */}
      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}
    </>
  );
}

export default HomePage;
