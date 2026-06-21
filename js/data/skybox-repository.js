/**
 * @file   js/data/skybox-repository.js
 * @layer  data
 * @domain home
 * @depends config.js
 *
 * Cung cấp danh sách image sets cho Skybox Cube.
 * Không chứa logic render hay DOM — chỉ quản lý dữ liệu.
 */

import Config from '../core/config.js';

/**
 * @typedef {Object} SkyboxFace
 * @property {'front'|'back'|'left'|'right'|'top'|'bottom'} face
 * @property {string} url
 * @property {string} alt
 */

/**
 * @typedef {Object} SkyboxImageSet
 * @property {string}       id
 * @property {string}       name
 * @property {string}       description
 * @property {SkyboxFace[]} faces
 */

// ── Mock data ────────────────────────────────────────────────────
// Thay URL bằng ảnh thực khi deploy.
// Mỗi face: 2048×2048px khuyến nghị, tỉ lệ 1:1.

/** @type {SkyboxImageSet[]} */
const _imageSets = [
  {
    id: 'nebula-cosmos',
    name: 'Nebula Cosmos',
    description: 'Không gian sâu thẳm với tinh vân màu tím',
    faces: [
      { face: 'front',  url: 'assets/skybox/nebula/front.webp',  alt: 'Tinh vân phía trước' },
      { face: 'back',   url: 'assets/skybox/nebula/back.webp',   alt: 'Tinh vân phía sau'   },
      { face: 'left',   url: 'assets/skybox/nebula/left.webp',   alt: 'Tinh vân bên trái'   },
      { face: 'right',  url: 'assets/skybox/nebula/right.webp',  alt: 'Tinh vân bên phải'   },
      { face: 'top',    url: 'assets/skybox/nebula/top.webp',    alt: 'Tinh vân phía trên'  },
      { face: 'bottom', url: 'assets/skybox/nebula/bottom.webp', alt: 'Tinh vân phía dưới'  },
    ],
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    description: 'Thiên hà xoắn ốc với hàng tỉ ngôi sao',
    faces: [
      { face: 'front',  url: 'assets/skybox/deepspace/front.jpg',  alt: 'Thiên hà phía trước' },
      { face: 'back',   url: 'assets/skybox/deepspace/back.jpg',   alt: 'Thiên hà phía sau'   },
      { face: 'left',   url: 'assets/skybox/deepspace/left.jpg',   alt: 'Thiên hà bên trái'   },
      { face: 'right',  url: 'assets/skybox/deepspace/right.jpg',  alt: 'Thiên hà bên phải'   },
      { face: 'top',    url: 'assets/skybox/deepspace/top.jpg',    alt: 'Thiên hà phía trên'  },
      { face: 'bottom', url: 'assets/skybox/deepspace/bottom.jpg', alt: 'Thiên hà phía dưới'  },
    ],
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'Cực quang huyền ảo trên bầu trời đêm',
    faces: [
      { face: 'front',  url: 'assets/skybox/aurora/front.jpg',  alt: 'Cực quang phía trước' },
      { face: 'back',   url: 'assets/skybox/aurora/back.jpg',   alt: 'Cực quang phía sau'   },
      { face: 'left',   url: 'assets/skybox/aurora/left.jpg',   alt: 'Cực quang bên trái'   },
      { face: 'right',  url: 'assets/skybox/aurora/right.jpg',  alt: 'Cực quang bên phải'   },
      { face: 'top',    url: 'assets/skybox/aurora/top.jpg',    alt: 'Cực quang phía trên'  },
      { face: 'bottom', url: 'assets/skybox/aurora/bottom.jpg', alt: 'Cực quang phía dưới'  },
    ],
  },
];

// ── Repository ───────────────────────────────────────────────────

const SkyboxRepository = (() => {

  /**
   * Lấy tất cả image sets.
   * @returns {SkyboxImageSet[]}
   */
  function getAll() {
    return _imageSets.map(_cloneSet);
  }

  /**
   * Lấy image set theo id.
   * @param {string} id
   * @returns {SkyboxImageSet|null}
   */
  function getById(id) {
    const set = _imageSets.find(s => s.id === id);
    return set ? _cloneSet(set) : null;
  }

  /**
   * Lấy image set mặc định (đầu tiên trong danh sách,
   * hoặc set đã lưu trong LocalStorage).
   * @returns {SkyboxImageSet}
   */
  function getDefault() {
    try {
      const savedId = localStorage.getItem(Config.STORAGE.SKYBOX_IMAGE_SET);
      if (savedId) {
        const saved = getById(savedId);
        if (saved) return saved;
      }
    } catch {
      // LocalStorage không khả dụng — fallback
    }
    return _cloneSet(_imageSets[0]);
  }

  /**
   * Lưu lựa chọn image set của user vào LocalStorage.
   * @param {string} id
   * @returns {boolean} Thành công hay không
   */
  function savePreference(id) {
    if (!getById(id)) {
      console.warn(`[SkyboxRepository] ID "${id}" không tồn tại.`);
      return false;
    }
    try {
      localStorage.setItem(Config.STORAGE.SKYBOX_IMAGE_SET, id);
      return true;
    } catch {
      console.warn('[SkyboxRepository] Không thể lưu vào LocalStorage.');
      return false;
    }
  }

  /**
   * Lấy faces của một set theo thứ tự chuẩn: front, back, left, right, top, bottom.
   * @param {string} id
   * @returns {SkyboxFace[]|null}
   */
  function getFaces(id) {
    const set = getById(id);
    if (!set) return null;

    const order = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    return order.map(faceName => set.faces.find(f => f.face === faceName)).filter(Boolean);
  }

  /**
   * Validate image set có đủ 6 faces không.
   * @param {SkyboxImageSet} set
   * @returns {{ valid: boolean, missing: string[] }}
   */
  function validate(set) {
    const required = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    const present  = set.faces.map(f => f.face);
    const missing  = required.filter(r => !present.includes(r));
    return { valid: missing.length === 0, missing };
  }

  // ── Private ──────────────────────────────────────────────────────

  function _cloneSet(set) {
    return {
      ...set,
      faces: set.faces.map(f => ({ ...f })),
    };
  }

  // ── Expose ───────────────────────────────────────────────────────
  return Object.freeze({ getAll, getById, getDefault, savePreference, getFaces, validate });

})();

export default SkyboxRepository;
