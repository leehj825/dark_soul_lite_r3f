import { useState, useEffect } from 'react';

// NEW:
import { parseStickmanProject, ParsedStickmanProject as StickmanProjectData } from 'stickman-animator-r3f';
export function useAssetLoader() {
  const [projectData, setProjectData] = useState<StickmanProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadAssets() {
      try {
        const response = await fetch('/assets/data/player_animations.sa3');
        if (!response.ok) {
          throw new Error(`Failed to load assets: ${response.statusText}`);
        }
        const text = await response.text();
        const data = parseStickmanProject(text);
        setProjectData(data);
      } catch (err) {
        console.error('Error loading stickman project:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, []);

  return { projectData, loading, error };
}
