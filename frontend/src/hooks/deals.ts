import { useQuery } from '@tanstack/react-query'
import { getDeals, type GetDealsOptions } from '../services/deals'

export const useDealsQuery = (options: GetDealsOptions) => {
  return useQuery({
    queryKey: ['deals', options],
    queryFn: () => getDeals(options),
    placeholderData: (previousData) => previousData,
  })
}
