/**
 * Server localization strings (Vietnamese) (§37).
 * Registered with the OS LocalizationService under the "vi" locale.
 * Keys mirror server.en.js with Vietnamese translations.
 */
export default {
  'server.title': 'Máy chủ',
  'server.subtitle': 'Giám sát & kiểm tra đội máy chủ',

  'server.loading': 'Đang tải danh sách máy chủ…',

  'server.empty.title': 'Không có máy chủ nào',
  'server.empty.description':
    'Chưa có nguồn dữ liệu máy chủ nào được kết nối. Trong môi trường phát triển, ' +
    'một đội máy chủ giả lập sẽ được hiển thị. ' +
    'Trong môi trường sản xuất, hãy kết nối nguồn dữ liệu máy chủ qua ServerDataProvider.',

  'server.error.title': 'Không thể tải danh sách máy chủ',
  'server.error.description': 'Nguồn dữ liệu máy chủ trả về lỗi.',

  'server.source.simulated': 'Dữ liệu giả lập (môi trường phát triển)',
  'server.source.real': 'Dữ liệu thực',

  'server.summary.total': 'Tổng số',
  'server.summary.online': 'Trực tuyến',
  'server.summary.degraded': 'Suy giảm',
  'server.summary.offline': 'Ngoại tuyến',

  'server.detail.id': 'Định danh',
  'server.detail.type': 'Loại',
  'server.detail.host': 'Địa chỉ',
  'server.detail.region': 'Khu vực',
  'server.detail.version': 'Phiên bản',
  'server.detail.cpu': 'Tải CPU',
  'server.detail.memory': 'Tải bộ nhớ',
  'server.detail.connections': 'Kết nối',
  'server.detail.uptime': 'Thời gian hoạt động',
  'server.detail.startedAt': 'Khởi động lúc',
}; 
