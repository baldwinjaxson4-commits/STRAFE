# Art direction and assets

STRAFE uses an original coastal brutalist world: pale concrete, cool blue haze, teal water and mint accents. The reference concept informed the full-screen canvas, left-aligned menu, top navigation, compact bottom HUD and lower-right first-person viewmodel. The implementation uses real 3D geometry and lighting, so it is a stylized interpretation rather than a pixel-identical rendering of the concept.

The built-in Image Gen tool generated the concept and concrete material. No external game artwork, commercial maps or knife assets were used. The original concept remains in the Codex generation library; it is not shipped as the game background.

## Final production texture

- Path: `public/art/concrete.jpg`
- Source: generated PNG, resized to 1024 × 1024 and optimized as JPEG.
- Final prompt: “Use case: stylized-concept. Production game art asset: seamless square pale cool gray architectural cast concrete albedo texture for a first person 3D bunny hop platform game. Fine realistic pores and subtle mottling, tiny aggregate, restrained variation, straight orthographic flat surface evenly lit, no directional shadows, no perspective, no text, no objects, no border, no prominent cracks. Entire image one repeatable seamless material, sophisticated brutalist concrete matching airy coastal architecture. Will be repeated across 3D platforms.”

The ocean/sky are code-native shaders. Platforms, arches, goal, gloves, hands, knives and animations are original Three.js geometry, allowing free camera movement and distinct animated inspections.

## Concept prompt

“Use case: ui-mockup. Design complete primary screen of an original premium browser first person bunny hop game called STRAFE. 16:9 widescreen. Full bleed realtime 3D view of airy brutalist pale concrete floating platforms over a deep teal ocean, hazy blue sky, thin mint platform edges, distant abstract monoliths. Right lower foreground stylized angular 3D gloved hand holding a cyan silver straight tanto knife, original art. Understated dark translucent top bar STRAFE at left, PLAY / LOCKER / SETTINGS, right a sound icon. Left overlay large title 'Find your flow.' small subtitle 'A little air. A lot of momentum.' mint button 'Enter course' and smaller 'Hold SPACE to hop · A / D to strafe'. Top left below nav small map label '01 / COASTLINE'. Bottom small HUD timer 00:00.000, speed 0 u/s and course progress. Bottom right 'F Inspect · R Restart · ESC Pause'. Left text only occupies left third while entire world visible. Crisp modern grotesk type, muted warm white letters, utilitarian technical details, mint accents, generous negative space, no cards. Practical code-native UI and realtime 3D geometric scene. This is full game screen concept, not marketing website. Polished elegant game art, sophisticated restrained layout.”

## Expanded original assets

The additional knife and glove skins use deterministic canvas material textures: tiger stripes, scales, carbon weave, marble, shards, waves, hazard striping and star fields. These are code-native materials on the original 3D models. The ghost uses original transparent player geometry with an animated running pose. The soundtrack “Tidal Circuit” is an original 32-bar composition synthesized with Web Audio; its score lives in `src/music.js` and uses no third-party recordings or samples.
