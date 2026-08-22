'use server'

import { apiJson } from '@/lib/api-client'

type BusinessData = {
  business_name: string
  business_email?: string
  business_phone?: string
  business_address?: string
  business_type?: string
}

type ItemData = {
  product_name: string
  product_code?: string
  category?: string
  quantity_in_stock: number
  reorder_level?: number
  unit_cost?: number
  selling_price?: number
  supplier_name?: string
  supplier_contact?: string
}

type ApiItem = {
  id: string
  product_name: string
  code?: string
  category?: string
  qty_in_stock: number
  reorder_level: number
  cost_price?: number
  selling_price?: number
  is_low_stock?: boolean
}

function itemFromApi(item: ApiItem) {
  return {
    ...item,
    product_code: item.code || '',
    quantity_in_stock: item.qty_in_stock,
    unit_cost: item.cost_price || 0,
    supplier_name: '',
    supplier_contact: '',
  }
}

function itemToApi(item: Partial<ItemData>) {
  return {
    product_name: item.product_name,
    code: item.product_code || '',
    category: item.category || '',
    qty_in_stock: item.quantity_in_stock ?? 0,
    reorder_level: item.reorder_level ?? 10,
    cost_price: item.unit_cost ?? 0,
    selling_price: item.selling_price ?? 0,
  }
}

async function request<T>(path: string, options?: RequestInit) {
  try {
    return { success: true, data: await apiJson<T>(path, options) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'API request failed' }
  }
}

export async function createBusiness(businessData: BusinessData) {
  return request('/api/businesses/', { method: 'POST', body: JSON.stringify({
    name: businessData.business_name,
    email: businessData.business_email || '',
    phone: businessData.business_phone || '',
    address: businessData.business_address || '',
    business_type: businessData.business_type || '',
  }) })
}

export async function updateBusiness(businessId: string, updates: Partial<BusinessData>) {
  return request(`/api/businesses/${businessId}/`, { method: 'PATCH', body: JSON.stringify({ name: updates.business_name, email: updates.business_email }) })
}

export async function getBusiness() {
  try {
    const businesses = await apiJson<any[]>('/api/businesses/')
    return businesses[0] ? { ...businesses[0], business_name: businesses[0].name } : null
  } catch {
    return null
  }
}

export async function addInventoryItem(businessId: string, itemData: ItemData) {
  const result = await request<ApiItem>(`/api/businesses/${businessId}/inventory/`, { method: 'POST', body: JSON.stringify(itemToApi(itemData)) })
  return result.success ? { success: true, data: itemFromApi(result.data) } : result
}

export async function getInventory(businessId: string) {
  const result = await request<ApiItem[]>(`/api/businesses/${businessId}/inventory/`)
  return result.success ? { success: true, data: result.data.map(itemFromApi) } : { ...result, data: [] }
}

export async function updateInventoryItem(businessId: string, itemId: string, updates: Partial<ItemData>) {
  const result = await request<ApiItem>(`/api/businesses/${businessId}/inventory/${itemId}/`, { method: 'PATCH', body: JSON.stringify(itemToApi(updates)) })
  return result.success ? { success: true, data: itemFromApi(result.data) } : result
}

export async function deleteInventoryItem(businessId: string, itemId: string) {
  return request(`/api/businesses/${businessId}/inventory/${itemId}/`, { method: 'DELETE' })
}

export async function addSale(businessId: string, saleData: any) {
  return request(`/api/businesses/${businessId}/sales/`, { method: 'POST', body: JSON.stringify(saleData) })
}

export async function getSales(businessId: string, startDate?: string, endDate?: string) {
  const query = new URLSearchParams()
  if (startDate) query.set('date_from', startDate)
  if (endDate) query.set('date_to', endDate)
  const result = await request<any[]>(`/api/businesses/${businessId}/sales/?${query}`)
  return result.success ? { success: true, data: result.data } : { ...result, data: [] }
}

export async function addExpense(businessId: string, expenseData: any) {
  return request(`/api/businesses/${businessId}/expenses/`, { method: 'POST', body: JSON.stringify({ ...expenseData, date: expenseData.expense_date }) })
}

export async function getExpenses(businessId: string, startDate?: string, endDate?: string) {
  const query = new URLSearchParams()
  if (startDate) query.set('date_from', startDate)
  if (endDate) query.set('date_to', endDate)
  const result = await request<any[]>(`/api/businesses/${businessId}/expenses/?${query}`)
  return result.success ? { success: true, data: result.data.map((item) => ({ ...item, expense_date: item.date })) } : { ...result, data: [] }
}

export async function getInsights(businessId: string) {
  const result = await request<any[]>(`/api/businesses/${businessId}/ai-insights/`)
  return result.success ? { success: true, data: result.data } : { ...result, data: [] }
}
