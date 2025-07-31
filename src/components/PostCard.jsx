import { useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { postsAPI } from '../utils/api';

const PostCard = ({ post, onUpdate, onDelete, isOwner = false }) => {
  const [likes, setLikes] = useState(post.likes || 0);
  const [dislikes, setDislikes] = useState(post.dislikes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isLiked) {
        setLikes(prev => prev - 1);
        setIsLiked(false);
      } else {
        await postsAPI.likePost(post.id);
        setLikes(prev => prev + 1);
        setIsLiked(true);
        if (isDisliked) {
          setDislikes(prev => prev - 1);
          setIsDisliked(false);
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      if (isDisliked) {
        setDislikes(prev => prev - 1);
        setIsDisliked(false);
      } else {
        await postsAPI.dislikePost(post.id);
        setDislikes(prev => prev + 1);
        setIsDisliked(true);
        if (isLiked) {
          setLikes(prev => prev - 1);
          setIsLiked(false);
        }
      }
    } catch (error) {
      console.error('Error disliking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await postsAPI.sharePost(post.id);
      if (navigator.share) {
        navigator.share({
          title: post.title,
          text: post.content,
          url: window.location.href,
        });
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(post.id);
        onDelete(post.id);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {post.username ? post.username[0].toUpperCase() : 'U'}
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

      {/* Post Image */}
      {post.image && (
        <div className="w-full">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* Post Content */}
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            disabled={loading}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
              isLiked
                ? 'bg-red-100 text-red-600'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likes}</span>
          </button>

          <button
            onClick={handleDislike}
            disabled={loading}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
              isDisliked
                ? 'bg-gray-200 text-gray-800'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <span className="text-sm font-medium">{dislikes}</span>
          </button>

          <button
            onClick={handleShare}
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
