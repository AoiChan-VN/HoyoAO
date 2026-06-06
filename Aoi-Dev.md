📜 BỘ LUẬT TỐI CAO KIỂM SOÁT AI (MÃ HIỆU: AOI-CORE)

QUY ĐỊNH SẢN XUẤT PRODUCTION VANILLA WEB (HTML/CSS/JS/ES MODULES/GITHUB PAGES)

🛑 ĐIỀU 1: CÁC LỆNH KÍCH HOẠT VÀ QUY TRÌNH PHẢN HỒI (AI RESPONDING PROTOCOL)

1.1. Lệnh "Ok" / "OK": Ý nghĩa: Đồng ý, ra lệnh triển khai (Build) hoặc tiếp tục triển khai (Build tiếp) phần code đang dở dang. AI chỉ được phép xuất file code tiếp theo theo đúng thứ tự quy trình, nghiêm cấm giải thích hay chào hỏi.

1.2. Lệnh "Aoi check": Ý nghĩa: Yêu cầu AI kiểm tra lại ngay lập tức file code vừa xuất. Phải rà soát lỗi cú pháp, lỗi logic điều kiện, lỗi thiếu dấu ngoặc, lỗi sai đường dẫn import tại file đó.

1.3. Lệnh "Aoi check all": Ý nghĩa: Lệnh tổng kiểm tra sâu toàn bộ hệ thống. AI phải rà soát mối quan hệ giữa tất cả các file đã code, kiểm tra logic bất đồng bộ, kiểm tra luồng dữ liệu (Data-flow), và tính chính xác của các đường dẫn import chéo.

1.4. Quy Tắc Xuất File Đơn Lẻ (Single File Output Only): Nghiêm cấm xuất nhiều file code trong cùng một lượt phản hồi. AI bắt buộc phải gửi từng file một để đảm bảo không bị quá giới hạn token và xuất được toàn vẹn 100% code.

1.5. Xử Lý Giới Hạn Token (Gộp File Hoàn Chỉnh): Nghiêm cấm tự ý xé nhỏ một file lớn thành các module con làm sai lệch kiến trúc gốc. Nếu một file quá dài vượt giới hạn token, AI phải cắt đôi file tại một vị trí logic sạch và xuất thành 2 lượt phản hồi liên tiếp (chờ lệnh "Ok" để xuất tiếp phần 2), sau đó hướng dẫn người dùng nối lại thành 1 file duy nhất.

🚫 ĐIỀU 2: CHỐNG CHẾ CHÁO, SUY DIỄN VÀ THAY ĐỔI NAMING

2.1. Đóng Băng Naming (Strict Naming Lockdown): AI tuyệt đối không được tự ý thay đổi tên biến, tên hàm, tên class, ID, hoặc tên file đã được định nghĩa trước đó hoặc do người dùng chỉ định. Bất kỳ sự thay đổi ngầm nào dẫn đến mất liên kết dữ liệu đều bị coi là vi phạm nghiêm trọng.

2.2. Cấm Suy Diễn Vớ Vẩn (Anti-Feature Creep): Chỉ làm đúng, làm đủ những tính năng, logic được yêu cầu. Nghiêm cấm tự ý thêm thắt các tính năng "tiện ích" ngoài lề, không tự chế thêm các hiệu ứng UI, các hàm phụ trợ không có trong thiết kế làm phình to code và gây lỗi xung đột.

2.3. Cấm Code Giả Định (Zero Placeholder): 100% dòng code xuất ra phải thực thi được. Nghiêm cấm các đoạn comment dạng: // ... giữ nguyên code cũ, // Thêm logic tại đây, /* Code tiếp theo... */. Mọi hàm, mọi vòng lặp phải viết đầy đủ từ dấu ngoặc mở đến dấu ngoặc đóng.

🛠️ ĐIỀU 3: TIÊU CHUẨN KỸ THUẬT CỐT LÕI (VANILLA ONLY)

3.1. Tuyệt Đối Không Thư Viện (Zero-Dependency): Cấm tuyệt đối React, Vue, Angular, jQuery, Tailwind CSS, Bootstrap, Axios, FontAwesome (kể cả link CDN). Chỉ dùng HTML5, CSS3 và Vanilla JS gốc.

3.2. Không Công Cụ Đóng Gói (No Build Tools): Code phải chạy trực tiếp ngay khi mở file index.html trên trình duyệt hoặc host lên GitHub Pages. Không Node.js, không npm, không Vite/Webpack/Babel.

3.3. Định Tuyến Tương Thích GitHub Pages (Hash Routing): Nếu có điều hướng trang, bắt buộc dùng window.location.hash (dạng #/home, #/dashboard). Nghiêm cấm dùng HTML5 History API (BrowserRouter) vì sẽ gây lỗi 404 khi F5 trên GitHub Pages.

3.4. ES Modules Minh Bạch: Mọi lệnh import phải ghi rõ ràng, tường minh cấu trúc đường dẫn cục bộ và bắt buộc phải có đuôi file .js (Ví dụ: import { store } from './core/store.js';).

3.5. Dữ Liệu Nội Bộ Tự Cung Tự Cấp: Toàn bộ Assets (hình ảnh, icon) và Database (Mock Data/JSON) phải nằm hoàn toàn trong bộ nhớ cục bộ (./assets/, ./database/), không gọi link API hoặc dữ liệu từ bất kỳ server bên thứ ba nào. 
