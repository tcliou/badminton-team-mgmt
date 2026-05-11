import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';
import { useAuthStore } from '@/core/store/authStore';

const QK = {
  usersWithRoles: ['admin', 'usersWithRoles'] as const,
  permissions: ['admin', 'permissions'] as const,
  roleCounts: ['admin', 'roleCounts'] as const,
};

export type UserWithRoles = {
  id: string;
  username: string;
  display_name: string;
  status: 'active' | 'suspended';
  role_ids: string[];
};

/** 列出所有使用者，每位帶上 role_id 陣列 */
export function useUsersWithRoles() {
  return useQuery({
    queryKey: QK.usersWithRoles,
    queryFn: async (): Promise<UserWithRoles[]> => {
      // 兩段查詢比 join + group_by 簡單可靠
      const [{ data: profiles, error: e1 }, { data: rels, error: e2 }] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id,username,display_name,status')
            .order('display_name', { ascending: true }),
          supabase.from('user_roles').select('user_id,role_id'),
        ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const byUser = new Map<string, string[]>();
      (rels ?? []).forEach((r) => {
        const arr = byUser.get(r.user_id) ?? [];
        arr.push(r.role_id);
        byUser.set(r.user_id, arr);
      });

      return (profiles ?? []).map((p) => ({
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        status: p.status,
        role_ids: byUser.get(p.id) ?? [],
      }));
    },
  });
}

/** 把某使用者的角色集合一次替換成新值（前端勾選後送整批） */
export function useReplaceUserRoles() {
  const grantedBy = useAuthStore((s) => s.profile?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; roleIds: string[] }) => {
      const { error: delErr } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', input.userId);
      if (delErr) throw delErr;

      if (input.roleIds.length === 0) return;
      const rows = input.roleIds.map((role_id) => ({
        user_id: input.userId,
        role_id,
        granted_by: grantedBy ?? null,
      }));
      const { error: insErr } = await supabase.from('user_roles').insert(rows);
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/* -------- Roles & Permissions -------- */

export function useAllPermissions() {
  return useQuery({
    queryKey: QK.permissions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('key,description,category')
        .order('category', { ascending: true })
        .order('key', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });
}

/** 拉某 role 目前有哪些 permission_key */
export function useRolePermissionKeys(roleId: string | null) {
  return useQuery({
    queryKey: ['admin', 'rolePerms', roleId],
    enabled: Boolean(roleId),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_key')
        .eq('role_id', roleId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.permission_key);
    },
  });
}

/** 對某 role 的 permission 做 toggle（add / remove 一個 key） */
export function useToggleRolePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { roleId: string; key: string; enabled: boolean }) => {
      if (input.enabled) {
        const { error } = await supabase
          .from('role_permissions')
          .insert({ role_id: input.roleId, permission_key: input.key });
        if (error && !error.message.includes('duplicate')) throw error;
      } else {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', input.roleId)
          .eq('permission_key', input.key);
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'rolePerms', vars.roleId] });
      // 已掛此角色的使用者下次取 v_my_profile 會看到新權限
      void qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/** 建立自訂角色（is_system=false） */
export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('roles')
        .insert({
          name: input.name,
          description: input.description ?? null,
          is_system: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
}

/** 刪除自訂角色（系統角色由 is_system flag 擋住，前端先檢查） */
export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from('roles').delete().eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

/** 統計每個 role 目前指派給多少 user（給刪除確認用） */
export function useRoleAssignmentCounts() {
  return useQuery({
    queryKey: QK.roleCounts,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.from('user_roles').select('role_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        counts[r.role_id] = (counts[r.role_id] ?? 0) + 1;
      });
      return counts;
    },
  });
}
