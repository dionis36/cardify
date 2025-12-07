import React, { useState, useRef, useEffect } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { Download, Upload, Plus, RefreshCw, ChevronDown } from 'lucide-react';
import { KonvaNodeDefinition, KonvaNodeProps } from '@/types/template';
import { AVAILABLE_LOGOS, LogoVariant } from '@/lib/logoIndex';
import ColorPicker from '@/components/editor/ColorPicker';

interface QRCodeDesignerProps {
    onAddImage: (file: File) => void;
    onAddNode: (node: KonvaNodeDefinition) => void;
    onNodeChange?: (index: number, updates: Partial<KonvaNodeProps>) => void;
    selectedNodeIndex?: number | null;
    initialData?: any; // Type this properly if possible, but 'any' avoids circular deps for now
}

type ContentType = 'Website' | 'Email' | 'Phone' | 'SMS' | 'Contact' | 'Event';
type DotStyle = 'squares' | 'dots';
type EyeStyle = 'square' | 'round';
type ECLevel = 'L' | 'M' | 'Q' | 'H'; // Error correction: L=7%, M=15%, Q=25%, H=30%
type LogoSource = 'library' | 'custom' | null;

export default function QRCodeDesigner({ onAddImage, onAddNode, onNodeChange, selectedNodeIndex, initialData }: QRCodeDesignerProps) {
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
    const [transparentBg, setTransparentBg] = useState(true); // Default to transparent
    const [dotStyle, setDotStyle] = useState<DotStyle>('squares');
    const [eyeStyle, setEyeStyle] = useState<EyeStyle>('square');
    const [eyeRadius, setEyeRadius] = useState<number | [number, number, number]>(0);
    const [logoFile, setLogoFile] = useState<string | undefined>(undefined);
    const [logoSource, setLogoSource] = useState<LogoSource>(null);
    const [ecLevel, setEcLevel] = useState<ECLevel>('Q'); // Q = 25% error correction, good for logos
    const [logoTab, setLogoTab] = useState<'library' | 'upload'>('library');
    const [isLogoExpanded, setIsLogoExpanded] = useState(false);
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
            if (initialData.eyeRadius !== undefined) setEyeRadius(initialData.eyeRadius);
            if (initialData.logoUrl) setLogoFile(initialData.logoUrl);
            if (initialData.logoSource) setLogoSource(initialData.logoSource);
            if (initialData.ecLevel) setEcLevel(initialData.ecLevel);
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

    // Calculate brightness of foreground color to determine adaptive preview background
    const getPreviewBgColor = () => {
        // Convert hex to RGB
        const hex = fgColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Calculate relative luminance (perceived brightness)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // If foreground is light (brightness > 128), use dark background
        // If foreground is dark, use light background
        return brightness > 128 ? '#1f2937' : '#f9fafb';
    };

    // --- Logo Handling ---
    const handleLogoFromLibrary = (logoVariant: LogoVariant) => {
        setLogoFile(logoVariant.path);
        setLogoSource('library');
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoFile(e.target?.result as string);
                setLogoSource('custom');
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

                            // Construct Metadata
                            const metadata = {
                                value: qrValue,
                                fgColor,
                                bgColor: transparentBg ? 'transparent' : bgColor,
                                dotStyle,
                                eyeStyle,
                                eyeRadius,
                                logoUrl: logoFile,
                                logoSource,
                                ecLevel,
                                contentType,
                                inputs
                            };

                            // Check if we're updating an existing QR code
                            if (selectedNodeIndex !== null && selectedNodeIndex !== undefined && onNodeChange) {
                                // Update existing QR code
                                onNodeChange(selectedNodeIndex, {
                                    src: base64,
                                    qrMetadata: metadata
                                } as any);
                            } else {
                                // Add new QR code
                                const id = `qrcode_${timestamp}`;
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
                            }
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
                        onClick={() => { setDotStyle('squares'); setEyeStyle('square'); setEyeRadius(0); }}
                        className={`p-2 border rounded flex flex-col items-center gap-1 hover:bg-gray-50 ${dotStyle === 'squares' && eyeRadius === 0 ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                    >
                        <div className="w-6 h-6 bg-black"></div>
                        <span className="text-[10px]">Classic</span>
                    </button>
                    <button
                        onClick={() => { setDotStyle('dots'); setEyeStyle('square'); setEyeRadius(0); }}
                        className={`p-2 border rounded flex flex-col items-center gap-1 hover:bg-gray-50 ${dotStyle === 'dots' && eyeRadius === 0 ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                    >
                        <div className="w-6 h-6 bg-black rounded-full"></div>
                        <span className="text-[10px]">Dots</span>
                    </button>
                    <button
                        onClick={() => { setDotStyle('squares'); setEyeStyle('round'); setEyeRadius([10, 10, 10]); }}
                        className={`p-2 border rounded flex flex-col items-center gap-1 hover:bg-gray-50 ${dotStyle === 'squares' && Array.isArray(eyeRadius) && eyeRadius[0] === 10 ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                    >
                        <div className="w-6 h-6 bg-black rounded-md"></div>
                        <span className="text-[10px]">Rounded</span>
                    </button>
                    <button
                        onClick={() => { setDotStyle('dots'); setEyeStyle('round'); setEyeRadius([10, 10, 10]); }}
                        className={`p-2 border rounded flex flex-col items-center gap-1 hover:bg-gray-50 ${dotStyle === 'dots' && Array.isArray(eyeRadius) && eyeRadius[0] === 10 ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                    >
                        <div className="w-6 h-6 bg-black rounded-lg"></div>
                        <span className="text-[10px]">Smooth</span>
                    </button>
                    <button
                        onClick={() => { setDotStyle('squares'); setEyeStyle('round'); setEyeRadius([15, 15, 15]); }}
                        className={`p-2 border rounded flex flex-col items-center gap-1 hover:bg-gray-50 ${dotStyle === 'squares' && Array.isArray(eyeRadius) && eyeRadius[0] === 15 ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                    >
                        <div className="w-6 h-6 bg-black" style={{ borderRadius: '20%' }}></div>
                        <span className="text-[10px]">Soft</span>
                    </button>
                    <button
                        onClick={() => { setDotStyle('dots'); setEyeStyle('round'); setEyeRadius([15, 15, 15]); }}
                        className={`p-2 border rounded flex flex-col items-center gap-1 hover:bg-gray-50 ${dotStyle === 'dots' && Array.isArray(eyeRadius) && eyeRadius[0] === 15 ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                    >
                        <div className="w-6 h-6 bg-black rounded-xl"></div>
                        <span className="text-[10px]">Fluid</span>
                    </button>
                </div>

                {/* Colors */}
                <div className="space-y-3">
                    <ColorPicker
                        label="Foreground Color"
                        color={fgColor}
                        onChange={setFgColor}
                    />
                    <div className="space-y-2">
                        <ColorPicker
                            label="Background Color"
                            color={bgColor}
                            onChange={setBgColor}
                            disabled={transparentBg}
                        />
                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={transparentBg}
                                onChange={(e) => setTransparentBg(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            Transparent Background
                        </label>
                    </div>
                </div>
            </div>

            {/* 4. Logo Selection - Collapsible */}
            <div className="space-y-2">
                {/* Collapsible Header */}
                <button
                    onClick={() => setIsLogoExpanded(!isLogoExpanded)}
                    className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                >
                    <span>Logo (Optional)</span>
                    <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${isLogoExpanded ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Collapsible Content */}
                {isLogoExpanded && (
                    <>
                        {/* Tab Selection */}
                        <div className="flex gap-2 border-b">
                            <button
                                onClick={() => setLogoTab('library')}
                                className={`px-3 py-2 text-xs font-medium transition-colors ${logoTab === 'library'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                From Library
                            </button>
                            <button
                                onClick={() => setLogoTab('upload')}
                                className={`px-3 py-2 text-xs font-medium transition-colors ${logoTab === 'upload'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Upload Custom
                            </button>
                        </div>

                        {/* Tab Content */}
                        {logoTab === 'library' ? (
                            <div className="space-y-2">
                                <div className="max-h-48 overflow-y-auto border rounded p-2">
                                    <div className="grid grid-cols-6 gap-2">
                                        {AVAILABLE_LOGOS.map((logoFamily) => (
                                            logoFamily.variants.slice(0, 1).map((variant) => (
                                                <button
                                                    key={`${logoFamily.id}_${variant.color}`}
                                                    onClick={() => handleLogoFromLibrary(variant)}
                                                    className={`aspect-square p-1 bg-white border rounded hover:border-blue-500 hover:shadow-md transition-all ${logoFile === variant.path ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'
                                                        }`}
                                                    title={logoFamily.name}
                                                >
                                                    <img
                                                        src={variant.path}
                                                        alt={logoFamily.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </button>
                                            ))
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 text-center">
                                        Showing all {AVAILABLE_LOGOS.length} logos
                                    </p>
                                </div>
                                {/* Remove Logo Button */}
                                {logoFile && logoSource === 'library' && (
                                    <button
                                        onClick={() => { setLogoFile(undefined); setLogoSource(null); }}
                                        className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm font-medium transition-colors"
                                    >
                                        Remove Logo
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer text-sm text-gray-700 transition-colors">
                                    <Upload size={16} />
                                    <span>Upload Image</span>
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                </label>
                                {logoFile && logoSource === 'custom' && (
                                    <div className="relative group">
                                        <img src={logoFile} alt="Logo" className="w-10 h-10 object-contain border rounded bg-white" />
                                        <button
                                            onClick={() => { setLogoFile(undefined); setLogoSource(null); }}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Plus size={12} className="rotate-45" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 5. Preview & Actions */}
            <div className="space-y-4 pt-4 border-t">
                <div
                    className="flex justify-center p-4 rounded-lg border transition-colors"
                    style={{ backgroundColor: getPreviewBgColor() }}
                >
                    <QRCode
                        ref={qrRef}
                        value={qrValue}
                        size={200}
                        fgColor={fgColor}
                        bgColor={transparentBg ? 'transparent' : bgColor}
                        qrStyle={dotStyle}
                        logoImage={logoFile}
                        logoWidth={30}
                        logoHeight={30}
                        removeQrCodeBehindLogo={true}
                        ecLevel={ecLevel}
                        eyeRadius={eyeRadius}
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
                        {(selectedNodeIndex !== null && selectedNodeIndex !== undefined) ? 'Update QR Code' : 'Add to Card'}
                    </button>
                </div>
            </div>
        </div>
    );
}
