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

// Pexels category definitions
const PEXELS_CATEGORIES = [
    { id: 'animals', label: 'Animals', query: 'animals pets wildlife', bgImage: 'https://images.pexels.com/photos/45170/kittens-cat-cat-puppy-rush-45170.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 'food', label: 'Food', query: 'food cuisine meal', bgImage: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 'office', label: 'Office', query: 'office workspace business', bgImage: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 'landscape', label: 'Landscape', query: 'landscape nature scenery', bgImage: 'https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 'travel', label: 'Travel', query: 'travel destination adventure', bgImage: 'https://images.pexels.com/photos/2174656/pexels-photo-2174656.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 'nature', label: 'Nature', query: 'nature forest trees', bgImage: 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 'business', label: 'Business', query: 'business professional corporate', bgImage: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { id: 'technology', label: 'Technology', query: 'technology computer digital', bgImage: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=600' },
];

const ImageLibraryPanel: React.FC<ImageLibraryPanelProps> = ({ onAddNode }) => {
    const [activeTab, setActiveTab] = useState<TabType>('upload');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>(PEXELS_CATEGORIES[0].id);
    const [pexelsPhotos, setPexelsPhotos] = useState<PexelsPhoto[]>([]);
    const [curatedPhotos, setCuratedPhotos] = useState<PexelsPhoto[]>([]);
    const [categoryPhotos, setCategoryPhotos] = useState<Record<string, PexelsPhoto[]>>({});
    const [recentImages, setRecentImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Perform search when debounced query changes
    useEffect(() => {
        if (activeTab === 'pexels' && debouncedSearchQuery.trim().length > 0) {
            performSearch(debouncedSearchQuery, 1);
        } else {
            setPexelsPhotos([]);
            setHasMore(false);
        }
    }, [debouncedSearchQuery, activeTab]);

    // Load category photos on mount or when category changes
    useEffect(() => {
        if (activeTab === 'pexels' && searchQuery.trim().length === 0) {
            loadCategoryPhotos(activeCategory);
        }
    }, [activeTab, activeCategory]);

    // Load recent images when tab is active
    useEffect(() => {
        if (activeTab === 'recent') {
            setRecentImages(getRecentImages());
        }
    }, [activeTab]);

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

    const loadCategoryPhotos = async (categoryId: string) => {
        if (!isPexelsConfigured()) {
            setError('Pexels API key is not configured. Please add NEXT_PUBLIC_PEXELS_API_KEY to your .env.local file.');
            return;
        }

        // Check if we already have photos for this category
        if (categoryPhotos[categoryId] && categoryPhotos[categoryId].length > 0) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const category = PEXELS_CATEGORIES.find(c => c.id === categoryId);
            if (!category) return;

            const response = await searchPhotos(category.query, 1, 20);
            setCategoryPhotos(prev => ({
                ...prev,
                [categoryId]: response.photos
            }));
        } catch (err) {
            if (err instanceof PexelsServiceError) {
                setError(err.message);
            } else {
                setError('Failed to load category photos');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadMoreCategoryPhotos = async (categoryId: string, pageNum: number) => {
        if (!isPexelsConfigured()) {
            setError('Pexels API key is not configured.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const category = PEXELS_CATEGORIES.find(c => c.id === categoryId);
            if (!category) return;

            const response = await searchPhotos(category.query, pageNum, 20);
            setCategoryPhotos(prev => ({
                ...prev,
                [categoryId]: [...(prev[categoryId] || []), ...response.photos]
            }));
        } catch (err) {
            if (err instanceof PexelsServiceError) {
                setError(err.message);
            } else {
                setError('Failed to load more photos');
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

        // Use loadingMore for pagination, loading for initial search
        if (pageNum > 1) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const response = await searchPhotos(query, pageNum, 20);
            if (pageNum === 1) {
                setPexelsPhotos(response.photos);
            } else {
                setPexelsPhotos(prev => [...prev, ...response.photos]);
            }
            setPage(pageNum);
            setHasMore(response.photos.length === 20);
        } catch (err) {
            if (err instanceof PexelsServiceError) {
                setError(err.message);
            } else {
                setError('Failed to search photos');
            }
        } finally {
            if (pageNum > 1) {
                setLoadingMore(false);
            } else {
                setLoading(false);
            }
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
        // Use large2x for highest quality on canvas
        const imageUrl = photo.src.large2x || photo.src.large;
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
            editable: true,
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
        const isSearching = searchQuery.trim().length > 0;
        const photosToDisplay = isSearching ? pexelsPhotos : [];

        return (
            <div className="space-y-4">
                {/* Search Bar with Clear Button */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search free photos..."
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Category Grid View - Only show when not searching */}
                {!isSearching && (
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Browse by Category</p>
                        <div className="grid grid-cols-2 gap-3">
                            {PEXELS_CATEGORIES.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSearchQuery(category.query)}
                                    className="relative aspect-square rounded-lg overflow-hidden transition-all ring-1 ring-gray-200 hover:ring-2 hover:ring-blue-400 hover:shadow-lg group"
                                >
                                    {/* Background Image */}
                                    <img
                                        src={category.bgImage}
                                        alt={category.label}
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                    {/* Label */}
                                    <div className="absolute inset-0 flex items-end justify-center pb-3">
                                        <span className="text-sm font-bold text-white drop-shadow-lg">
                                            {category.label}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Results View */}
                {isSearching && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {photosToDisplay.map((photo) => (
                                <button
                                    key={photo.id}
                                    onClick={() => handlePexelsImageClick(photo)}
                                    className="relative aspect-square rounded-lg overflow-hidden group hover:ring-2 hover:ring-blue-500 transition-all"
                                >
                                    <img
                                        src={photo.src.medium}
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

                        {/* Load More Button for Search */}
                        {hasMore && !loading && pexelsPhotos.length > 0 && (
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="w-full py-2.5 px-4 bg-white border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loadingMore ? 'Loading...' : 'Load More Images'}
                            </button>
                        )}

                        {/* Empty State */}
                        {pexelsPhotos.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-sm text-gray-500">No photos found</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Powered by Pexels Attribution */}
                <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Powered by{' '}
                        <a
                            href="https://www.pexels.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                        >
                            Pexels
                        </a>
                    </p>
                </div>
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
            {/* Tab Navigation - Compact Style */}
            <div className="p-4 pb-3 bg-white border-b border-gray-200">
                <div className="flex p-1 bg-gray-100 rounded-lg border border-gray-200">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-2 text-xs font-medium rounded-md capitalize transition-all ${activeTab === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('pexels')}
                        className={`flex-1 py-2 text-xs font-medium rounded-md capitalize transition-all ${activeTab === 'pexels' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Pexels
                    </button>
                    <button
                        onClick={() => setActiveTab('recent')}
                        className={`flex-1 py-2 text-xs font-medium rounded-md capitalize transition-all ${activeTab === 'recent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Recent
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4">
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
