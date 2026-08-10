import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type NotificationType = Database['public']['Enums']['notification_type'];

export const sendNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  content?: string,
  link?: string
) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: type,
      title: title,
      content: content,
      link: link,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
  return data;
};
