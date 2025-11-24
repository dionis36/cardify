import React, { useState, useRef, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { Download, Upload, Plus, RefreshCw } from 'lucide-react';
import { KonvaNodeDefinition } from '@/types/template';

interface QRCodeDesignerProps {
    onAddImage: (file: File) => void;
    onAddNode: (node: KonvaNodeDefinition) => void;
    initialData?: any; // Type this properly if possible, but 'any' avoids circular deps for now
}

type ContentType = 'Website' | 'Email' | 'Phone' | 'SMS' | 'Contact' | 'Event';
type DotStyle = 'squares' | 'dots';
type EyeStyle = 'square' | 'round';

export default function QRCodeDesigner({ onAddImage, onAddNode, initialData }: QRCodeDesignerProps) {
    // --- State ---
    const [contentType, setContentType] = useState<ContentType>('Website');
    const [qrValue, setQrValue] = useState<string>('https://example.com');
    const [inputs, setInputs] = useState<Record<string, string>>({
        website: 'https://example.com',
        email: '',
        phone: '',
        smsPhone: '',
        smsMessage: '',
        firstName: '',
        lastName: '',
        org: '',
        contactPhone: '',
        contactEmail: '',
        eventTitle: '',
        eventLocation: '',
    });

    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#FFFFFF');
    const [transparentBg, setTransparentBg] = useState(false);
    const [dotStyle, setDotStyle] = useState<DotStyle>('squares');
    const [eyeStyle, setEyeStyle] = useState<EyeStyle>('square');
    const [logoFile, setLogoFile] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string>('');

    const qrRef = useRef<any>(null);

    // --- Initialization from Metadata (Edit Mode) ---
    useEffect(() => {
        if (initialData) {
            // Populate state from metadata
            if (initialData.contentType) setContentType(initialData.contentType);
            if (initialData.inputs) setInputs(initialData.inputs);
            if (initialData.fgColor) setFgColor(initialData.fgColor);
            if (initialData.bgColor) {
                if (initialData.bgColor === 'transparent') {
                    setTransparentBg(true);
                    setBgColor('#FFFFFF'); // Reset picker to white for convenience
                } else {
                    setTransparentBg(false);
                    setBgColor(initialData.bgColor);
                }
            }
            if (initialData.dotStyle) setDotStyle(initialData.dotStyle);
            if (initialData.eyeStyle) setEyeStyle(initialData.eyeStyle);
            if (initialData.logoUrl) setLogoFile(initialData.logoUrl);
            // cornerRadius is usually on the node props, not metadata, but we can store it in metadata too for consistency
            // or pass it separately. For now, let's assume it's in metadata or we default to 0.
        }
    }, [initialData]);

    // --- Content Logic ---
    useEffect(() => {
        generateQrValue();
    }, [inputs, contentType]);

    const generateQrValue = () => {
        let value = '';
        setError('');

        switch (contentType) {
            case 'Website':
                value = inputs.website;
                break;
            case 'Email':
                value = `mailto:${inputs.email}`;
                break;
            case 'Phone':
                value = `tel:${inputs.phone}`;
                break;
            case 'SMS':
                value = `smsto:${inputs.smsPhone}:${inputs.smsMessage}`;
                break;
            case 'Contact':
                value = `BEGIN:VCARD\nVERSION:3.0\nN:${inputs.lastName};${inputs.firstName}\nFN:${inputs.firstName} ${inputs.lastName}\nORG:${inputs.org}\nTEL:${inputs.contactPhone}\nEMAIL:${inputs.contactEmail}\nEND:VCARD`;
                break;
            case 'Event':
                value = `Event: ${inputs.eventTitle}\nLocation: ${inputs.eventLocation}`;
                break;
        }
        setQrValue(value);
    };

    const handleInputChange = (field: string, value: string) => {
        setInputs(prev => ({ ...prev, [field]: value }));
    };

    // --- Logo Handling ---
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoFile(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Actions ---
    const handleDownload = () => {
        if (qrRef.current) {
            qrRef.current.download('png', 'qrcode');
        }
    };

    const handleAddToCanvas = () => {
        if (qrRef.current) {
            const canvas = document.getElementById('react-qrcode-logo') as HTMLCanvasElement;
            if (canvas) {
                canvas.toBlob((blob) => {
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const base64 = e.target?.result as string;
                            const timestamp = Date.now();
                            const id = `qrcode_${timestamp}`;

                            // Construct Metadata
                            const metadata = {
                                value: qrValue,
                                fgColor,
                                bgColor: transparentBg ? 'transparent' : bgColor,
                                dotStyle,
                                eyeStyle,
                                logoUrl: logoFile,
                                contentType,
                                inputs
                            };

                            const newNode: KonvaNodeDefinition = {
                                id,
                                type: 'Image',
                                props: {
                                    id,
                                    x: 50, y: 50,
                                    width: 200, height: 200, // Default size
                                    rotation: 0, opacity: 1,
                                    src: base64,
                                    category: 'Image',
                                    qrMetadata: metadata // Store metadata for editing
                                },
                                editable: true,
                                locked: false,
                            };

                            onAddNode(newNode);
                        };
                        reader.readAsDataURL(blob);
                    }
                });
            }
        }
    };

    // --- Render Helpers ---
    const renderInputFields = () => {
        switch (contentType) {
            case 'Website':
                return (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">Website URL</label>
                        <input
                            type="text"
                            value={inputs.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="https://www.example.com"
                        />
                    </div>
                );
            case 'Email':
                return (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">Email Address</label>
                        <input
                            type="email"
                            value={inputs.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="name@example.com"
                        />
                    </div>
                );
            case 'Phone':
                return (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">Phone Number</label>
                        <input
                            type="tel"
                            value={inputs.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="+1 555 123 4567"
                        />
                    </div>
                );
            case 'SMS':
                return (
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Phone Number</label>
                            <input
                                type="tel"
                                value={inputs.smsPhone}
                                onChange={(e) => handleInputChange('smsPhone', e.target.value)}
                                className="w-full p-2 border rounded text-sm"
                                placeholder="+1 555 123 4567"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Message</label>
                            <textarea
                                value={inputs.smsMessage}
                                onChange={(e) => handleInputChange('smsMessage', e.target.value)}
                                className="w-full p-2 border rounded text-sm"
                                placeholder="Hello!"
                                rows={2}
                            />
                        </div>
                    </div>
                );
            case 'Contact':
                return (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={inputs.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                className="w-full p-2 border rounded text-sm"
                                placeholder="First Name"
                            />
                            <input
                                type="text"
                                value={inputs.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                className="w-full p-2 border rounded text-sm"
                                placeholder="Last Name"
                            />
                        </div>
                        <input
                            type="text"
                            value={inputs.org}
                            onChange={(e) => handleInputChange('org', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Organization"
                        />
                        <input
                            type="tel"
                            value={inputs.contactPhone}
                            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Phone"
                        />
                        <input
                            type="email"
                            value={inputs.contactEmail}
                            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Email"
                        />
                    </div>
                );
            case 'Event':
                return (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={inputs.eventTitle}
                            onChange={(e) => handleInputChange('eventTitle', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Event Title"
                        />
                        <input
                            type="text"
                            value={inputs.eventLocation}
                            onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Location"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-lg font-bold text-gray-800">QR Code Designer</h2>

            {/* 1. Content Type Selector */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Content Type</label>
                <div className="flex flex-wrap gap-2">
                    {(['Website', 'Email', 'Phone', 'SMS', 'Contact', 'Event'] as ContentType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setContentType(type)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${contentType === type
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Content Inputs */}
            <div className="space-y-2">
                {renderInputFields()}
                {error && <p className="text-red-500 text-xs">{error}</p>}
            </div>

            {/* 3. Style Controls */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Style & Colors</label>

                {/* Style Presets */}
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => { setDotStyle('squares'); setEyeStyle('square'); }}
                        className={`p-2 border rounded flex flex-col items-center gap-1 hover:bg-gray-50 ${dotStyle === 'squares' && eyeStyle === 'square' ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                    >
                        <div className="w-6 h-6 bg-black"></div>
                        <span className="text-[10px]">Square</span>
                    </button>
                    <button
                        onClick={() => { setDotStyle('dots'); setEyeStyle('square'); }}
                        className={`p-2 border rounded flex flex-col items-center gap-1 hover:bg-gray-50 ${dotStyle === 'dots' && eyeStyle === 'square' ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                    >
                        <div className="w-6 h-6 bg-black rounded-full"></div>
                        <span className="text-[10px]">Dots</span>
                    </button>
                    <button
                        onClick={() => { setDotStyle('dots'); setEyeStyle('round'); }}
                        className={`p-2 border rounded flex flex-col items-center gap-1 hover:bg-gray-50 ${dotStyle === 'dots' && eyeStyle === 'round' ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                    >
                        <div className="w-6 h-6 bg-black rounded-lg"></div>
                        <span className="text-[10px]">Rounded</span>
                    </button>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Foreground</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={fgColor}
                                onChange={(e) => setFgColor(e.target.value)}
                                className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                            />
                            <span className="text-xs font-mono">{fgColor}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Background</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                disabled={transparentBg}
                                className={`w-8 h-8 p-0 border-0 rounded cursor-pointer ${transparentBg ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <span className="text-xs font-mono">{transparentBg ? 'None' : bgColor}</span>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-gray-600 mt-1 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={transparentBg}
                                onChange={(e) => setTransparentBg(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            Transparent
                        </label>
                    </div>
                </div>
            </div>

            {/* 4. Logo Upload */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Logo</label>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer text-sm text-gray-700 transition-colors">
                        <Upload size={16} />
                        <span>Upload Image</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    {logoFile && (
                        <div className="relative group">
                            <img src={logoFile} alt="Logo" className="w-10 h-10 object-contain border rounded bg-white" />
                            <button
                                onClick={() => setLogoFile(undefined)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Plus size={12} className="rotate-45" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 5. Preview & Actions */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-center bg-gray-50 p-4 rounded-lg border">
                    <QRCode
                        ref={qrRef}
                        value={qrValue}
                        size={200}
                        fgColor={fgColor}
                        bgColor={transparentBg ? 'transparent' : bgColor}
                        qrStyle={dotStyle}
                        logoImage={logoFile}
                        logoWidth={50}
                        logoHeight={50}
                        eyeRadius={eyeStyle === 'round' ? [10, 10, 10] : 0}
                        id="react-qrcode-logo"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition-colors text-sm"
                    >
                        <Download size={16} />
                        Download
                    </button>
                    <button
                        onClick={handleAddToCanvas}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                        <Plus size={16} />
                        {initialData ? 'Update Card' : 'Add to Card'}
                    </button>
                </div>
            </div>
        </div>
    );
}
