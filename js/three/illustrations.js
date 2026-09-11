import * as THREE from "../../assets/vendor/three.module.js";
import { FISH_ART, NEW_FISH_IDS } from "../data/art.js";
import { artLayout } from "../data/art-layout.js";
const textures = new Map(),
  materials = new Map();
export function illustratedCreature(c, scale = 1) {
  const dino = c.id.startsWith("dino_"),
    legacy = FISH_ART[c.id];
  const source =
    legacy || `assets/illustrations/${dino ? "dinosaurs" : "fish"}-atlas.png`;
  let mat = materials.get(c.id);
  if (!mat) {
    let texture = textures.get(source);
    if (!texture) {
      texture = new THREE.TextureLoader().load(source);
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.set(source, texture);
    }
    const map = texture.clone();
    // Shared source image, individual atlas UVs. No raster files are altered.
    if (!legacy) {
      const a = artLayout(c.id);
      map.repeat.set(a.w / a.width, a.h / a.height);
      map.offset.set(a.x / a.width, 1 - (a.y + a.h) / a.height);
    }
    mat = new THREE.SpriteMaterial({
      map,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        ${legacy ? "float key = diffuseColor.g - max(diffuseColor.r, diffuseColor.b); diffuseColor.a *= 1.0-smoothstep(0.12,0.3,key);" : "float white = min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b)); diffuseColor.a *= 1.0-smoothstep(0.88,0.99,white);"}
      `,
      );
    };
    mat.customProgramCacheKey = () =>
      legacy ? "legacy-fish" : "painted-atlas";
    materials.set(c.id, mat);
  }
  const group = new THREE.Group(),
    sprite = new THREE.Sprite(mat);
  const aspect = legacy ? 1.6 : artLayout(c.id).w / artLayout(c.id).h;
  sprite.scale.set((dino ? 2 : 1.5) * aspect, dino ? 2 : 1.5, 1);
  sprite.position.y = dino ? 1 : 0.8;
  group.add(sprite);
  group.scale.setScalar(scale);
  group.userData.illustrated = true;
  return group;
}
