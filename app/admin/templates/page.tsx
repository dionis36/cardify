"use client";

import { useState, useEffect } from 'react';
import { Upload, Download, Trash2, Star, Eye, EyeOff, RefreshCw, Search, Filter, Edit } from 'lucide-react';
import Link from 'next/link';

interface Template {
    id: string;
    name: string;
    description?: string;
    category: string;
    tags: string[];
    thumbnail?: string;
    isFeatured: boolean;
    isPublic: boolean;
    version: number;
    createdAt: string;
    updatedAt: string;
    data: any; // Template JSON data
}

export default function TemplateManagementPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);

    // Load templates
    useEffect(() => {
        loadTemplates();
        loadCategories();
    }, [filterCategory]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const url = filterCategory === 'all'
                ? '/api/templates'
                : `/api/templates?category=${filterCategory}`;

            const response = await fetch(url);
            const data = await response.json();

            // Transform data to include metadata
            const templatesWithMeta = await Promise.all(
                data.map(async (template: any) => {
                    const metaResponse = await fetch(`/api/templates/${template.id}`);
                    const meta = await metaResponse.json();
                    return meta;
                })
            );

            setTemplates(templatesWithMeta);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await fetch('/api/templates/categories');
            const data = await response.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    // Bulk actions
    const handleBulkAction = async (action: string, category?: string) => {
        if (selectedTemplates.length === 0) {
            alert('Please select at least one template');
            return;
        }

        const confirmMessage = action === 'delete'
            ? `Delete ${selectedTemplates.length} template(s)?`
            : `${action} ${selectedTemplates.length} template(s)?`;

        if (!confirm(confirmMessage)) return;

        try {
            const response = await fetch('/api/templates/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    templateIds: selectedTemplates,
                    ...(category && { category }),
                }),
            });

            if (response.ok) {
                await loadTemplates();
                setSelectedTemplates([]);
                alert(`Successfully ${action}d ${selectedTemplates.length} template(s)`);
            } else {
                const error = await response.json();
                alert(`Failed: ${error.error}`);
            }
        } catch (error) {
            console.error('Bulk action failed:', error);
            alert('Bulk action failed');
        }
    };

    // File upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const content = await file.text();
            const template = JSON.parse(content);

            const response = await fetch('/api/templates/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ template, overwrite: false }),
            });

            if (response.ok) {
                await loadTemplates();
                alert('Template imported successfully!');
            } else {
                const error = await response.json();
                if (response.status === 409) {
                    if (confirm(`${error.message} Do you want to overwrite?`)) {
                        const retryResponse = await fetch('/api/templates/import', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ template, overwrite: true }),
                        });
                        if (retryResponse.ok) {
                            await loadTemplates();
                            alert('Template updated successfully!');
                        }
                    }
                } else {
                    alert(`Import failed: ${error.error}`);
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload template');
        }

        // Reset file input
        e.target.value = '';
    };

    // Toggle selection
    const toggleSelection = (id: string) => {
        setSelectedTemplates(prev =>
            prev.includes(id)
                ? prev.filter(t => t !== id)
                : [...prev, id]
        );
    };

    // Select all
    const toggleSelectAll = () => {
        if (selectedTemplates.length === filteredTemplates.length) {
            setSelectedTemplates([]);
        } else {
            setSelectedTemplates(filteredTemplates.map(t => t.id));
        }
    };

    // Filter templates
    const filteredTemplates = templates.filter(t =>
        searchQuery === '' ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
                    <p className="text-gray-600 mt-2">Manage, organize, and import card templates</p>
                </div>

                {/* Actions Bar */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Left: Upload & Bulk Actions */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Upload Button */}
                            <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition">
                                <Upload size={16} className="mr-2" />
                                Upload JSON
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </label>

                            {/* Refresh Button */}
                            <button
                                onClick={loadTemplates}
                                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                Refresh
                            </button>

                            {/* Bulk Actions */}
                            {selectedTemplates.length > 0 && (
                                <div className="flex items-center gap-2 pl-4 border-l">
                                    <span className="text-sm text-gray-600">
                                        {selectedTemplates.length} selected
                                    </span>
                                    <button
                                        onClick={() => handleBulkAction('feature')}
                                        className="px-3 py-1.5 text-sm text-yellow-600 hover:bg-yellow-50 rounded transition"
                                    >
                                        <Star size={14} className="inline mr-1" />
                                        Feature
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction('delete')}
                                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition"
                                    >
                                        <Trash2 size={14} className="inline mr-1" />
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right: Search */}
                        <div className="relative flex-1 md:max-w-xs">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <Filter size={16} className="text-gray-500" />
                        <button
                            onClick={() => setFilterCategory('all')}
                            className={`px-3 py-1.5 text-sm rounded-md transition ${filterCategory === 'all'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            All ({templates.length})
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => setFilterCategory(cat.name)}
                                className={`px-3 py-1.5 text-sm rounded-md transition ${filterCategory === cat.name
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.name} ({cat.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Select All */}
                {filteredTemplates.length > 0 && (
                    <div className="mb-4">
                        <label className="flex items-center text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                            <input
                                type="checkbox"
                                checked={selectedTemplates.length === filteredTemplates.length}
                                onChange={toggleSelectAll}
                                className="mr-2"
                            />
                            Select all {filteredTemplates.length} templates
                        </label>
                    </div>
                )}

                {/* Templates Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <RefreshCw size={32} className="animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-4">Loading templates...</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg">
                        <p className="text-gray-500">No templates found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                selected={selectedTemplates.includes(template.id)}
                                onSelect={() => toggleSelection(template.id)}
                                onRefresh={loadTemplates}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Template Card Component
interface TemplateCardProps {
    template: Template;
    selected: boolean;
    onSelect: () => void;
    onRefresh: () => void;
}

function TemplateCard({ template, selected, onSelect, onRefresh }: TemplateCardProps) {
    const [updating, setUpdating] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Delete template "${template.name}"?`)) return;

        try {
            const response = await fetch(`/api/templates/${template.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                onRefresh();
            } else {
                alert('Failed to delete template');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete template');
        }
    };

    const handleToggleFeatured = async () => {
        setUpdating(true);
        try {
            const response = await fetch(`/api/templates/${template.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFeatured: !template.isFeatured }),
            });

            if (response.ok) {
                onRefresh();
            }
        } catch (error) {
            console.error('Update failed:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await fetch(`/api/templates/${template.id}`);
            const data = await response.json();

            const blob = new Blob([JSON.stringify(data.data, null, 2)], {
                type: 'application/json',
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${template.id}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export template');
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow p-4 transition ${selected ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-start justify-between mb-3">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onSelect}
                    className="mt-1"
                />
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleToggleFeatured}
                        disabled={updating}
                        className="transition"
                        title={template.isFeatured ? 'Remove featured' : 'Mark as featured'}
                    >
                        <Star
                            size={18}
                            className={template.isFeatured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}
                        />
                    </button>
                    {!template.isPublic && (
                        <div title="Private">
                            <EyeOff size={18} className="text-gray-400" />
                        </div>
                    )}
                </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {template.description || 'No description'}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    {template.category}
                </span>
                {template.tags.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {tag}
                    </span>
                ))}
                {template.tags.length > 2 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{template.tags.length - 2}
                    </span>
                )}
            </div>

            <div className="text-xs text-gray-500 mb-3">
                Version {template.version} • Updated {new Date(template.updatedAt).toLocaleDateString()}
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
                <Link
                    href={`/admin/templates/${template.id}/edit`}
                    className="text-sm text-green-600 hover:text-green-700 transition"
                >
                    <Edit size={14} className="inline mr-1" />
                    Edit
                </Link>
                <button
                    onClick={handleExport}
                    className="text-sm text-blue-600 hover:text-blue-700 transition"
                >
                    <Download size={14} className="inline mr-1" />
                    Export
                </button>
                <button
                    onClick={handleDelete}
                    className="text-sm text-red-600 hover:text-red-700 transition"
                >
                    <Trash2 size={14} className="inline mr-1" />
                    Delete
                </button>
            </div>
        </div>
    );
}
