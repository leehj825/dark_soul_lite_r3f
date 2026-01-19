import { useState, useEffect } from 'react';
import { ParsedStickmanProject, parseStickmanProject } from 'stickman-animator-r3f';

const ASSET_URL = '/assets/data/moving_animations.sa3';

export function useAssetLoader() {
  const [projectData, setProjectData] = useState<ParsedStickmanProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(ASSET_URL);
        if (!response.ok) throw new Error(`Failed to load ${ASSET_URL}`);
        
        // 1. Get the raw binary data
        const arrayBuffer = await response.arrayBuffer();

        // 2. FIX: Decode ArrayBuffer to String using TextDecoder
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);

        // 3. Parse the string (removed 'await' based on your previous working version)
        const parsed = parseStickmanProject(text);
        
        if (active) {
          setProjectData(parsed);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          console.error("Asset Loader Error:", err);
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    load();
    return () => { active = false; };
  }, []);

  return { projectData, loading, error };
}