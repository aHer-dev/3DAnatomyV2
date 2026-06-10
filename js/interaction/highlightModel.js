// js/interaction/highlightModel.js
import * as THREE from 'three';

let _prev = null;

export function highlightModel(model) {
  if (_prev && _prev !== model) {
    _prev.traverse(child => {
      if (child.isMesh && child.material?.emissive) {
        child.material.emissive.set(0x000000);
      }
    });
  }

  model.traverse(child => {
    if (child.isMesh && child.material) {
      if (!child.material.emissive) {
        child.material.emissive = new THREE.Color(0x222222);
      } else {
        child.material.emissive.set(0x222222);
      }
      child.material.needsUpdate = true;
    }
  });

  _prev = model;
}

export function clearHighlight() {
  if (_prev) {
    _prev.traverse(child => {
      if (child.isMesh && child.material?.emissive) {
        child.material.emissive.set(0x000000);
      }
    });
    _prev = null;
  }
}
