import { default as React } from 'react';
import { ParsedStickmanProject } from './parser';
interface StickmanPlayerProps {
    projectData: ParsedStickmanProject;
    isPlaying: boolean;
    scale?: number;
    loop?: boolean;
    activeClipId?: string; // <--- Add this line
}
export declare const StickmanPlayer: React.FC<StickmanPlayerProps>;
export {};
