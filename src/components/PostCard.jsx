import { useState, useEffect } from 'react';
import {
  Heart,
  Share,
  MoreHorizontal,
  Edit,
  Trash2,
  ThumbsDown,
} from 'lucide-react';
import { postsAPI } from './utils/api';

const PostCard = ({ post, onUpdate, onDelete, isOwner = false, currentUserId }) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [dislikes, setDislikes] = useState(post.dislikes || 0);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isDisliked, setIsDisliked] = useState(post.isDisliked || false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleLike = async () => {
    if (loading || actionLoading) return;
    
    setActionLoading('like');
    const wasLiked = isLiked;
    const wasDisliked = isDisliked;
    
    // Optimistic update
    if (wasLiked) {
      setLikes(prev => Math.max(0, prev - 1));
      setIsLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setIsLiked(true);
      // Remove dislike if it was disliked
      if (wasDisliked) {
        setDislikes(prev => Math.max(0, prev - 1));
        setIsDisliked(false);
      }
    }

    try {
      const response = await postsAPI.likePost(post.id);
      
      // Update with server response if available
      if (response.data) {
        setLikes(response.data.likes || likes);
        setDislikes(response.data.dislikes || dislikes);
        setIsLiked(response.data.isLiked !== undefined ? response.data.isLiked : !wasLiked);
        setIsDisliked(response.data.isDisliked !== undefined ? response.data.isDisliked : false);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      
      // Revert optimistic update on error
      setLikes(post.likes || 0);
      setDislikes(post.dislikes || 0);
      setIsLiked(wasLiked);
      setIsDisliked(wasDisliked);
      
      alert('Failed to like post. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDislike = async () => {
    if (loading || actionLoading) return;
    
    setActionLoading('dislike');
    const wasLiked = isLiked;
    const wasDisliked = isDisliked;
    
    // Optimistic update
    if (wasDisliked) {
      setDislikes(prev => Math.max(0, prev - 1));
      setIsDisliked(false);
    } else {
      setDislikes(prev => prev + 1);
      setIsDisliked(true);
      // Remove like if it was liked
      if (wasLiked) {
        setLikes(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      }
    }

    try {
      const response = await postsAPI.dislikePost(post.id);
      
      // Update with server response if available
      if (response.data) {
        setLikes(response.data.likes || likes);
        setDislikes(response.data.dislikes || dislikes);
        setIsLiked(response.data.isLiked !== undefined ? response.data.isLiked : false);
        setIsDisliked(response.data.isDisliked !== undefined ? response.data.isDisliked : !wasDisliked);
      }
    } catch (error) {
      console.error('Error disliking post:', error);
      
      // Revert optimistic update on error
      setLikes(post.likes || 0);
      setDislikes(post.dislikes || 0);
      setIsLiked(wasLiked);
      setIsDisliked(wasDisliked);
      
      alert('Failed to dislike post. Please try again.');
    } finally {
      setActionLoading('');
    }
  };

  const handleShare = async () => {
    if (loading) return;
    
    try {
      // Call the share API endpoint
      await postsAPI.sharePost(post.id);
      
      // Create shareable content
      const shareData = {
        title: post.title,
        text: `Check out this post: ${post.title}`,
        url: `${window.location.origin}/post/${post.id}`,
      };

      // Try native sharing first (mobile devices)
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        const shareText = `${post.title}\n\n${post.content}\n\nView on Visitgram: ${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        
        // Show success message
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = 'Post link copied to clipboard!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      
      // Fallback: just copy the URL
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
        alert('Post link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        alert('Unable to share post. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    const confirmMessage = `Are you sure you want to delete "${post.title}"? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      await postsAPI.deletePost(post.id);
      
      // Show success message
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'Post deleted successfully!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
      
      // Call the delete callback
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(`Failed to delete post: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleEdit = () => {
    if (onUpdate) {
      onUpdate(post);
    }
    setShowMenu(false);
  };

  // Format date more nicely
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {(post.username || post.author || 'Unknown')?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {post.username || post.author || 'Anonymous'}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(post.created_at || post.createdAt)}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="relative menu-container">
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              aria-label="Post options"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20 py-1">
                <button
                  onClick={handleEdit}
                  disabled={loading}
                  className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <Edit className="w-4 h-4 mr-3 text-gray-500" />
                  <span className="text-gray-700">Edit Post</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center w-full px-4 py-2 text-left hover:bg-red-50 transition-colors text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  <span>Delete Post</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      {(post.image || post.imageUrl) && (
        <div className="relative">
          <img
            src={post.image || post.imageUrl}
            alt={post.title || 'Post image'}
            className="w-full h-auto max-h-96 object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              console.error('Failed to load image:', post.image || post.imageUrl);
            }}
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {post.title}
        </h2>
        <p className="text-gray-700 whitespace-pre-wrap break-words line-clamp-4">
          {post.content}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center space-x-1">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={loading || actionLoading === 'like'}
            title={isLiked ? 'Unlike this post' : 'Like this post'}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all duration-200 min-w-[60px] justify-center ${
              isLiked
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'hover:bg-gray-200 text-gray-600 hover:text-red-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Heart 
              className={`w-4 h-4 transition-all ${
                isLiked ? 'fill-current scale-110' : ''
              } ${actionLoading === 'like' ? 'animate-pulse' : ''}`} 
            />
            <span className="text-sm font-medium">{likes}</span>
          </button>

          {/* Dislike Button */}
          <button
            onClick={handleDislike}
            disabled={loading || actionLoading === 'dislike'}
            title={isDisliked ? 'Remove dislike' : 'Dislike this post'}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all duration-200 min-w-[60px] justify-center ${
              isDisliked
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsDown 
              className={`w-4 h-4 transition-all ${
                isDisliked ? 'fill-current scale-110' : ''
              } ${actionLoading === 'dislike' ? 'animate-pulse' : ''}`} 
            />
            <span className="text-sm font-medium">{dislikes}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            disabled={loading}
            title="Share this post"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-gray-200 text-gray-600 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share className="w-4 h-4" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>

        {/* Post Stats (optional) */}
        <div className="text-xs text-gray-400">
          {post.shares > 0 && (
            <span>{post.shares} share{post.shares !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;