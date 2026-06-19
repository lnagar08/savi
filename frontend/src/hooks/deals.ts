import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDeals, deleteDeal, type GetDealsOptions } from '../services/deals'

export const useDealsQuery = (options: GetDealsOptions) => {
  return useQuery({
    queryKey: ['deals', options],
    queryFn: () => getDeals(options),
    placeholderData: (previousData) => previousData,
  })
}

export const useDeleteDealMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDeal(id), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] })
    },
  })
}