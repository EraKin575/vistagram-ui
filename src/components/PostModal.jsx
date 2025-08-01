// src/components/PostModal.jsx

import React, { useEffect } from 'react';

function PostModal({ post, onClose }) {
  // Effect to handle the 'Escape' key press to close the modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Stop click propagation to prevent the modal from closing when clicking inside the content
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  if (!post) return null;

  return (
    // Backdrop overlay
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
      onClick={onClose} // Close modal when clicking the backdrop
    >
      {/* Modal Content */}
      <div 
        className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={handleModalContentClick}
      >
        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="w-full h-96 object-cover rounded-t-lg" />
        )}
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-2">{post.title}</h2>
          <p className="text-gray-700 mb-4">{post.text}</p>
          <div className="text-sm text-gray-500 border-t pt-4">
            <span>Posted by: User {post.user_id.substring(0, 8)}...</span>
            <span className="mx-2">·</span>
            <span>{new Date(post.created_at).toLocaleString()}</span>
          </div>
          {/* You can add Like/Share buttons here as well if you want */}
        </div>
      </div>
    </div>
  );
}

export default PostModal;