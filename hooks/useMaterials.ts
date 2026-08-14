import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi, MaterialGenerationReq } from '@/lib/api/materials';

export function useCourseMaterials(courseId: number) {
  return useQuery({
    queryKey: ['materials', 'course', courseId],
    queryFn: () => materialsApi.listForCourse(courseId),
    enabled: !!courseId,
  });
}

export function useMaterialDetail(id: number) {
  return useQuery({
    queryKey: ['materials', 'detail', id],
    queryFn: () => materialsApi.getDetail(id),
    enabled: !!id,
  });
}

export function useRequestMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MaterialGenerationReq) => materialsApi.requestGeneration(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials', 'course', variables.courseId] });
    },
  });
}
