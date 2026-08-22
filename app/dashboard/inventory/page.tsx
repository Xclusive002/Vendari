'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getBusiness, getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/app/actions/business'
import { Plus, Edit2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function InventoryPage() {
  const [business, setBusiness] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    category: '',
    quantity_in_stock: 0,
    reorder_level: 10,
    unit_cost: 0,
    selling_price: 0,
    supplier_name: '',
    supplier_contact: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const businessData = await getBusiness()
      if (!businessData) {
        window.location.href = '/dashboard/setup'
        return
      }

      setBusiness(businessData)
      const result = await getInventory(businessData.id)
      setInventory(result.data || [])
    } catch (error) {
      console.error('[Inventory] Error:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingId(item.id)
      setFormData({
        product_name: item.product_name,
        product_code: item.product_code || '',
        category: item.category || '',
        quantity_in_stock: item.quantity_in_stock,
        reorder_level: item.reorder_level || 10,
        unit_cost: item.unit_cost || 0,
        selling_price: item.selling_price || 0,
        supplier_name: item.supplier_name || '',
        supplier_contact: item.supplier_contact || '',
      })
    } else {
      setEditingId(null)
      setFormData({
        product_name: '',
        product_code: '',
        category: '',
        quantity_in_stock: 0,
        reorder_level: 10,
        unit_cost: 0,
        selling_price: 0,
        supplier_name: '',
        supplier_contact: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_name) {
      toast.error('Product name is required')
      return
    }

    try {
      if (editingId) {
        const result = await updateInventoryItem(business.id, editingId, formData)
        if (result.success) {
          toast.success('Item updated successfully!')
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await addInventoryItem(business.id, formData)
        if (result.success) {
          toast.success('Item added successfully!')
        } else {
          toast.error(result.error)
        }
      }

      setDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('[Inventory] Error:', error)
      toast.error('An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const lowStockItems = inventory.filter((item) => item.quantity_in_stock <= (item.reorder_level || 10))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DashboardNav />

      <main className="md:ml-64 p-4 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
            <p className="text-slate-400 mt-2">{inventory.length} products tracked</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingId ? 'Edit Item' : 'Add New Item'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <Label className="text-slate-300">Product Name *</Label>
                  <Input
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    placeholder="Product name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Product Code</Label>
                    <Input
                      value={formData.product_code}
                      onChange={(e) =>
                        setFormData({ ...formData, product_code: e.target.value })
                      }
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="SKU or code"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Category</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="e.g., Electronics"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Quantity in Stock</Label>
                    <Input
                      type="number"
                      value={formData.quantity_in_stock}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity_in_stock: parseInt(e.target.value) })
                      }
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Reorder Level</Label>
                    <Input
                      type="number"
                      value={formData.reorder_level}
                      onChange={(e) =>
                        setFormData({ ...formData, reorder_level: parseInt(e.target.value) })
                      }
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Unit Cost (₦)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.unit_cost}
                      onChange={(e) =>
                        setFormData({ ...formData, unit_cost: parseFloat(e.target.value) })
                      }
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Selling Price (₦)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) =>
                        setFormData({ ...formData, selling_price: parseFloat(e.target.value) })
                      }
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Supplier Name</Label>
                  <Input
                    value={formData.supplier_name}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier_name: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Supplier Contact</Label>
                  <Input
                    value={formData.supplier_contact}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier_contact: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                    placeholder="Phone or email"
                  />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  {editingId ? 'Update Item' : 'Add Item'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="bg-red-500/10 border-red-500/30 mb-8">
            <CardContent className="p-6 flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-semibold">{lowStockItems.length} items low in stock</p>
                <p className="text-red-200/70 text-sm">Consider reordering these items soon</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory Table */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Product Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {inventory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold">Product</th>
                      <th className="text-left py-3 px-4 font-semibold">Code</th>
                      <th className="text-left py-3 px-4 font-semibold">Category</th>
                      <th className="text-left py-3 px-4 font-semibold">In Stock</th>
                      <th className="text-left py-3 px-4 font-semibold">Unit Cost</th>
                      <th className="text-left py-3 px-4 font-semibold">Selling Price</th>
                      <th className="text-left py-3 px-4 font-semibold">Supplier</th>
                      <th className="text-left py-3 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const isLowStock = item.quantity_in_stock <= (item.reorder_level || 10)
                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-slate-700 hover:bg-slate-700/30 ${
                            isLowStock ? 'bg-red-500/5' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-medium text-white">{item.product_name}</td>
                          <td className="py-3 px-4">{item.product_code || '-'}</td>
                          <td className="py-3 px-4">{item.category || '-'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                isLowStock
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-green-500/20 text-green-300'
                              }`}
                            >
                              {item.quantity_in_stock}
                            </span>
                          </td>
                          <td className="py-3 px-4">₦{item.unit_cost?.toLocaleString()}</td>
                          <td className="py-3 px-4">₦{item.selling_price?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-xs">{item.supplier_name || '-'}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button
                                onClick={() => handleOpenDialog(item)}
                                size="sm"
                                variant="ghost"
                                className="text-blue-400 hover:bg-blue-500/10"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={async () => {
                                  const result = await deleteInventoryItem(business.id, item.id)
                                  if (result.success) {
                                    toast.success('Item deleted successfully!')
                                    loadData()
                                  } else {
                                    toast.error(result.error)
                                  }
                                }}
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:bg-red-500/10"
                              >
                                ×
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-12">No inventory items yet. Start by adding products.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
