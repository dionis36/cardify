'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { KonvaNodeDefinition, ImageProps } from '@/types/template';
import {
    searchPhotos,
    getCuratedPhotos,
    isPexelsConfigured,
    PexelsPhoto,
    PexelsServiceError,
} from '@/lib/pexelsService';
import {
    fileToDataUrl,
    getImageDimensions,
    addToRecentImages,
    getRecentImages,
    clearRecentImages,
} from '@/lib/imageHelpers';
import { Upload, Search, Clock, Loader2, AlertCircle, X, Image as ImageIcon } from 'lucide-react';

interface ImageLibraryPanelProps {
    onAddNode: (node: KonvaNodeDefinition) => void;
}

type TabType = 'upload' | 'pexels' | 'recent';

const ImageLibraryPanel: React.FC<ImageLibraryPanelProps> = ({ onAddNode }) => {
    const [activeTab, setActiveTab] = useState<TabType>('upload');
    const [searchQuery, setSearchQuery] = useState('');
    const [pexelsPhotos, setPexelsPhotos] = useState<PexelsPhoto[]>([]);
    const [curatedPhotos, setCuratedPhotos] = useState<PexelsPhoto[]>([]);
    const [recentImages, setRecentImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load curated photos on mount
    useEffect(() => {
        if (activeTab === 'pexels' && curatedPhotos.length === 0) {
            loadCuratedPhotos();
        }
    }, [activeTab]);

    // Load recent images when tab is active
    useEffect(() => {
        if (activeTab === 'recent') {
            setRecentImages(getRecentImages());
        }
    }, [activeTab]);

    // Debounced search
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                performSearch(searchQuery, 1);
            }, 500);
        } else {
            setPexelsPhotos([]);
            setPage(1);
            setHasMore(true);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    const loadCuratedPhotos = async () => {
        if (!isPexelsConfigured()) {
            setError('Pexels API key is not configured. Please add NEXT_PUBLIC_PEXELS_API_KEY to your .env.local file.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await getCuratedPhotos(1, 20);
            setCuratedPhotos(response.photos);
        } catch (err) {
            if (err instanceof PexelsServiceError) {
                setError(err.message);
            } else {
                setError('Failed to load curated photos');
            }
        } finally {
            setLoading(false);
        }
    };

    const performSearch = async (query: string, pageNum: number) => {
        if (!isPexelsConfigured()) {
            setError('Pexels API key is not configured. Please add NEXT_PUBLIC_PEXELS_API_KEY to your .env.local file.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await searchPhotos(query, pageNum, 20);
            if (pageNum === 1) {
                setPexelsPhotos(response.photos);
            } else {
                setPexelsPhotos(prev => [...prev, ...response.photos]);
            }
            setHasMore(response.photos.length === 20);
            setPage(pageNum);
        } catch (err) {
            if (err instanceof PexelsServiceError) {
                setError(err.message);
            } else {
                setError('Failed to search photos');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (searchQuery.trim().length > 0 && hasMore && !loading) {
            performSearch(searchQuery, page + 1);
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const dataUrl = await fileToDataUrl(file);
            const dimensions = await getImageDimensions(dataUrl);

            addImageToCanvas(dataUrl, dimensions.width, dimensions.height);
            addToRecentImages(dataUrl);
        } catch (err) {
            setError('Failed to upload image');
        } finally {
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handlePexelsImageClick = async (photo: PexelsPhoto) => {
        const imageUrl = photo.src.large;
        addImageToCanvas(imageUrl, photo.width, photo.height);
        addToRecentImages(imageUrl);
        setRecentImages(getRecentImages());
    };

    const handleRecentImageClick = async (imageUrl: string) => {
        try {
            const dimensions = await getImageDimensions(imageUrl);
            addImageToCanvas(imageUrl, dimensions.width, dimensions.height);
        } catch (err) {
            setError('Failed to load image');
        }
    };

    const addImageToCanvas = (src: string, originalWidth: number, originalHeight: number) => {
        const maxSize = 300;
        const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight, 1);
        const width = originalWidth * scale;
        const height = originalHeight * scale;

        const id = `node_image_${Date.now()}`;
        const imageNode: KonvaNodeDefinition = {
            id,
            type: 'Image',
            props: {
                id,
                x: 50,
                y: 50,
                width,
                height,
                src,
                rotation: 0,
                opacity: 1,
                visible: true,
            } as ImageProps,
            editable: false,
            locked: false,
        };

        onAddNode(imageNode);
    };

    const handleClearRecent = () => {
        clearRecentImages();
        setRecentImages([]);
    };

    const renderTabButton = (tab: TabType, icon: React.ElementType, label: string) => {
        const Icon = icon;
        return (
            <button
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === tab
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
            >
                <Icon size={16} />
                {label}
            </button>
        );
    };

    const renderUploadTab = () => (
        <div className="space-y-4">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
            />

            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFileUpload(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
            >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-700 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP up to 10MB</p>
            </div>
        </div>
    );

    const renderPexelsTab = () => {
        const photosToDisplay = searchQuery.trim().length > 0 ? pexelsPhotos : curatedPhotos;

        return (
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search free photos..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Photos Grid */}
                <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {photosToDisplay.map((photo) => (
                        <button
                            key={photo.id}
                            onClick={() => handlePexelsImageClick(photo)}
                            className="relative aspect-square rounded-lg overflow-hidden group hover:ring-2 hover:ring-blue-500 transition-all"
                        >
                            <img
                                src={photo.src.small}
                                alt={photo.alt || 'Photo'}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-xs text-white truncate">{photo.photographer}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Load More Button */}
                {searchQuery.trim().length > 0 && hasMore && !loading && pexelsPhotos.length > 0 && (
                    <button
                        onClick={handleLoadMore}
                        className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors"
                    >
                        Load More
                    </button>
                )}

                {/* Attribution */}
                <p className="text-xs text-gray-500 text-center">
                    Photos provided by{' '}
                    <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Pexels
                    </a>
                </p>
            </div>
        );
    };

    const renderRecentTab = () => (
        <div className="space-y-4">
            {recentImages.length > 0 && (
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">{recentImages.length} recent image(s)</p>
                    <button
                        onClick={handleClearRecent}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                        Clear All
                    </button>
                </div>
            )}

            {recentImages.length === 0 ? (
                <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm text-gray-500">No recent images</p>
                    <p className="text-xs text-gray-400 mt-1">Images you add will appear here</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {recentImages.map((imageUrl, index) => (
                        <button
                            key={index}
                            onClick={() => handleRecentImageClick(imageUrl)}
                            className="relative aspect-square rounded-lg overflow-hidden group hover:ring-2 hover:ring-blue-500 transition-all"
                        >
                            <img
                                src={imageUrl}
                                alt={`Recent image ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            {/* Tab Navigation */}
            <div className="flex gap-2 p-4 bg-gray-50 border-b border-gray-200">
                {renderTabButton('upload', Upload, 'Upload')}
                {renderTabButton('pexels', ImageIcon, 'Pexels')}
                {renderTabButton('recent', Clock, 'Recent')}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 overflow-hidden">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-600 hover:text-red-700"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                )}

                {!loading && (
                    <>
                        {activeTab === 'upload' && renderUploadTab()}
                        {activeTab === 'pexels' && renderPexelsTab()}
                        {activeTab === 'recent' && renderRecentTab()}
                    </>
                )}
            </div>
        </div>
    );
};

export default ImageLibraryPanel;
