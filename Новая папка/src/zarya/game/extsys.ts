import { ACHIEVEMENTS, updateAchievements } from './achievements';
import { updateCaravans, caravanSnapshot } from './caravans';
import { chron } from './extstate';
import type { Game } from './game';
import { rivalSnapshot, updateRivals } from './rivals';
import { iceK, rainK, seasonInfo, updateSeasons } from './seasons';
import { updateVictory } from './victory';
import { WONDER_DEFS, updateWonders } from './wonders';

/** общий цикл новых систем: сезоны, чудеса, ИИ-державы, караваны, достижения, победа */
export function extUpdate(g: Game, dt: number) {
  const X = g.ext;
  updateSeasons(g, dt);
  updateWonders(g, dt);
  updateRivals(g, dt);
  updateCaravans(g, dt);
  updateAchievements(g, dt);
  updateVictory(g, dt);
  if (seasonInfo(g).winter && g.starving) X.winterHungerOk = false;
  X.milT -= dt;
  if (X.milT <= 0) {
    X.milT = 1;
    const pop = g.totalPop();
    for (const m of [10, 25, 50, 100, 200]) {
      if (pop >= m && X.popSeen < m) {
        X.popSeen = m;
        chron(g, `Население достигло ${m} человек`, 'good');
      }
    }
    const tn = Math.floor(g.done.size / 10) * 10;
    if (tn > X.techSeen) {
      X.techSeen = tn;
      chron(g, `Изучено ${tn} технологий`, 'sci');
    }
    const ep = g.epoch();
    if (ep !== X.epochSeen) {
      if (X.epochSeen) chron(g, `Наступила эпоха: ${ep}`, 'sci');
      X.epochSeen = ep;
    }
  }
}

let progCache: { t: number; v: Record<string, [number, number]> } | null = null;

export function extSnapshot(g: Game) {
  const X = g.ext;
  const s = seasonInfo(g);
  if (!progCache || Math.abs(g.time - progCache.t) > 1.5 || g.time < progCache.t) {
    progCache = { t: g.time, v: Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a.progress(g)])) };
  }
  return {
    season: { idx: s.idx, name: s.def.name, icon: s.def.icon, color: s.def.color, dayIn: s.dayIn, left: s.left, year: s.year, lines: s.def.lines, rainy: s.rainy, winter: s.winter, ice: iceK(g), rain: rainK(g) },
    rivals: rivalSnapshot(g),
    caravans: caravanSnapshot(g),
    wonders: X.wonders.map((w) => ({ id: w.id, wk: w.wk, name: WONDER_DEFS[w.wk].name, icon: WONDER_DEFS[w.wk].icon, bonus: WONDER_DEFS[w.wk].bonus, desc: WONDER_DEFS[w.wk].desc, x: w.x, y: w.y, owner: w.owner, ownerName: w.ownerName })),
    ach: { ...X.ach },
    achProg: progCache.v,
    cnt: { ...X.cnt },
    chron: X.chronicle,
    chronN: X.chronicle.length,
    prog: { ...X.prog },
    victory: X.victory,
    victoryDismissed: X.victoryDismissed,
    samples: X.samples,
  };
}
export type ExtSnap = ReturnType<typeof extSnapshot>;
