"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, AlertCircle, CheckCircle, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { validateTemplate, ValidationError } from '@/lib/schemaValidator';

interface Template {
    id: string;
    name: string;
    description?: string;
    category: string;
    tags: string[];
    data: any;
    version: number;
    isFeatured: boolean;
    isPublic: boolean;
}

export default function TemplateEditPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'schema'>('basic');

    // Basic form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [isPublic, setIsPublic] = useState(true);

    // Advanced JSON state
    const [jsonData, setJsonData] = useState('');
    const [jsonError, setJsonError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

    // Schema editor state
    const [schemaData, setSchemaData] = useState('');
    const [schemaError, setSchemaError] = useState('');
    const [schemaLoading, setSchemaLoading] = useState(false);

    // Load template
    useEffect(() => {
        loadTemplate();
    }, [params.id]);

    const loadTemplate = async () => {
        try {
            const response = await fetch(`/api/templates/${params.id}`);
            if (!response.ok) {
                throw new Error('Template not found');
            }
            const data = await response.json();
            setTemplate(data);

            // Set form values
            setName(data.name);
            setDescription(data.description || '');
            setCategory(data.category);
            setTagsInput(data.tags.join(', '));
            setIsFeatured(data.isFeatured);
            setIsPublic(data.isPublic);
            setJsonData(JSON.stringify(data.data, null, 2));
        } catch (error) {
            console.error('Failed to load template:', error);
            alert('Failed to load template');
            router.push('/admin/templates');
        } finally {
            setLoading(false);
        }
    };

    const loadSchema = async () => {
        setSchemaLoading(true);
        try {
            const response = await fetch('/api/templates/schema');
            const data = await response.json();
            setSchemaData(JSON.stringify(data.schema, null, 2));
        } catch (error) {
            console.error('Failed to load schema:', error);
            setSchemaError('Failed to load schema');
        } finally {
            setSchemaLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);

        try {
            // Handle schema save
            if (activeTab === 'schema') {
                try {
                    const parsedSchema = JSON.parse(schemaData);
                    setSchemaError('');

                    const response = await fetch('/api/templates/schema', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ schema: parsedSchema }),
                    });

                    if (response.ok) {
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 3000);
                    } else {
                        const error = await response.json();
                        setSchemaError(error.error || 'Failed to save schema');
                    }
                } catch (e) {
                    setSchemaError('Invalid JSON format');
                    setSaving(false);
                    return;
                }
                setSaving(false);
                return;
            }

            // Handle template save
            let dataToSave = template?.data;

            // If in advanced mode, validate and parse JSON
            if (activeTab === 'advanced') {
                try {
                    dataToSave = JSON.parse(jsonData);
                    setJsonError('');

                    // Validate against schema
                    const validation = validateTemplate(dataToSave);
                    if (!validation.valid) {
                        setValidationErrors(validation.errors);
                        setSaving(false);
                        return;
                    }
                    setValidationErrors([]);
                } catch (e) {
                    setJsonError('Invalid JSON format. Please fix the syntax errors.');
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
                isFeatured,
                isPublic,
            };

            // Include data if it was modified in advanced mode
            if (activeTab === 'advanced') {
                payload.data = dataToSave;
            }

            const response = await fetch(`/api/templates/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSaveSuccess(true);
                await loadTemplate(); // Reload to get updated version
                setTimeout(() => setSaveSuccess(false), 3000);
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
        if (jsonError) setJsonError('');
        if (validationErrors.length > 0) setValidationErrors([]);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading template...</p>
                </div>
            </div>
        );
    }

    if (!template) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/admin/templates"
                                className="text-gray-600 hover:text-gray-900 transition"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Edit Template</h1>
                                <p className="text-sm text-gray-500">
                                    {template.id} • Version {template.version}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {saveSuccess && (
                                <div className="flex items-center text-green-600 text-sm">
                                    <CheckCircle size={16} className="mr-1" />
                                    Saved successfully!
                                </div>
                            )}
                            <button
                                onClick={() => router.push('/admin/templates')}
                                className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving ||
                                    (activeTab === 'advanced' && (!!jsonError || validationErrors.length > 0)) ||
                                    (activeTab === 'schema' && !!schemaError)
                                }
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                <Save size={16} className="mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-t">
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
                            Advanced (JSON Editor)
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('schema');
                                if (!schemaData) loadSchema();
                            }}
                            className={`px-6 py-3 font-medium transition ${activeTab === 'schema'
                                ? 'text-purple-600 border-b-2 border-purple-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Shield size={16} className="inline mr-1" />
                            Schema
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'basic' ? (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="max-w-3xl space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Template Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Modern Business Card"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Describe this template..."
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tags
                                </label>
                                <input
                                    type="text"
                                    value={tagsInput}
                                    onChange={(e) => setTagsInput(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="business, modern, professional (comma-separated)"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Separate tags with commas
                                </p>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-3 pt-4 border-t">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isFeatured}
                                        onChange={(e) => setIsFeatured(e.target.checked)}
                                        className="mr-3"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Featured Template
                                    </span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="mr-3"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Public (visible to users)
                                    </span>
                                </label>
                            </div>

                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> To edit template layers, colors, and structure,
                                    switch to the "Advanced (JSON Editor)" tab.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'schema' ? (
                    <div className="space-y-4">
                        {/* Schema Error Alert */}
                        {schemaError && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
                                <AlertCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-medium text-red-900">Schema Error</h4>
                                    <p className="text-sm text-red-700 mt-1">{schemaError}</p>
                                </div>
                            </div>
                        )}

                        {/* Schema Info */}
                        <div className="bg-purple-50 border border-purple-200 rounded-md p-4 flex items-start">
                            <Shield className="text-purple-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-medium text-purple-900">Template Schema Editor</h4>
                                <p className="text-sm text-purple-700 mt-1">
                                    Edit the global JSON Schema that validates all templates. Changes affect all template validation.
                                </p>
                            </div>
                        </div>

                        {/* Schema Editor */}
                        {schemaLoading ? (
                            <div className="bg-white rounded-lg shadow p-12 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                                <p className="text-gray-600 mt-4">Loading schema...</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow">
                                <div className="p-4 border-b bg-purple-50">
                                    <h3 className="font-medium text-gray-900">Schema JSON (public/templates/schema.json)</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Defines validation rules for all card templates
                                    </p>
                                </div>
                                <div className="p-0">
                                    <textarea
                                        value={schemaData}
                                        onChange={(e) => {
                                            setSchemaData(e.target.value);
                                            if (schemaError) setSchemaError('');
                                        }}
                                        className={`w-full px-6 py-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${schemaError ? 'border-l-4 border-red-500' : ''
                                            }`}
                                        rows={30}
                                        spellCheck={false}
                                        style={{
                                            tabSize: 2,
                                            lineHeight: '1.6',
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Help Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Warning</h4>
                                <p className="text-sm text-yellow-800">
                                    Editing the schema affects ALL templates. Invalid schema will prevent templates from being saved.
                                    Make sure to test after changes.
                                </p>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                <h4 className="font-medium text-gray-900 mb-2">📋 Schema Purpose</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Enforces required fields</li>
                                    <li>• Validates data types</li>
                                    <li>• Defines allowed enum values</li>
                                    <li>• Prevents invalid templates</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* JSON Error Alert */}
                        {jsonError && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
                                <AlertCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-medium text-red-900">JSON Syntax Error</h4>
                                    <p className="text-sm text-red-700 mt-1">{jsonError}</p>
                                </div>
                            </div>
                        )}

                        {/* JSON Editor */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-4 border-b">
                                <h3 className="font-medium text-gray-900">Template JSON Data</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Edit the complete template structure. Be careful - invalid JSON will prevent saving.
                                </p>
                            </div>
                            <div className="p-0">
                                <textarea
                                    value={jsonData}
                                    onChange={(e) => handleJsonChange(e.target.value)}
                                    className={`w-full px-6 py-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${jsonError ? 'border-l-4 border-red-500' : ''
                                        }`}
                                    rows={30}
                                    spellCheck={false}
                                    style={{
                                        tabSize: 2,
                                        lineHeight: '1.6',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Help Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Warning</h4>
                                <p className="text-sm text-yellow-800">
                                    Editing JSON directly can break the template if the structure is invalid.
                                    Make sure to maintain the correct format and test after saving.
                                </p>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                <h4 className="font-medium text-gray-900 mb-2">📋 JSON Structure</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• <code className="bg-gray-200 px-1 rounded text-xs">id</code> - Template identifier</li>
                                    <li>• <code className="bg-gray-200 px-1 rounded text-xs">name</code> - Template name</li>
                                    <li>• <code className="bg-gray-200 px-1 rounded text-xs">layers</code> - Array of layers</li>
                                    <li>• <code className="bg-gray-200 px-1 rounded text-xs">background</code> - Background config</li>
                                    <li>• <code className="bg-gray-200 px-1 rounded text-xs">colorRoles</code> - Color mappings</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
