import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';

export interface CreateUserInput {
  username: string;
  display_name: string;
  role_id: string;
}

export interface CreateUserResult {
  userId: string;
  username: string;
  display_name: string;
  tempPassword: string;
}

/**
 * 呼叫 Edge Function `create-user`，在 Supabase Auth 建立新帳號並回傳一次性密碼。
 * Supabase SDK 會自動把目前登入者的 JWT 放進 Authorization header，
 * Edge Function 用此 JWT 驗證 caller 是否有 action:users:manage 權限。
 */
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUserInput): Promise<CreateUserResult> => {
      const { data, error } = await supabase.functions.invoke<CreateUserResult>('create-user', {
        body: input,
      });
      if (error) throw new Error(error.message);
      if (!data) throw new Error('No data returned from create-user function');
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'usersWithRoles'] });
    },
  });
}

/**
 * 呼叫 Edge Function `reset-user-password`，
 * 產生新的臨時密碼並強制使用者下次登入時更改。
 * 只能由具有 action:users:manage 權限的 admin 呼叫。
 */
export function useResetUserPassword() {
  return useMutation({
    mutationFn: async (userId: string): Promise<{ tempPassword: string }> => {
      const { data, error } = await supabase.functions.invoke<{ tempPassword: string }>(
        'reset-user-password',
        { body: { userId } },
      );
      if (error) throw new Error(error.message);
      if (!data) throw new Error('No data returned from reset-user-password function');
      return data;
    },
  });
}
