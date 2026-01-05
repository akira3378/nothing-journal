import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SiteConfig } from '../types';
import { getSiteConfig } from '../services/mockBackend';

export type Language = 'zh' | 'ja' | 'en';
type Theme = 'light' | 'dark';

const baseTranslations = {
  zh: {
    app_name: 'NOTHING',
    login: '登录',
    join_us: '记录旅程',
    feed: '动态',
    profile: '个人中心',
    admin: '管理后台',
    logout: '登出',
    // Landing Page (Unified English as per design request)
    landing_hero_1: '旅途记录',
    landing_hero_2: '记录走过的路，也记录路上发生的事。',
    landing_btn: '浏览旅行记录',
    transmissions: '旅行记录',
    footer_rights: '个人旅行档案。',

    // Login
    access_title: '登录以记录',
    enter_void: '登录后即可发布和管理旅行记录。',
    email_label: '电子邮件地址',
    processing: '处理中...',
    send_magic_link: '发送登录链接',
    link_sent: '链接已发送',
    link_sent_desc: '登录链接已发送至',
    check_email_desc: '点击邮件中的链接即可立即访问账户。',
    use_diff_email: '使用其他邮箱',

    // Register
    apply_membership: '开始记录',
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
    select_country: '选择国家',
    select_city: '选择城市',
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
    membership_expired: '记录权限已过期',
    renew_desc: '请上传新的凭证以申请续期。',
    submit_renewal: '提交续期申请',
    renewal_submitted: '续期申请已提交，请等待审核。',
    renewal_fail: '提交失败，请重试。',

    // Feed
    new_posts_available: '新动态',
    whats_on_mind: '分享一段旅程...',
    share_placeholder: '写下今天的旅途记录...',
    image: '图片',
    location: '位置',
    posting: '发布中...',
    publish: '发布',
    quiet_here: '这里很安静，做第一个发言的人。',
    unknown_member: '作者',
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
    member_since: '开始记录',
    credentials: '会员凭证',
    no_cred: '暂无凭证文件',
    pending_banner: '账户审核中',
    pending_banner_desc: '您的账户正在等待管理员审核。部分功能受限。',

    // Admin & Global Config
    administration: '系统管理',
    members: '账户管理',
    site_config: '站点配置',
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
    logo_upload: '站点 LOGO 设置',
    logo_desc: '上传透明背景 PNG (建议 128x128)。这也将更新浏览器图标。',
    remove_logo: '恢复默认 LOGO',

    // Status / Roles
    PENDING: '审核中',
    ACTIVE: '活跃',
    REJECTED: '已拒绝',
    DELETED: '已停用',
    EXPIRED: '已过期',
    USER: '用户',
    ADMIN: '管理员',
    deactivate: '停用',
    activate: '启用',
    filter_role: '筛选角色',
    // Admin Dashboard
    control_center: '控制中心',
    new_applications: '新申请',
    renewal_requests: '续期申请',
    member_database: '作者账户',
    general_settings_desc: '通用系统设置',
    records: '条记录',
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
    config_saved: '站点配置已保存',
    config_save_fail: '保存配置失败',
    logo_upload_fail: 'Logo 上传失败',
    confirm_action: '确定要执行此操作吗：',
    filter_email: '搜索邮箱...',
    filter_country: '筛选国家',
    filter_city: '筛选城市',
    filter_exp_start: '到期开始',
    filter_exp_end: '到期结束',
    last_login: '上次登录',
    clear_filters: '清除筛选',

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
    auth_member: '已登录作者',
    my_transmissions: '我的动态',
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
    read_more: '阅读更多',

    // Placeholders
    comment_placeholder: '写下你的评论...',
    supabase_url_placeholder: 'https://xyz.supabase.co',
    supabase_key_placeholder: 'eyJh...',
    email_placeholder: '你的邮箱@example.com',
    verification_code_placeholder: '000000',
    nickname_placeholder: 'CyberPunk2077',
    youtube_url_placeholder: 'https://youtu.be/...',
    announcement_title_placeholder: '输入标题...',
    announcement_content_placeholder: '在此输入内容...',
    max_tags_reached: '已达到标签上限',
    member_email_placeholder: 'member@nothing.tech',

    // Travel journal
    journal: '旅行记录',
    journal_subtitle: '记录走过的路，也记录路上发生的事。',
    explore_journal: '浏览旅行记录',
    write_note: '记录一段旅程',
    login_to_write: '登录后记录',
    latest_journeys: '最近的旅程',
    travel_notes: '旅行笔记',
    no_travel_notes: '还没有公开的旅行记录。',
    travel_note: '旅行记录',
    travel_note_placeholder: '写下今天看见的风景、走过的路，或旅途中留下的一点想法……',
    publish_note: '发布记录',
    login_to_interact: '登录后才能点赞或留言。',
    login_to_comment: '登录后留下你的回应',
    read_note: '阅读记录',
    back_to_journal: '返回旅行记录',
    journal_entry: '旅途记录',
    trip_updates: '旅途更新',
    manage_journal: '管理记录',
    write: '写作',
    about: '关于',
    language_name: '语言',
    chinese: '中文',
    japanese: '日本語',
    english: 'English',
    published: '已发布',
    draft: '草稿',
    username: '用户名',
    password: '密码',
    password_placeholder: '输入密码',
    password_login: '登录',
    use_otp: '使用邮箱验证码登录',
    use_password: '使用用户名和密码登录',
    invalid_credentials: '用户名或密码错误。',
    profile_not_found: '找不到作者资料。',
    account_unavailable: '账户当前不可用。',
  },
  en: {
    app_name: 'NOTHING',
    login: 'Login',
    join_us: 'Record a journey',
    feed: 'Feed',
    profile: 'Profile',
    admin: 'Admin',
    logout: 'Logout',
    // Landing Page
    landing_hero_1: 'Travel notes',
    landing_hero_2: 'A personal archive of roads, places, and moments along the way.',
    landing_btn: 'Explore the journal',
    transmissions: 'Travel notes',
    footer_rights: 'A personal travel archive.',

    // Login
    access_title: 'WRITE / MANAGE',
    enter_void: 'Log in to publish and manage travel notes.',
    email_label: 'Email Address',
    processing: 'PROCESSING...',
    send_magic_link: 'SEND MAGIC LINK',
    link_sent: 'Link Sent',
    link_sent_desc: 'A magic link has been sent to',
    check_email_desc: 'Click the link in the email to access your account immediately.',
    use_diff_email: 'Use different email',

    // Register
    apply_membership: 'START WRITING',
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
    select_country: 'Select Country',
    select_city: 'Select City',
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
    membership_expired: 'Writing access expired',
    renew_desc: 'Please upload a new credential to renew your membership.',
    submit_renewal: 'Submit Renewal',
    renewal_submitted: 'Renewal request submitted. Please wait for approval.',
    renewal_fail: 'Submission failed. Please try again.',

    // Feed
    new_posts_available: 'New Posts Available',
    whats_on_mind: 'Share a moment from the road...',
    share_placeholder: 'Write a travel note...',
    image: 'Image',
    location: 'Location',
    posting: 'POSTING...',
    publish: 'PUBLISH',
    quiet_here: 'It\'s quiet here. Be the first to speak.',
    unknown_member: 'Author',
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
    member_since: 'Writing Since',
    credentials: 'Membership Credentials',
    no_cred: 'No visual credential on file.',
    pending_banner: 'Under Review',
    pending_banner_desc: 'Your account is pending administrator approval. Features are limited.',

    // Admin & Global Config
    administration: 'ADMINISTRATION',
    members: 'Accounts',
    site_config: 'Site Config',
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
    logo_upload: 'Site Logo Settings',
    logo_desc: 'Upload a transparent PNG (rec. 128x128). This will also update the browser favicon.',
    remove_logo: 'Restore Default Logo',

    // Status / Roles
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    REJECTED: 'REJECTED',
    DELETED: 'DEACTIVATED',
    EXPIRED: 'EXPIRED',
    USER: 'USER',
    ADMIN: 'ADMIN',
    deactivate: 'Deactivate',
    activate: 'Activate',
    filter_role: 'Filter Role',
    // Admin Dashboard
    control_center: 'Control Center',
    new_applications: 'New Applications',
    renewal_requests: 'Renewal Requests',
    member_database: 'Author Accounts',
    general_settings_desc: 'General system-wide settings',
    records: 'records',
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
    config_saved: 'Site configuration saved',
    config_save_fail: 'Failed to save config',
    logo_upload_fail: 'Logo upload failed',
    confirm_action: 'Are you sure you want to',
    filter_email: 'Search email...',
    filter_country: 'Filter Country',
    filter_city: 'Filter City',
    filter_exp_start: 'Exp Start',
    filter_exp_end: 'Exp End',
    last_login: 'Last Login',
    clear_filters: 'Clear Filters',

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
    auth_member: 'SIGNED-IN AUTHOR',
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
    read_more: 'Read More',

    // Placeholders
    comment_placeholder: 'Write a comment...',
    supabase_url_placeholder: 'https://xyz.supabase.co',
    supabase_key_placeholder: 'eyJh...',
    email_placeholder: 'you@example.com',
    verification_code_placeholder: '000000',
    nickname_placeholder: 'CyberPunk2077',
    youtube_url_placeholder: 'https://youtu.be/...',
    announcement_title_placeholder: 'Enter headline...',
    announcement_content_placeholder: 'Write your message here...',
    max_tags_reached: 'Max tags reached',
    member_email_placeholder: 'member@nothing.tech',

    // Travel journal
    journal: 'Journal',
    journal_subtitle: 'Notes from the roads, places, and moments along the way.',
    explore_journal: 'EXPLORE JOURNAL',
    write_note: 'WRITE A NOTE',
    login_to_write: 'LOG IN TO WRITE',
    latest_journeys: 'Latest journeys',
    travel_notes: 'Travel notes',
    no_travel_notes: 'No public travel notes yet.',
    travel_note: 'Travel note',
    travel_note_placeholder: 'Write about what you saw, where you went, or what stayed with you…',
    publish_note: 'PUBLISH NOTE',
    login_to_interact: 'Log in to like or leave a response.',
    login_to_comment: 'Log in to leave a response',
    read_note: 'READ NOTE',
    back_to_journal: 'BACK TO JOURNAL',
    journal_entry: 'JOURNAL ENTRY',
    trip_updates: 'Journey updates',
    manage_journal: 'MANAGE JOURNAL',
    write: 'WRITE',
    about: 'ABOUT',
    language_name: 'Language',
    chinese: '中文',
    japanese: '日本語',
    english: 'English',
    published: 'Published',
    draft: 'Draft',
    username: 'Username',
    password: 'Password',
    password_placeholder: 'Enter password',
    password_login: 'LOG IN',
    use_otp: 'Use email code instead',
    use_password: 'Use username and password instead',
    invalid_credentials: 'Invalid username or password.',
    profile_not_found: 'Author profile not found.',
    account_unavailable: 'This account is not available.',
  }
};

const translations = {
  ...baseTranslations,
  ja: {
    ...baseTranslations.en,
    app_name: 'NOTHING',
    login: 'ログイン',
    feed: '旅行記録',
    profile: 'プロフィール',
    admin: '管理',
    logout: 'ログアウト',
    landing_hero_1: '旅の記録',
    landing_hero_2: '歩いた道、見た景色、旅の途中で残ったもの。',
    landing_btn: '旅行記録を見る',
    footer_rights: '旅の記録。',
    join_us: '旅を記録する',
    membership_expired: '記録へのアクセス期限が切れています',
    unknown_member: '作者',
    member_since: '記録開始',
    members: 'アカウント管理',
    member_database: '作者アカウント',
    auth_member: 'ログイン中の作者',
    access_title: '記録を管理する',
    enter_void: 'ログインすると旅行記録を公開・管理できます。',
    journal: '旅行記録',
    journal_subtitle: '歩いた道と、そこで出会った時間を記録しています。',
    explore_journal: '旅行記録を見る',
    write_note: '旅を記録する',
    login_to_write: 'ログインして記録する',
    latest_journeys: '最近の旅',
    travel_notes: '旅行ノート',
    no_travel_notes: '公開された旅行記録はまだありません。',
    travel_note: '旅行記録',
    travel_note_placeholder: '見た景色、歩いた道、旅の途中で感じたことを書いてください…',
    publish_note: '記録を公開する',
    login_to_interact: 'いいねやコメントにはログインが必要です。',
    login_to_comment: 'ログインしてコメントする',
    read_note: '記録を読む',
    back_to_journal: '旅行記録に戻る',
    journal_entry: '旅の記録',
    trip_updates: '旅の更新',
    manage_journal: '記録を管理',
    write: '記録する',
    about: 'このサイトについて',
    language_name: '言語',
    chinese: '中文',
    japanese: '日本語',
    english: 'English',
    published: '公開中',
    draft: '下書き',
    username: 'ユーザー名',
    password: 'パスワード',
    password_placeholder: 'パスワードを入力',
    password_login: 'ログイン',
    use_otp: 'メールコードを使う',
    use_password: 'ユーザー名とパスワードを使う',
    invalid_credentials: 'ユーザー名またはパスワードが正しくありません。',
    profile_not_found: '作者プロフィールが見つかりません。',
    account_unavailable: 'このアカウントは現在利用できません。',
  }
} as const;

export const LANGUAGE_OPTIONS: Array<{ code: Language; label: string; shortLabel: string }> = [
  { code: 'zh', label: '中文', shortLabel: '中' },
  { code: 'ja', label: '日本語', shortLabel: '日' },
  { code: 'en', label: 'English', shortLabel: 'EN' },
];

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
  language: 'ja',
  setLanguage: () => { },
  theme: 'light',
  toggleTheme: () => { },
  t: (key) => key,
  siteConfig: { logoUrl: '' },
  refreshConfig: () => { }
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ja');
  const [theme, setTheme] = useState<Theme>('light');
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ logoUrl: '' });

  // Initial config fetch
  const refreshConfig = async () => {
    const config = await getSiteConfig();
    setSiteConfig(config);
  };

  useEffect(() => {
    refreshConfig();

    // Initialize from local storage or system preference
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang && LANGUAGE_OPTIONS.some(option => option.code === savedLang)) setLanguage(savedLang);

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
