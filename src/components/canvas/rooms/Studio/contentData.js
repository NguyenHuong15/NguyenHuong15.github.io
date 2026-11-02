/**
 * Studio Content Data
 * 
 * This file contains all content items for the Studio monitor tower.
 * Each item is displayed on a monitor in the tower.
 * 
 * Configured with 3 social networks (Instagram, Facebook, GitHub) 
 * and tech solutions (Java OOP, Chat Zalo, Optimize Infrastructure Costs).
 */

export const PLATFORM_CONFIG = {
    instagram: {
        color: '#E1306C',
        accentColor: '#C13584',
        icon: '📷',
        label: 'Instagram',
        shape: 'phone',
    },
    facebook: {
        color: '#1877F2',
        accentColor: '#0E5AB2',
        icon: '📘',
        label: 'Facebook',
        shape: 'phone',
    },
    github: {
        color: '#24292E',
        accentColor: '#1B1F23',
        icon: '🐙',
        label: 'GitHub',
        shape: 'monitor',
    },
    solution: {
        color: '#00B4D8',
        accentColor: '#0077B6',
        icon: '⚡',
        label: 'Giải Pháp',
        shape: 'monitor',
    },
    youtube: {
        color: '#FF0000',
        accentColor: '#CC0000',
        icon: '▶',
        label: 'YouTube',
        shape: 'tv',
    },
    blog: {
        color: '#4A90D9',
        accentColor: '#2D6CB5',
        icon: '📝',
        label: 'Blog',
        shape: 'monitor',
    },
    tiktok: {
        color: '#00F2EA',
        accentColor: '#FF0050',
        icon: '🎵',
        label: 'TikTok',
        shape: 'phone',
    },
};

// Content data for Nguyen Thi My Huong
const RAW_CONTENT_DATA = [
    // ============ Mạng Xã Hội Cá Nhân (Social Networks) ============
    {
        id: 'soc-001',
        platform: 'instagram',
        title: 'Instagram @mih.oug - Mỹ Hương',
        description: 'Trang Instagram cá nhân của Nguyễn Thị Mỹ Hương (@mih.oug). Nơi chia sẻ những khoảnh khắc đời thường, cuộc sống sinh viên UTH và đam mê thiết kế sáng tạo.',
        thumbnail: null,
        url: 'https://www.instagram.com/mih.oug',
        date: '2026-02-28',
        views: '12.5K',
        likes: '1.8K',
    },
    {
        id: 'soc-002',
        platform: 'facebook',
        title: 'Facebook Nguyễn Hương - Kết Nối Bạn Bè',
        description: 'Trang Facebook cá nhân của Nguyễn Thị Mỹ Hương. Nơi giao lưu kết nối cùng bạn bè, đồng nghiệp ngành Công nghệ Thông tin tại trường UTH.',
        thumbnail: null,
        url: 'https://www.facebook.com/nguyen.huong.252156',
        date: '2026-02-20',
        views: '9.8K',
        likes: '1.2K',
    },
    {
        id: 'soc-003',
        platform: 'github',
        title: 'GitHub @NguyenHuong15 - Profile Cá Nhân',
        description: 'Kho lưu trữ mã nguồn mở, đồ án đại học và dự án công nghệ của Nguyễn Thị Mỹ Hương (@NguyenHuong15). Tham quan các repository và đóng góp mã nguồn.',
        thumbnail: null,
        url: 'https://github.com/NguyenHuong15',
        date: '2026-02-18',
        views: '8.4K',
        duration: 'Repository',
    },

    // ============ PHẦN GIẢI PHÁP (Technical Solutions) ============
    {
        id: 'sol-001',
        platform: 'solution',
        title: 'Giải Pháp: Kiến Trúc Java Core & Lập Trình Hướng Đối Tượng OOP',
        description: 'Giải pháp xây dựng hệ thống phần mềm nền tảng với Java Core và 4 tính chất OOP (Đóng gói, Kế thừa, Đa hình, Trừu tượng). Tối ưu hóa cấu trúc dữ liệu và áp dụng Design Patterns.',
        thumbnail: null,
        url: 'https://github.com/minhthu31/java',
        date: '2026-02-10',
        readTime: '8 min',
    },
    {
        id: 'sol-002',
        platform: 'solution',
        title: 'Giải Pháp: Ứng Dụng Nhắn Tin Chat Zalo Realtime (WebSocket)',
        description: 'Giải pháp kiến trúc trao đổi thông tin thời gian thực hai chiều (Full-duplex) với giao thức WebSocket. Đồng bộ trạng thái trực tuyến và bảo mật luồng tin nhắn trò chuyện tức thời.',
        thumbnail: null,
        url: 'https://github.com/minhthu31/chat_zalo',
        date: '2026-01-28',
        readTime: '10 min',
    },
    {
        id: 'sol-003',
        platform: 'solution',
        title: 'Giải Pháp: Tối Ưu Hóa Chi Phí Hạ Tầng Cloud (Optimize Infrastructure Costs)',
        description: 'Giải pháp nghiên cứu, phân tích bottleneck tài nguyên máy chủ và tối ưu hóa chi phí điện toán đám mây. Triển khai container hóa Docker, tự động hóa quy trình CI/CD và giám sát hiệu năng.',
        thumbnail: null,
        url: 'https://github.com/vphat2755-James/Optimize_Infrastructure_Costs',
        date: '2026-01-15',
        readTime: '12 min',
    },
    {
        id: 'sol-004',
        platform: 'solution',
        title: 'Giải Pháp: Tối Ưu Thuật Toán & Xử Lý Ngoại Lệ Trong Java Project',
        description: 'Phân tích độ phức tạp thời gian/không gian thuật toán, xử lý ngoại lệ tập trung (Global Exception Handling) và thiết kế module dịch vụ độc lập.',
        thumbnail: null,
        url: 'https://github.com/minhthu31/java',
        date: '2025-12-20',
        readTime: '7 min',
    },
    {
        id: 'sol-005',
        platform: 'solution',
        title: 'Giải Pháp: Xử Lý Tải Cao & Đồng Bộ Tin Nhắn Trong Realtime Chat',
        description: 'Giải pháp lưu trữ cache tin nhắn, xử lý kết nối gián đoạn và đảm bảo thứ tự gói tin trong ứng dụng chat thời gian thực mô phỏng Zalo.',
        thumbnail: null,
        url: 'https://github.com/minhthu31/chat_zalo',
        date: '2025-12-05',
        readTime: '9 min',
    },
    {
        id: 'sol-006',
        platform: 'solution',
        title: 'Giải Pháp: Tự Động Hóa Giám Sát Tài Nguyên & Cắt Giảm Chi Phí Máy Chủ',
        description: 'Quy trình audit chi phí máy chủ định kỳ, scale tự động theo nhu cầu thực tế và áp dụng các chính sách lưu trữ tiết kiệm trên Cloud.',
        thumbnail: null,
        url: 'https://github.com/vphat2755-James/Optimize_Infrastructure_Costs',
        date: '2025-11-22',
        readTime: '11 min',
    },

    // ============ Tech Demos & Project Walkthroughs (YouTube TV) ============
    {
        id: 'yt-001',
        platform: 'youtube',
        title: 'Hệ Thống Quản Lý Jira & GitHub Webhook Automation (Spring Boot)',
        description: 'Demo chi tiết luồng tự động hóa CI/CD giữa GitHub Webhook và Jira REST API. Cập nhật trạng thái task tự động khi lập trình viên commit hoặc mở Pull Request.',
        thumbnail: null,
        url: 'https://github.com/minhthu31/java',
        date: '2026-02-15',
        views: '1.5K',
        duration: '14:20',
    },
    {
        id: 'yt-002',
        platform: 'youtube',
        title: 'ReMarket: Kiến Trúc E-Commerce & Cơ Chế Locking Cho Hàng Độc Bản',
        description: 'Giải pháp kỹ thuật cốt lõi giải quyết bài toán đặt trùng đơn hàng cho sản phẩm độc bản (Unique Item) bằng cơ chế khóa đơn hàng tạm thời (Concurrency Control).',
        thumbnail: null,
        url: 'https://github.com/minhthu31/chat_zalo',
        date: '2026-01-20',
        views: '1.2K',
        duration: '18:45',
    },
    {
        id: 'yt-003',
        platform: 'youtube',
        title: 'Xây Dựng Ứng Dụng SPA Đăng Ký Hội Viên Gym Với Pure JavaScript ES6+',
        description: 'Cách xây dựng Single Page Application hoàn toàn bằng JavaScript thuần không phụ thuộc thư viện, tối ưu DOM manipulation và lưu trữ LocalStorage API.',
        thumbnail: null,
        url: 'https://github.com/vphat2755-James/Optimize_Infrastructure_Costs',
        date: '2025-12-10',
        views: '2.1K',
        duration: '12:30',
    },
    {
        id: 'yt-004',
        platform: 'youtube',
        title: 'Hành Trình Sinh Viên CNTT Trường UTH Hướng Tới Fresher Web Developer',
        description: 'Chia sẻ kinh nghiệm cân bằng giữa việc học trên giảng đường UTH và tự học các công nghệ web hiện đại (React, Spring Boot, Git).',
        thumbnail: null,
        url: 'https://github.com/NguyenHuong15',
        date: '2025-09-12',
        views: '3.1K',
        duration: '11:50',
    },

    // ============ Instagram & TikTok Stories ============
    {
        id: 'soc-004',
        platform: 'instagram',
        title: 'Story: Ngày Hội Công Nghệ UTH 2026',
        description: 'Hình ảnh và câu chuyện học tập tại trường Đại học Giao thông vận tải TP.HCM (UTH).',
        thumbnail: null,
        url: 'https://www.instagram.com/mih.oug',
        date: '2026-01-08',
        views: '4.2K',
        likes: '620',
    },
    {
        id: 'soc-005',
        platform: 'facebook',
        title: 'Bài Viết: Tự Hào Là Sinh Viên UTH',
        description: 'Chia sẻ về môi trường học tập, thầy cô và bạn bè tại khoa Công nghệ Thông tin trường UTH.',
        thumbnail: null,
        url: 'https://www.facebook.com/nguyen.huong.252156',
        date: '2025-11-20',
        views: '5.1K',
        likes: '830',
    },
    {
        id: 'soc-006',
        platform: 'github',
        title: 'Dự Án Java & Web Mới Nhất Tại UTH',
        description: 'Cập nhật các bài tập lớn môn Lập trình Web và Java hướng đối tượng.',
        thumbnail: null,
        url: 'https://github.com/NguyenHuong15',
        date: '2025-10-15',
        views: '3.4K',
        likes: '410',
    },
];

// Clean generic textures matching the hand-drawn sketch style
const ytTextures = ['/textures/studio/tv_front.webp'];
const ytPaintedTextures = ['/textures/studio/tv_front_painted.webp'];
const blogTextures = ['/textures/studio/monitor_front.webp'];
const blogPaintedTextures = ['/textures/studio/monitor_front_painted.webp'];
const ttTextures = ['/textures/studio/phone_front.webp'];
const ttPaintedTextures = ['/textures/studio/phone_front_painted.webp'];

let ytIdx = 0, blogIdx = 0, ttIdx = 0;
let ytPIdx = 0, blogPIdx = 0, ttPIdx = 0;

export const CONTENT_DATA = RAW_CONTENT_DATA.map((item) => {
    const isPhone = item.platform === 'tiktok' || item.platform === 'instagram' || item.platform === 'facebook';
    const isTv = item.platform === 'youtube';

    return {
        ...item,
        frontTexture: item.frontTexture || (
            isTv ? ytTextures[ytIdx++ % ytTextures.length] :
                isPhone ? ttTextures[ttIdx++ % ttTextures.length] :
                    blogTextures[blogIdx++ % blogTextures.length]
        ),
        paintedFrontTexture: item.paintedFrontTexture || (
            isTv ? ytPaintedTextures[ytPIdx++ % ytPaintedTextures.length] :
                isPhone ? ttPaintedTextures[ttPIdx++ % ttPaintedTextures.length] :
                    blogPaintedTextures[blogPIdx++ % blogPaintedTextures.length]
        )
    };
});

// Helper to get content by platform
export const getContentByPlatform = (platform) => {
    if (platform === 'all') return CONTENT_DATA;
    return CONTENT_DATA.filter(item => item.platform === platform);
};

// Get latest content (for "On Air" indicator)
export const getLatestContent = () => {
    return [...CONTENT_DATA].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
};
