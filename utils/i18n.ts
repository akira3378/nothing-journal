import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SiteConfig } from '../types';
import { getSiteConfig } from '../services/mockBackend';

type Language = 'zh' | 'en';
type Theme = 'light' | 'dark';

const translations = {
  zh: {
    app_name: 'NOTHING',
    login: '登录',
    join_us: '加入我们',
    feed: '动态',
    profile: '个人中心',
    admin: '管理后台',
    logout: '登出',
    // Landing Page (Unified English as per design request)
    landing_hero_1: 'NOTHING',
    landing_hero_2: 'Live the way you like.',
    landing_btn: '申请入驻',
    transmissions: '信号传输',
    footer_rights: 'NOTHING CORP. 版权所有.',

    // Login
    access_title: '访问权限',
    enter_void: '进入虚空',
    email_label: '电子邮件地址',
    processing: '处理中...',
    send_magic_link: '发送登录链接',
    link_sent: '链接已发送',
    link_sent_desc: '登录链接已发送至',
    check_email_desc: '点击邮件中的链接即可立即访问账户。',
    use_diff_email: '使用其他邮箱',

    // Register
    apply_membership: '申请会员',
    complete_reg: '完成注册',
    join_2000: '加入前沿社区',
    security_notice: '安全提示：',
    security_desc: '我们使用魔术链接进行无密码访问。任何拥有该链接的人都可以访问您的帐户。请勿与他人分享。',
    send_verify: '发送验证链接',
    check_email_header: '检查您的邮件',
    check_email_reg_desc: '我们已向您发送确认链接。点击邮件中的链接返回此处完成资料设置。',
    nickname: '昵称',
    profession_tags: '职业 / 身份标签 (最多3个)',
    add_tag_placeholder: '输入并回车',
    add: '添加',
    credential_upload: '凭证上传',
    avatar_upload: '头像上传',
    upload_text: '上传图片',
    upload_hint: 'PNG, JPG 最大 10MB',
    cancel: '取消',
    finalizing: '提交中...',
    complete_btn: '完成注册',
    pending_title: '申请已提交',
    pending_desc: '您的入会申请已收到。管理员审核通过后，您将获得完整的访问权限。',
    pending_status_check: '请留意邮件通知或稍后登录查看状态。',
    return_home: '返回首页',
    reg_success_title: '欢迎加入',
    reg_success_desc: '注册成功！您现在已是正式成员。',
    start_exploring: '开始探索',

    // Feed
    whats_on_mind: '分享你的旅程...',
    share_placeholder: '写点什么...',
    image: '图片',
    location: '位置',
    posting: '发布中...',
    publish: '发布',
    quiet_here: '这里很安静，做第一个发言的人。',
    unknown_member: '未知成员',
    like: '赞',
    comment: '评论',
    delete: '删除',
    delete_confirm: '确定要删除这条内容吗？',
    post_deleted: '内容已删除',
    comments_label: '评论列表',
    write_comment: '写下你的评论...',
    send: '发送',
    no_comments: '暂无评论',
    loading_comments: '加载评论中...',
    load_more: '加载更多',
    end_of_feed: '已到达底部',

    // Profile
    edit_profile: '编辑资料',
    save_changes: '保存更改',
    saving: '保存中...',
    status: '状态',
    identity_tags: '身份标签',
    member_since: '加入时间',
    credentials: '会员凭证',
    no_cred: '暂无凭证文件',
    pending_banner: '账户审核中',
    pending_banner_desc: '您的账户正在等待管理员审核。部分功能受限。',

    // Admin & Global Config
    administration: '系统管理',
    members: '成员管理',
    content_config: '内容与配置',
    announcements: '公告管理',
    site_config: '站点配置',
    new_announcement: '发布新公告',
    edit_announcement: '编辑公告',
    title: '标题',
    content: '内容',
    history: '历史记录',
    approve: '批准',
    reject: '拒绝',
    suspend: '挂起',
    restore: '恢复',
    view: '查看',
    change_role: '更改角色',
    role: '角色',
    edit: '编辑',
    update: '更新',
    cancel_edit: '取消编辑',

    // Admin Modal
    edit_user: '编辑用户',
    expiration_date: '过期日期',
    video_url: '首页视频链接 (YouTube)',
    video_hint: '输入 YouTube 视频地址 (例如 https://www.youtube.com/watch?v=...)',
    logo_upload: '站点 LOGO 设置',
    logo_desc: '上传透明背景 PNG (建议 128x128)。这也将更新浏览器图标。',
    remove_logo: '恢复默认 LOGO',

    // Status / Roles
    PENDING: '审核中',
    ACTIVE: '活跃',
    REJECTED: '已拒绝',
    DELETED: '已删除',
    EXPIRED: '已过期',
    USER: '用户',
    ADMIN: '管理员',
    // Admin Dashboard
    control_center: '控制中心',
    new_applications: '新申请',
    renewal_requests: '续期申请',
    member_database: '成员数据库',
    general_settings_desc: '通用系统设置',
    announcements_comm: '公告与通讯',
    records: '条记录',
    no_announcements: '暂无公告',
    user_col: '用户',
    actions_col: '操作',
    page: '页',
    of: '/',
    previous: '上一页',
    next: '下一页',
    set_expiration_for: '设置过期时间：',
    exp_date_future_error: '过期时间必须在未来',
    user_approved: '用户已批准',
    user_updated: '用户更新成功',
    user_update_fail: '用户更新失败',
    fetch_fail: '获取数据失败',
    status_updated: '用户状态已更新为',
    announcement_updated: '公告已更新',
    announcement_published: '公告已发布',
    config_saved: '站点配置已保存',
    config_save_fail: '保存配置失败',
    logo_upload_fail: 'Logo 上传失败',
    announcement_deleted: '公告已删除',
    delete_announcement_confirm: '删除此公告？',
    confirm_action: '确定要执行此操作吗：',

    // Feed
    post_attachment: '帖子附件',
    attachment: '附件',
    failed_load_comments: '加载评论失败',
    failed_comment: '评论失败',
    comment_deleted: '评论已删除',
    failed_delete_comment: '删除评论失败',
    delete_failed: '删除失败',
    reply: '回复',
    reply_to: '回复给',
    reply_btn: '回复',
    loc_fetch_fail: '无法获取位置',
    geo_not_supported: '不支持地理位置',
    content_published: '内容已发布',
    post_fail: '发布内容失败',
    syncing_data: '同步数据流...',
    preview: '预览',

    // Profile
    profile_update_fail: '更新资料失败',
    account_id: '账户 ID',
    auth_member: '认证成员',
    my_transmissions: '我的传输',
    no_broadcasts: '您还没有发布任何广播。',
    fetch_posts_fail: '获取帖子失败',
    // Landing Page Redesign
    features_title: '为什么选择 Nothing?',
    feature_void_title: '虚空',
    feature_void_desc: '一个属于所有人，也不属于任何人的地方。',
    feature_global_title: '全球连接',
    feature_global_desc: '寻找你的频率。',
    feature_identity_title: '真实身份',
    feature_identity_desc: '做你想做的人。',
    latest_updates: '公告',
    read_more: '阅读更多',
  },
  en: {
    app_name: 'NOTHING',
    login: 'Login',
    join_us: 'Join Us',
    feed: 'Feed',
    profile: 'Profile',
    admin: 'Admin',
    logout: 'Logout',
    // Landing Page
    landing_hero_1: 'NOTHING',
    landing_hero_2: 'Live the way you like.',
    landing_btn: 'Become a Member',
    transmissions: 'Transmissions',
    footer_rights: 'NOTHING CORP. All rights reserved.',

    // Login
    access_title: 'ACCESS',
    enter_void: 'Enter the void.',
    email_label: 'Email Address',
    processing: 'PROCESSING...',
    send_magic_link: 'SEND MAGIC LINK',
    link_sent: 'Link Sent',
    link_sent_desc: 'A magic link has been sent to',
    check_email_desc: 'Click the link in the email to access your account immediately.',
    use_diff_email: 'Use different email',

    // Register
    apply_membership: 'APPLY FOR MEMBERSHIP',
    complete_reg: 'COMPLETE REGISTRATION',
    join_2000: 'Join the community.',
    security_notice: 'Security Notice:',
    security_desc: 'We use Magic Links for passwordless access. Anyone with the link can access your account. Do not share the link.',
    send_verify: 'SEND VERIFICATION LINK',
    check_email_header: 'Check your email',
    check_email_reg_desc: 'We\'ve sent a confirmation link. Click it to return here and complete setup.',
    nickname: 'Nickname',
    profession_tags: 'Profession / Identity (Max 3)',
    add_tag_placeholder: 'Type and Enter',
    add: 'ADD',
    credential_upload: 'Credential Upload',
    avatar_upload: 'Avatar Upload',
    upload_text: 'Upload Image',
    upload_hint: 'PNG, JPG up to 10MB',
    cancel: 'CANCEL',
    finalizing: 'FINALIZING...',
    complete_btn: 'COMPLETE REGISTRATION',
    pending_title: 'Application Submitted',
    pending_desc: 'Your membership application has been received. You will be granted full access once an admin approves your request.',
    pending_status_check: 'Please check back later.',
    return_home: 'Return Home',
    reg_success_title: 'Welcome Aboard',
    reg_success_desc: 'Registration complete! You are now a full member.',
    start_exploring: 'Start Exploring',

    // Feed
    whats_on_mind: 'Share your journey...',
    share_placeholder: 'Write something...',
    image: 'Image',
    location: 'Location',
    posting: 'POSTING...',
    publish: 'PUBLISH',
    quiet_here: 'It\'s quiet here. Be the first to speak.',
    unknown_member: 'Unknown Member',
    like: 'Like',
    comment: 'Comment',
    delete: 'Delete',
    delete_confirm: 'Are you sure you want to delete this post?',
    post_deleted: 'Post deleted',
    comments_label: 'Comments',
    write_comment: 'Write a comment...',
    send: 'Send',
    no_comments: 'No comments yet',
    loading_comments: 'Loading comments...',
    load_more: 'Load More',
    end_of_feed: 'End of feed',

    // Profile
    edit_profile: 'Edit Profile',
    save_changes: 'SAVE CHANGES',
    saving: 'SAVING...',
    status: 'Status',
    identity_tags: 'Identity Tags',
    member_since: 'Member Since',
    credentials: 'Membership Credentials',
    no_cred: 'No visual credential on file.',
    pending_banner: 'Under Review',
    pending_banner_desc: 'Your account is pending administrator approval. Features are limited.',

    // Admin & Global Config
    administration: 'ADMINISTRATION',
    members: 'Members',
    content_config: 'Content & Config',
    announcements: 'Announcements',
    site_config: 'Site Config',
    new_announcement: 'New Announcement',
    edit_announcement: 'Edit Announcement',
    title: 'Title',
    content: 'Content',
    history: 'History',
    approve: 'Approve',
    reject: 'Reject',
    suspend: 'Suspend',
    restore: 'Restore',
    view: 'View',
    change_role: 'Change Role',
    role: 'Role',
    edit: 'Edit',
    update: 'Update',
    cancel_edit: 'Cancel Edit',

    // Admin Modal
    edit_user: 'Edit User',
    expiration_date: 'Expiration Date',
    video_url: 'Homepage Video URL (YouTube)',
    video_hint: 'Enter YouTube URL (e.g. https://www.youtube.com/watch?v=...)',
    logo_upload: 'Site Logo Settings',
    logo_desc: 'Upload a transparent PNG (rec. 128x128). This will also update the browser favicon.',
    remove_logo: 'Restore Default Logo',

    // Status / Roles
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    REJECTED: 'REJECTED',
    DELETED: 'DELETED',
    EXPIRED: 'EXPIRED',
    USER: 'USER',
    ADMIN: 'ADMIN',
    // Admin Dashboard
    control_center: 'Control Center',
    new_applications: 'New Applications',
    renewal_requests: 'Renewal Requests',
    member_database: 'Member Database',
    general_settings_desc: 'General system-wide settings',
    announcements_comm: 'Announcements & Communication',
    records: 'records',
    no_announcements: 'No announcements found.',
    user_col: 'User',
    actions_col: 'Actions',
    page: 'Page',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    set_expiration_for: 'Set expiration for',
    exp_date_future_error: 'Expiration date must be in the future',
    user_approved: 'User approved',
    user_updated: 'User updated successfully',
    user_update_fail: 'Failed to update user',
    fetch_fail: 'Failed to fetch data',
    status_updated: 'User status updated to',
    announcement_updated: 'Announcement updated',
    announcement_published: 'Announcement published',
    config_saved: 'Site configuration saved',
    config_save_fail: 'Failed to save config',
    logo_upload_fail: 'Logo upload failed',
    announcement_deleted: 'Announcement deleted',
    delete_announcement_confirm: 'Delete this announcement?',
    confirm_action: 'Are you sure you want to',

    // Feed
    post_attachment: 'Post attachment',
    attachment: 'Attachment',
    failed_load_comments: 'Failed to load comments',
    failed_comment: 'Failed to comment',
    comment_deleted: 'Comment deleted',
    failed_delete_comment: 'Failed to delete comment',
    delete_failed: 'Delete failed',
    reply: 'Reply',
    reply_to: 'Reply to',
    reply_btn: 'REPLY',
    loc_fetch_fail: 'Could not fetch location',
    geo_not_supported: 'Geolocation not supported',
    content_published: 'Content published',
    post_fail: 'Failed to post content',
    syncing_data: 'SYNCING DATA STREAM...',
    preview: 'Preview',

    // Profile
    profile_update_fail: 'Failed to update profile',
    account_id: 'ACCOUNT ID',
    auth_member: 'AUTHENTICATED MEMBER',
    my_transmissions: 'My Transmissions',
    no_broadcasts: 'You haven\'t broadcasted anything yet.',
    fetch_posts_fail: 'Failed to fetch my posts',
    // Landing Page Redesign
    features_title: 'Why Nothing?',
    feature_void_title: 'The Void',
    feature_void_desc: 'A place for everyone and no one.',
    feature_global_title: 'Global Connection',
    feature_global_desc: 'Find your frequency.',
    feature_identity_title: 'True Identity',
    feature_identity_desc: 'Be who you want to be.',
    latest_updates: 'Announcements',
    read_more: 'Read More',
  }
};

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: string) => string;
  siteConfig: SiteConfig; // Added config to context
  refreshConfig: () => void;
}

export const AppContext = createContext<AppContextType>({
  language: 'en',
  setLanguage: () => { },
  theme: 'light',
  toggleTheme: () => { },
  t: (key) => key,
  siteConfig: { landingVideoUrl: '', logoUrl: '' },
  refreshConfig: () => { }
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ landingVideoUrl: '', logoUrl: '' });

  // Initial config fetch
  const refreshConfig = async () => {
    const config = await getSiteConfig();
    setSiteConfig(config);
  };

  useEffect(() => {
    refreshConfig();

    // Initialize from local storage or system preference
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang) setLanguage(savedLang);

    const savedTheme = localStorage.getItem('app_theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to Light as per user request
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const t = (key: string): string => {
    const dict = translations[language] as Record<string, string>;
    return dict[key] || key;
  };

  return React.createElement(
    AppContext.Provider,
    { value: { language, setLanguage, theme, toggleTheme, t, siteConfig, refreshConfig } },
    children
  );
};

export const useApp = () => useContext(AppContext);