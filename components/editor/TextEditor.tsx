// components/editor/TextEditor.tsx (NEW FILE - Implementing Phase 2.1 Inline Text Editing)

"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Konva from "konva";
import { KonvaNodeDefinition, TextProps } from "@/types/template";
import { Stage as KonvaStageType } from "konva/lib/Stage";

interface TextEditorProps {
    // The Konva Text node instance that triggered the edit
    konvaNode: Konva.Text; 
    // The node definition from the state
    nodeDef: KonvaNodeDefinition & { type: 'Text', props: TextProps };
    // Ref to the main Konva Stage to calculate position
    canvasStageRef: React.RefObject<KonvaStageType>;
    // Callback to tell the parent (CanvasStage) to commit the change and close the editor
    onStopEditing: (newText: string) => void;
}

/**
 * Renders an absolute-positioned HTML textarea on top of the Konva canvas
 * to provide a native text editing experience.
 */
const TextEditor: React.FC<TextEditorProps> = ({
    konvaNode,
    nodeDef,
    canvasStageRef,
    onStopEditing,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [text, setText] = useState(nodeDef.props.text);
    const { props } = nodeDef;

    // --- 1. Calculate HTML element position and style ---

    // Use Konva's internal client rectangle to get the bounding box, which includes
    // rotation, alignment, and multi-line wrapping, making the positioning correct.
    const rect = konvaNode.getClientRect();
    const stage = canvasStageRef.current;
    
    // We need the stage container's bounding box to calculate absolute position
    const containerRect = stage?.container().getBoundingClientRect(); 
    
    if (!stage || !containerRect) {
        return null;
    }
    
    // Calculate the absolute position of the Konva node's bounding box relative to the viewport
    const absoluteX = containerRect.left + rect.x;
    const absoluteY = containerRect.top + rect.y;

    // --- 2. Style Mapping ---

    // Map Konva properties to equivalent CSS styles
    const style: React.CSSProperties = {
        position: 'absolute',
        top: absoluteY,
        left: absoluteX,
        width: rect.width,
        height: rect.height,
        
        // Match Konva text styles
        fontSize: `${props.fontSize}px`,
        fontFamily: props.fontFamily,
        color: props.fill,
        // Konva's default lineHeight is roughly 1.2
        lineHeight: props.lineHeight ? `${props.lineHeight}` : '1.2', 
        textAlign: props.align || 'left',
        
        // Map Konva text decoration and style props
        textDecoration: props.textDecoration || '', 
        fontWeight: props.fontStyle?.includes('bold') ? 'bold' : 'normal',
        fontStyle: props.fontStyle?.includes('italic') ? 'italic' : 'normal',
        letterSpacing: props.letterSpacing ? `${props.letterSpacing}px` : 'normal',
        opacity: props.opacity,

        // Apply Konva rotation directly in CSS (Crucial for alignment)
        transform: `rotateZ(${props.rotation}deg)`,
        // Anchor the rotation to the top-left of the textarea's bounding box
        transformOrigin: '0% 0%', 
        
        // Remove all default textarea styling
        padding: '0px',
        margin: '0px',
        border: '1px solid transparent', // Use transparent border to match Konva's text box
        overflow: 'hidden',
        background: 'none', 
        resize: 'none',
        boxSizing: 'border-box',
        outline: 'none',
        zIndex: 100, // Ensure it sits above the canvas
    };

    // --- 3. Handlers ---

    // Handle blur: this is the primary commit mechanism
    const handleBlur = useCallback(() => {
        // Remove trailing new lines which can cause layout issues after commit
        const finalContent = text.replace(/\n+$/, ''); 
        onStopEditing(finalContent);
    }, [text, onStopEditing]);

    // Handle keydown: commit on Enter (unless shift is pressed for multiline)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Commit text on Enter, unless Shift+Enter is pressed for a new line
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default behavior (new line in textarea)
            textareaRef.current?.blur(); // Triggers handleBlur, which commits the text
        }
    };

    // --- 4. Focus and Initial Setup ---
    
    useEffect(() => {
        if (textareaRef.current) {
            // Immediately focus the textarea
            textareaRef.current.focus();
            
            // Set the selection range to the end of the text for better UX
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
        }
    }, []);


    // --- 5. Render ---
    return (
        <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={style}
            className="absolute"
        />
    );
};

export default TextEditor;


