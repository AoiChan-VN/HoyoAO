```
HoyoAO/
├─ index.html                      # [SHELL/BIOS] HTML duy nhất, bất biến
│
├─ boot/
│  └─ boot.js                      # [BOOTLOADER] nạp kernel → nạp apps → dựng chrome
│
├─ kernel/                         # [CORE] BẤT BIẾN — không sửa khi thêm app
│  ├─ kernel.js                    # Registry + lifecycle + cấp Context/Permissions
│  ├─ bus.js                       # Event bus (IPC) — namespaced + wildcard
│  ├─ router.js                    # Hash router — route do app đăng ký
│  ├─ vfs.js                       # Virtual File System + adapter (localStorage/IDB/native)
│  ├─ process.js                   # Process Manager (spawn/kill/list)
│  ├─ window.js                    # Window Manager (desktop) / degrade → router (mobile)
│  ├─ bridge.js                    # Native Bridge — detect web/pwa/electron/tauri
│  └─ telemetry.js                 # Đo số liệu THẬT (ops, fps, heap, ping, bytes)
│
├─ system/                         # [SYSTEM SERVICES] ổn định, thay thế được
│  ├─ ui/
│  │  ├─ index.js                  # export { el, icon, fmt, modal, toast, confirm }
│  │  ├─ dom.js                    # el() builder
│  │  ├─ modal.js                  # modal/confirm
│  │  ├─ toast.js                  # toast
│  │  └─ format.js                 # fmt (num/bytes/time/date/uptime)
│  ├─ theme.js                     # accent, dark/light, CSS vars
│  ├─ i18n.js                      # vi/en dictionary
│  └─ notify.js                    # notification center + system tray feed
│
├─ apps/                           # [APPLICATIONS] mỗi app = 1 bundle tự chứa
│  ├─ dashboard/
│  │  ├─ manifest.json             # "Info.plist" của app: id, routes, permissions, entry
│  │  ├─ index.js                  # export default { mount(ctx), unmount(ctx) }
│  │  └─ style.css                 # CSS riêng của app (kernel inject khi mount)
│  ├─ analytics/  (manifest.json, index.js, style.css)
│  ├─ content/    (…)
│  ├─ media/      (…)
│  ├─ files/      (…)
│  ├─ server/     (…)
│  ├─ clients/    (…)
│  ├─ game/       (…)
│  ├─ terminal/   (…)   ← app THẬT, exemplar bên dưới
│  ├─ tasks/      (…)   ← Process Monitor
│  ├─ settings/   (…)
│  └─ palette/    (…)   ← Cmd+K
│
├─ data/                           # [PURE DATA] không chứa logic
│  ├─ zones.js                     # khai báo vùng dữ liệu
│  └─ seeds/
│     ├─ content.seed.js
│     ├─ media.seed.js
│     └─ files.seed.js
│
├─ config/                         # [CONFIGURATION]
│  ├─ apps.config.js               # danh sách app + enabled
│  └─ branding.config.js           # logo/icon/avatar/accent (1 nơi)
│
├─ platform/                       # [PACKAGING] mỗi nền tảng 1 thư mục
│  ├─ web/
│  │  ├─ manifest.webmanifest      # PWA
│  │  └─ sw.js                     # service worker (offline)
│  ├─ electron/
│  │  ├─ main.js                   # main process
│  │  └─ preload.js                # expose electronAPI (contextBridge)
│  └─ tauri/
│     └─ tauri.conf.json
│
└─ docs/
   └─ ARCHITECTURE.md              # hợp đồng tầng (bên dưới)
```
