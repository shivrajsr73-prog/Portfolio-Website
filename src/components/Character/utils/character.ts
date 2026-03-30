import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { decryptFile } from "./decrypt";

function toMaterialArray(
  material: THREE.Material | THREE.Material[]
): THREE.Material[] {
  return Array.isArray(material) ? material : [material];
}

function applySoftColorStyle(character: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(character);
  const minY = box.min.y;
  const maxY = box.max.y;
  const totalH = Math.max(maxY - minY, 0.001);

  const skinTone = new THREE.Color("#c89484");
  const shirtTone = new THREE.Color("#2b2d33");
  const capTone = new THREE.Color("#d8d7dc");
  const hairTone = new THREE.Color("#14161c");
  const teethTone = new THREE.Color("#efedf2");

  character.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;

    // Important: many meshes share one material in GLTF.
    // Clone per-mesh so face and shirt colors don't overwrite each other.
    if (!mesh.userData.__colorizedMaterial) {
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => m.clone());
      } else {
        mesh.material = mesh.material.clone();
      }
      mesh.userData.__colorizedMaterial = true;
    }

    const id = `${mesh.name} ${toMaterialArray(mesh.material)
      .map((m) => m.name)
      .join(" ")}`.toLowerCase();

    // Don't touch monitor/screen emissive pieces
    if (id.includes("screenlight") || id.includes("plane004") || id.includes("monitor")) {
      return;
    }

    const meshBox = new THREE.Box3().setFromObject(mesh);
    const meshCenterY = (meshBox.min.y + meshBox.max.y) / 2;
    const meshCenterNorm = (meshCenterY - minY) / totalH;
    const meshHeightNorm = (meshBox.max.y - meshBox.min.y) / totalH;

    toMaterialArray(mesh.material).forEach((mat) => {
      const std = mat as THREE.MeshStandardMaterial;
      if (!("color" in std)) return;

      // Name-first classification for stable coloring.
      if (
        (id.includes("eye") || id.includes("iris") || id.includes("pupil")) &&
        !id.includes("face") &&
        !id.includes("head") &&
        !id.includes("skin")
      ) {
        // Keep eye tone close to original.
      } else if (
        id.includes("tooth") ||
        id.includes("teeth") ||
        id.includes("dental")
      ) {
        std.color.copy(teethTone);
      } else if (
        id.includes("face") ||
        id.includes("head") ||
        id.includes("ear") ||
        id.includes("nose") ||
        id.includes("cheek") ||
        id.includes("skin") ||
        id.includes("mouth") ||
        id.includes("lip")
      ) {
        std.color.copy(skinTone);
        if ("emissive" in std) {
          std.emissive = new THREE.Color("#2b120d");
          std.emissiveIntensity = 0.08;
        }
        if ("roughness" in std) std.roughness = 0.5;
        if ("metalness" in std) std.metalness = 0.02;
      } else if (
        id.includes("shirt") ||
        id.includes("cloth") ||
        id.includes("torso") ||
        id.includes("sweater") ||
        id.includes("tshirt") ||
        id.includes("body")
      ) {
        std.color.copy(shirtTone);
      } else if (
        id.includes("hair") ||
        id.includes("brow") ||
        id.includes("lash")
      ) {
        std.color.copy(hairTone);
      } else if (id.includes("hat") || id.includes("cap") || id.includes("helmet")) {
        std.color.copy(capTone);
      } else {
        // Fallback when names are unclear:
        // lower section => shirt
        // upper-mid section (face area) => skin
        // only extreme top tiny parts => cap
        const isLikelyFaceZone =
          meshCenterNorm > 0.52 &&
          meshCenterNorm < 0.90 &&
          !id.includes("hair") &&
          !id.includes("brow") &&
          !id.includes("lash") &&
          !id.includes("eye") &&
          !id.includes("hat") &&
          !id.includes("cap");

        if (meshCenterNorm < 0.36) {
          std.color.copy(shirtTone);
        } else if (isLikelyFaceZone) {
          std.color.copy(skinTone);
        } else if (meshCenterNorm > 0.94 && meshHeightNorm < 0.18) {
          std.color.copy(capTone);
        } else {
          std.color.copy(skinTone);
        }
      }

      if ("roughness" in std) std.roughness = Math.min(1, std.roughness + 0.06);
      if ("metalness" in std) std.metalness = Math.max(0, std.metalness - 0.04);
      std.needsUpdate = true;
    });
  });
}

function applyTeethVisiblePose(character: THREE.Object3D) {
  character.traverse((obj) => {
    const name = obj.name.toLowerCase();

    // Slightly open jaw / lips if these bones exist.
    if (obj.type === "Bone") {
      if (name.includes("jaw")) {
        obj.rotation.x += 0.08;
      }
      if (name.includes("lip") && name.includes("lower")) {
        obj.rotation.x += 0.04;
      }
      if (name.includes("lip") && name.includes("upper")) {
        obj.rotation.x -= 0.02;
      }
    }

    // Bring teeth a little forward if teeth mesh exists.
    if ((obj as THREE.Mesh).isMesh && (name.includes("teeth") || name.includes("tooth"))) {
      obj.position.z += 0.015;
    }

    // Generic morph-target support: enable smile/mouth open a bit.
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
      Object.entries(mesh.morphTargetDictionary).forEach(([key, index]) => {
        const k = key.toLowerCase();
        if (k.includes("smile")) {
          mesh.morphTargetInfluences![index] = Math.max(
            mesh.morphTargetInfluences![index] || 0,
            0.22
          );
        }
        if (k.includes("mouthopen") || k.includes("jawopen")) {
          mesh.morphTargetInfluences![index] = Math.max(
            mesh.morphTargetInfluences![index] || 0,
            0.18
          );
        }
      });
    }
  });
}

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = () => {
    return new Promise<GLTF | null>(async (resolve, reject) => {
      try {
        const encryptedBlob = await decryptFile(
          "/models/character.enc",
          "Character3D#@"
        );
        const blobUrl = URL.createObjectURL(new Blob([encryptedBlob]));

        let character: THREE.Object3D;
        loader.load(
          blobUrl,
          async (gltf) => {
            character = gltf.scene;
            applySoftColorStyle(character);
            applyTeethVisiblePose(character);
            await renderer.compileAsync(character, camera, scene);
            character.traverse((child: any) => {
              if (child.isMesh) {
                const mesh = child as THREE.Mesh;
                child.castShadow = true;
                child.receiveShadow = true;
                mesh.frustumCulled = true;
              }
            });
            resolve(gltf);
            setCharTimeline(character, camera);
            setAllTimeline();
            character!.getObjectByName("footR")!.position.y = 3.36;
            character!.getObjectByName("footL")!.position.y = 3.36;
            dracoLoader.dispose();
          },
          undefined,
          (error) => {
            console.error("Error loading GLTF model:", error);
            reject(error);
          }
        );
      } catch (err) {
        reject(err);
        console.error(err);
      }
    });
  };

  return { loadCharacter };
};

export default setCharacter;
