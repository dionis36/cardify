"use client";

import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    description?: string;
    category: string;
    tags: string[];
    data: any;
    version: number;
}

interface TemplateEditorModalProps {
    template: Template;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function TemplateEditorModal({ template, isOpen, onClose, onSave }: TemplateEditorModalProps) {
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
    const [saving, setSaving] = useState(false);

    // Basic form state
    const [name, setName] = useState(template.name);
    const [description, setDescription] = useState(template.description || '');
    const [category, setCategory] = useState(template.category);
    const [tagsInput, setTagsInput] = useState(template.tags.join(', '));

    // Advanced JSON state
    const [jsonData, setJsonData] = useState(JSON.stringify(template.data, null, 2));
    const [jsonError, setJsonError] = useState('');

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            let dataToSave = template.data;

            // If in advanced mode, validate and parse JSON
            if (activeTab === 'advanced') {
                try {
                    dataToSave = JSON.parse(jsonData);
                    setJsonError('');
                } catch (e) {
                    setJsonError('Invalid JSON format');
                    setSaving(false);
                    return;
                }
            }

            // Prepare update payload
            const payload: any = {
                name,
                description: description || undefined,
                category,
                tags: tagsInput.split(',').map(t => t.trim()).filter(t => t),
            };

            // Include data if it was modified in advanced mode
            if (activeTab === 'advanced') {
                payload.data = dataToSave;
            }

            const response = await fetch(`/api/templates/${template.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                onSave();
                onClose();
            } else {
                const error = await response.json();
                alert(`Failed to save: ${error.error}`);
            }
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const handleJsonChange = (value: string) => {
        setJsonData(value);
        // Clear error when user types
        if (jsonError) setJsonError('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Edit Template</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {template.id} • Version {template.version}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={`px-6 py-3 font-medium transition ${activeTab === 'basic'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Basic Info
                    </button>
                    <button
                        onClick={() => setActiveTab('advanced')}
                        className={`px-6 py-3 font-medium transition ${activeTab === 'advanced'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Advanced (JSON)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'basic' ? (
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Template Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Modern Business Card"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Describe this template..."
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category *
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Business">Business</option>
                                    <option value="Creative">Creative</option>
                                    <option value="General">General</option>
                                    <option value="Modern">Modern</option>
                                    <option value="Minimal">Minimal</option>
                                    <option value="Professional">Professional</option>
                                </select>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tags
                                </label>
                                <input
                                    type="text"
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="business, modern, professional (comma-separated)"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Separate tags with commas
                                </p>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> To edit template layers, colors, and structure,
                                    switch to the "Advanced (JSON)" tab.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* JSON Editor */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Template JSON Data
                                </label>
                                <textarea
                                    value={jsonData}
                                    onChange={(e) => handleJsonChange(e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${jsonError ? 'border-red-500' : ''
                                        }`}
                                    rows={20}
                                    spellCheck={false}
                                />
                                {jsonError && (
                                    <p className="text-sm text-red-600 mt-1">{jsonError}</p>
                                )}
                            </div>

                            {/* Warning Box */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                <p className="text-sm text-yellow-800">
                                    <strong>⚠️ Warning:</strong> Editing JSON directly can break the template
                                    if the structure is invalid. Make sure to maintain the correct format.
                                </p>
                            </div>

                            {/* JSON Info */}
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                <h4 className="font-medium text-gray-900 mb-2">JSON Structure:</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• <code className="bg-gray-200 px-1 rounded">id</code> - Template identifier</li>
                                    <li>• <code className="bg-gray-200 px-1 rounded">name</code> - Template name</li>
                                    <li>• <code className="bg-gray-200 px-1 rounded">width</code>, <code className="bg-gray-200 px-1 rounded">height</code> - Canvas dimensions</li>
                                    <li>• <code className="bg-gray-200 px-1 rounded">layers</code> - Array of template layers</li>
                                    <li>• <code className="bg-gray-200 px-1 rounded">background</code> - Background configuration</li>
                                    <li>• <code className="bg-gray-200 px-1 rounded">colorRoles</code> - Color role mappings</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                    <div className="text-sm text-gray-500">
                        {activeTab === 'advanced' && (
                            <span>Changes will increment version to {template.version + 1}</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || (activeTab === 'advanced' && !!jsonError)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <Save size={16} className="mr-2" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
