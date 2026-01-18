/// <reference types="vite/client" />

declare module 'stickman-animator-r3f' {
  import { FC } from 'react';

  export interface StickmanProjectData {
    // details unknown, treating as opaque object
    [key: string]: any;
  }

  export interface StickmanProps {
    projectData: StickmanProjectData | null;
    activeClipId: string | undefined;
    isPlaying: boolean;
  }

  export const Stickman: FC<StickmanProps>;

  export function parseStickmanProject(data: string): StickmanProjectData;
}
