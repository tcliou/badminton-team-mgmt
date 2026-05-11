import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/supabase/client';

/** 全部角色（給「可見對象」與權限後台選用） */
export function useAllRoles() {
  return useQuery({
    queryKey: ['roles', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id,name,description,is_system')
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}
