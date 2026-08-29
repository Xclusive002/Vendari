'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { QuantityStepper } from '@/components/quantity-stepper'
import { updateInventoryItem } from '@/app/actions/business'
import { toast } from 'sonner'
import { Search, Zap } from 'lucide-react'

interface QuickRestockGridProps {
	items: any[]
	businessId: string
	onRestockAdded?: () => void
}

export function QuickRestockGrid({ items, businessId, onRestockAdded }: QuickRestockGridProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
	const [processingId, setProcessingId] = useState<string | null>(null)

	const filteredItems = useMemo(() => {
		return items.filter((item) =>
			item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	}, [items, searchQuery])

	const handleItemTap = (itemId: string) => {
		setSelectedItemId(selectedItemId === itemId ? null : itemId)
	}

	const handleConfirmRestock = async (quantity: number) => {
		const item = items.find((i) => String(i.id) === selectedItemId)
		if (!item) return

		setProcessingId(selectedItemId)
		try {
			const result = await updateInventoryItem(businessId, String(item.id), {
				quantity_in_stock: item.quantity_in_stock + quantity,
			})

			if (result.success) {
				toast.success(`Restocked: +${quantity} × ${item.product_name}`)
				setSelectedItemId(null)
				onRestockAdded?.()
			} else {
				toast.error(result.error || 'Failed to update stock')
			}
		} catch (error) {
			console.error('[QuickRestock] Error:', error)
			toast.error('Error updating stock')
		} finally {
			setProcessingId(null)
		}
	}

	const handleCancel = () => {
		setSelectedItemId(null)
	}

	if (items.length === 0) {
		return null
	}

	return (
		<Card className="dashboard-panel mb-8">
			<CardHeader>
				<CardTitle className="font-display text-ink flex items-center gap-2">
					<Zap className="w-5 h-5 text-blue" />
					Quick Restock
				</CardTitle>
				<p className="text-sm text-text-secondary mt-2">Tap an item to quickly add to stock</p>
			</CardHeader>
			<CardContent>
				{/* Search Bar */}
				<div className="mb-6 relative">
					<Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
					<Input
						placeholder="Search items..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="dashboard-input pl-10"
					/>
				</div>

				{/* Grid */}
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
					{filteredItems.map((item) => (
						<div key={item.id}>
							<button
								onClick={() => handleItemTap(String(item.id))}
								className={`
									w-full p-4 rounded-lg border-2 transition-all
									flex flex-col items-center justify-center gap-2
									min-h-32 font-medium
									${
										selectedItemId === String(item.id)
											? 'border-blue bg-blue/10 scale-95'
											: 'border-slate-600 bg-slate-700/30 hover:border-blue hover:bg-blue/5 active:scale-95'
									}
								`}
								title={item.product_name}
							>
								<div className="text-sm text-text-secondary text-center line-clamp-2">{item.product_name}</div>
								<div className="flex gap-2 text-xs text-text-muted">
									<span>Current: {item.quantity_in_stock}</span>
								</div>
								<div className="text-lg font-semibold text-blue">₦{Number(item.selling_price || 0).toLocaleString()}</div>
							</button>

							{selectedItemId === String(item.id) && (
								<div className="mt-3 animate-in slide-in-from-top-2">
									<QuantityStepper
										initialQuantity={10}
										minQuantity={1}
										onConfirm={handleConfirmRestock}
										onCancel={handleCancel}
										confirmLabel="Add to Stock"
										isLoading={processingId === String(item.id)}
									/>
								</div>
							)}
						</div>
					))}
				</div>

				{filteredItems.length === 0 && (
					<div className="text-center text-text-secondary py-8">No items match your search.</div>
				)}
			</CardContent>
		</Card>
	)
}
