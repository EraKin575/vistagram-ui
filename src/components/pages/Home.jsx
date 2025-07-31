import { useState, useEffect } from 'react';
import { Filter, Loader, Plus } from 'lucide-react';
import Navbar from '../Navbar';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('recent');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { value: 'recent', label: 'Recent' },
    { value: 'likes', label: 'Most Liked' },
    { value: 'popular', label: 'Popular' },
  ];

  const fetchPosts = async (selectedFilter = filter) => {
    try {
      setRefreshing(true);
      const response = await postsAPI.getPosts(selectedFilter);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setLoading(true);
    fetchPosts(newFilter);
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handlePostUpdate = (post) => {
    // Navigate to edit post or open edit modal
    console.log('Edit post:', post);
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex space-x-2">
              {filters.map((filterOption) => (
                <button
                  key={filterOption.value}
                  onClick={() => handleFilterChange(filterOption.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Post</span>
          </button>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-4">Be the first to share something!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {refreshing && (
              <div className="text-center py-4">
                <Loader className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              </div>
            )}
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
                isOwner={false} // You'll need to check if current user owns the post
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default Home;
