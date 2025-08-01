import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { supabase } from '../utils/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

function CreatePostPage() {
    // --- STATE MANAGEMENT ---
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageSrc, setImageSrc] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // --- REFS AND NAVIGATION ---
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const navigate = useNavigate();

    // --- INITIALIZE GEMINI AI ---
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

    // --- COMBINED AUTH CHECK AND CAMERA LOGIC ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You must be logged in to create a post.');
            navigate('/login');
        } else {
            startCamera();
        }

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [navigate]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access the camera. Please check permissions.");
        }
    };
    
    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            setImageSrc(canvas.toDataURL('image/png'));
        }
    };

    // --- GEMINI AI CAPTION GENERATION ---
    async function fileToGenerativePart(file) {
        const base64EncodedData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
        return { inlineData: { data: base64EncodedData, mimeType: file.type } };
    }

    const handleGenerateCaption = async () => {
        if (!imageSrc) {
            alert("Please capture an image first.");
            return;
        }
        setIsGenerating(true);
        try {
            // FIX 1: Using the latest Gemini model name
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            
            const prompt = "Write a short, engaging social media caption for this image. Be creative and fun.";
            const imageFile = dataURLtoFile(imageSrc, 'capture.png');
            const imagePart = await fileToGenerativePart(imageFile);
            const result = await model.generateContent([prompt, imagePart]);
            const text = result.response.text();
            setContent(text.replace(/"/g, ''));
        } catch (error) {
            console.error("Error generating caption with Gemini:", error);
            alert("Failed to generate caption. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- FORM SUBMISSION ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageSrc) {
            alert("Please capture an image first!");
            return;
        }
        setIsUploading(true);
        try {
            const imageFile = dataURLtoFile(imageSrc, `post-${Date.now()}.png`);
            
            // FIX 2: Using the correct bucket name "visitgram" for both upload and getPublicUrl
            const bucketName = 'visitgram';
            const { data, error } = await supabase.storage.from(bucketName).upload(imageFile.name, imageFile);
            if (error) throw error;
            
            const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(data.path);
            
            const postContent = `${content} [Image: ${publicUrl}]`;
            await api.post('/create', { title, content: postContent });
            alert('Post created successfully!');
            navigate('/');
        } catch (error) {
            console.error('Failed to create post:', error);
            alert('Failed to create post. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // --- RENDERED JSX (No changes needed here) ---
    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-center mb-6">Create New Post</h2>
            
            <div className="camera-container border-2 border-dashed rounded-lg p-4 mb-4 h-96 flex items-center justify-center bg-gray-100">
                {imageSrc ? (
                    <img src={imageSrc} alt="Captured" className="max-h-full max-w-full rounded-md" />
                ) : (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-md"></video>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            </div>

            <div className="flex justify-center space-x-4 mb-6">
                {imageSrc ? (
                    <button onClick={() => { setImageSrc(null); setContent(''); }} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                        Retake
                    </button>
                ) : (
                    <button onClick={handleCapture} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                        📸 Capture Image
                    </button>
                )}
            </div>

            {imageSrc && (
                <div className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            placeholder="Post Title" 
                            required 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                        <div className="relative">
                            <textarea 
                                value={content} 
                                onChange={e => setContent(e.target.value)} 
                                placeholder="Write a caption or generate one with AI..." 
                                required 
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                            <button 
                                type="button" 
                                onClick={handleGenerateCaption}
                                disabled={isGenerating}
                                className="absolute bottom-3 right-3 bg-purple-600 text-white px-3 py-1 text-sm rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                            >
                                {isGenerating ? 'Generating...' : '✨ Generate with AI'}
                            </button>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isUploading}
                            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-gray-400"
                        >
                            {isUploading ? 'Uploading...' : 'Create Post'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default CreatePostPage;