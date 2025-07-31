import { useState } from 'react';
import {
  Heart,
  Share,
  MoreHorizontal,
  Edit,
  Trash2,
  ThumbsDown,
} from 'lucide-react';
import { postsAPI } from './utils/api';

const PostCard = ({ post, onUpdate, onDelete, isOwner = false }) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [dislikes, setDislikes] = useState(post.dislikes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUpdatedPost = async () => {
    try {
      const updated = await postsAPI.getPostById(post.id);
      setLikes(updated.likes || 0);
      setDislikes(updated.dislikes || 0);
    } catch (err) {
      console.error('Failed to fetch updated post:', err);
    }
  };

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await postsAPI.likePost(post.id);
      setIsLiked(true);
      setIsDisliked(false);
      await fetchUpdatedPost();
    } catch (err) {
      console.error('Error liking post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await postsAPI.dislikePost(post.id);
      setIsLiked(false);
      setIsDisliked(true);
      await fetchUpdatedPost();
    } catch (err) {
      console.error('Error disliking post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await postsAPI.sharePost(post.id);
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(post.id);
        onDelete(post.id);
      } catch (err) {
        console.error('Error deleting post:', err);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {post.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{post.username || 'Anonymous'}</h3>
            <p className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={() => {
                    onUpdate(post);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleDelete();
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      {post.image && (
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-auto object-cover"
        />
      )}

      {/* Content */}
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={loading}
            title="Like"
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
              isLiked
                ? 'bg-red-100 text-red-600'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likes}</span>
          </button>

          {/* Dislike */}
          <button
            onClick={handleDislike}
            disabled={loading}
            title="Dislike"
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
              isDisliked
                ? 'bg-gray-300 text-gray-800'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <ThumbsDown className={`w-5 h-5 ${isDisliked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{dislikes}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            title="Share"
            className="flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Share className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
