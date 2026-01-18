import { StickmanSkeleton } from '../core/StickmanSkeleton';
import { StickmanClip } from '../core/StickmanKeyframe';
export interface ParsedStickmanProject {
    clips: StickmanClip[];
    currentSkeleton: StickmanSkeleton;
    meta: {
        skin?: any;
        polygons?: any;
        headRadius?: number;
        strokeWidth?: number;
    };
}
export declare function parseStickmanProject(json: string): ParsedStickmanProject;
