export const formatLocalTime = (timestamp: number | string): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);

  // Uses the browser's default locale and timezone
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // 24h format often preferred in enterprise contexts, change if needed
  }).format(date);
};

export const formatRelativeTime = (timestamp: number | string): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return formatLocalTime(timestamp);
};

export const formatNotificationMessage = (notification: any): string => {
  const user = notification.triggerUser?.nickname || 'Someone';
  const content = notification.content ? `"${notification.content.substring(0, 20)}${notification.content.length > 20 ? '...' : ''}"` : '';

  if (notification.type === 'COMMENT') {
    return `${user} commented on your post: ${content}`;
  }
  if (notification.type === 'LIKE') {
    return `${user} liked your post.`;
  }
  return `${user}: ${notification.content}`;
};