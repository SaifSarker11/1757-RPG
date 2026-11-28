import { TRANSITION_SCENES } from './transition-scenes';
import { readSceneCycle, selectScene, type SceneCycle } from './transition-selection';

let memoryCycle: SceneCycle | null = null;
let warmed = false;
export function warmTransitionScenes(): void {
  if (warmed) return;
  warmed = true;
  for (const scene of TRANSITION_SCENES) { const image = new Image(); image.src = scene.src; }
}
export function nextTransitionScene() {
  let cycle = memoryCycle;
  if (!cycle) { try { cycle = readSceneCycle(sessionStorage.getItem('1757-transition-cycle')); } catch { cycle = { remaining: [], last: null }; } }
  const pick = selectScene(TRANSITION_SCENES.map(scene => scene.id), cycle);
  memoryCycle = pick.cycle;
  try { sessionStorage.setItem('1757-transition-cycle', JSON.stringify(pick.cycle)); } catch { /* Memory-only when storage is blocked. */ }
  return TRANSITION_SCENES.find(scene => scene.id === pick.id) ?? null;
}