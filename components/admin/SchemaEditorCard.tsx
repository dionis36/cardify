"use client";

import { useState } from 'react';
import { Shield, Edit, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function SchemaEditorCard() {
    const [isEditing, setIsEditing] = useState(false);
    const [schema, setSchema] = useState<any>(null);
    const [schemaText, setSchemaText] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const loadSchema = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/templates/schema');
            const data = await response.json();
            setSchema(data.schema);
            setSchemaText(JSON.stringify(data.schema, null, 2));
        } catch (err) {
            setError('Failed to load schema');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async () => {
        await loadSchema();
        setIsEditing(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');

        try {
            // Validate JSON
            const parsedSchema = JSON.parse(schemaText);

            const response = await fetch('/api/templates/schema', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schema: parsedSchema }),
            });

            if (response.ok) {
                setSuccess(true);
                setIsEditing(false);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to save schema');
            }
        } catch (err) {
            setError('Invalid JSON format');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError('');
    };

    if (isEditing) {
        return (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-lg p-6 border-2 border-purple-300">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <Shield size={24} className="text-purple-600 mr-3" />
                        <div>
                            <h3 className="font-bold text-gray-900">Template Schema Editor</h3>
                            <p className="text-sm text-gray-600">public/templates/schema.json</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start">
                        <AlertCircle size={16} className="text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <textarea
                    value={schemaText}
                    onChange={(e) => setSchemaText(e.target.value)}
                    className="w-full h-96 px-4 py-3 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    spellCheck={false}
                />

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                    >
                        <Save size={16} className="mr-2" />
                        {saving ? 'Saving...' : 'Save Schema'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow p-4 border-2 border-purple-300 hover:border-purple-400 transition">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                    <Shield size={20} className="text-purple-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">Template Schema</h3>
                </div>

                {success && (
                    <div className="flex items-center text-green-600 text-xs">
                        <CheckCircle size={14} className="mr-1" />
                        Saved!
                    </div>
                )}
            </div>

            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                JSON Schema validation rules for all templates
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                    Schema
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    Validation
                </span>
            </div>

            <div className="text-xs text-gray-500 mb-3">
                public/templates/schema.json
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
                <button
                    onClick={handleEdit}
                    disabled={loading}
                    className="text-sm text-purple-600 hover:text-purple-700 transition"
                >
                    <Edit size={14} className="inline mr-1" />
                    {loading ? 'Loading...' : 'Edit'}
                </button>
            </div>
        </div>
    );
}
