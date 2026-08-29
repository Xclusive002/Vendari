'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuantityStepper } from '@/components/quantity-stepper'
import { getTopProducts, addSale } from '@/app/actions/business'
import { toast } from 'sonner'
import { TrendingUp } from 'lucide-react'

interface QuickSaleGridProps {
	businessId: string
	onSaleAdded?: () => void
}

export function QuickSaleGrid({ businessId, onSaleAdded }: QuickSaleGridProps) {
	const [products, setProducts] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
	const [processingId, setProcessingId] = useState<string | null>(null)

	useEffect(() => {
		loadTopProducts()
	}, [businessId])

	const loadTopProducts = async () => {
		try {
			const result = await getTopProducts(businessId, 20)
			if (result.success) {
				setProducts(result.data)
			}
		} catch (error) {
			console.error('[QuickSale] Error loading products:', error)
			toast.error('Failed to load top products')
		} finally {
			setLoading(false)
		}
	}

	const handleProductTap = (productId: string) => {
		setSelectedProductId(selectedProductId === productId ? null : productId)
	}

	const handleConfirmSale = async (quantity: number) => {
		const product = products.find((p) => String(p.id) === selectedProductId)
		if (!product) return

		setProcessingId(selectedProductId)
		try {
			const result = await addSale(businessId, {
				item: product.id,
				quantity,
				payment_method: 'cash',
			})

			if (result.success) {
				toast.success(`Sale recorded: ${quantity} × ${product.product_name}`)
				setSelectedProductId(null)
				onSaleAdded?.()
			} else {
				toast.error(result.error || 'Failed to record sale')
			}
		} catch (error) {
			console.error('[QuickSale] Error:', error)
			toast.error('Error recording sale')
		} finally {
			setProcessingId(null)
		}
	}

	const handleCancel = () => {
		setSelectedProductId(null)
	}

	if (loading) {
		return (
			<Card className="dashboard-panel">
				<CardHeader>
					<CardTitle className="font-display text-ink flex items-center gap-2">
						<TrendingUp className="w-5 h-5 text-blue" />
						Quick Sale
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center text-text-secondary py-8">Loading top products...</div>
				</CardContent>
			</Card>
		)
	}

	if (products.length === 0) {
		return (
			<Card className="dashboard-panel">
				<CardHeader>
					<CardTitle className="font-display text-ink flex items-center gap-2">
						<TrendingUp className="w-5 h-5 text-blue" />
						Quick Sale
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center text-text-secondary py-8">No sales history yet. Quick Sale will appear here.</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="dashboard-panel mb-8">
			<CardHeader>
				<CardTitle className="font-display text-ink flex items-center gap-2">
					<TrendingUp className="w-5 h-5 text-blue" />
					Quick Sale
				</CardTitle>
				<p className="text-sm text-text-secondary mt-2">Tap a product to record a quick sale</p>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
					{products.map((product) => (
						<div key={product.id}>
							<button
								onClick={() => handleProductTap(String(product.id))}
								className={`
									w-full p-4 rounded-lg border-2 transition-all
									flex flex-col items-center justify-center gap-2
									min-h-32 font-medium
									${
										selectedProductId === String(product.id)
											? 'border-blue bg-blue/10 scale-95'
											: 'border-slate-600 bg-slate-700/30 hover:border-blue hover:bg-blue/5 active:scale-95'
									}
								`}
								title={product.product_name}
							>
								<div className="text-sm text-text-secondary text-center line-clamp-2">{product.product_name}</div>
								<div className="text-lg font-semibold text-positive">₦{Number(product.selling_price || 0).toLocaleString()}</div>
								<div className="text-xs text-text-muted">{product.quantity_in_stock} in stock</div>
							</button>

							{selectedProductId === String(product.id) && (
								<div className="mt-3 animate-in slide-in-from-top-2">
									<QuantityStepper
										initialQuantity={1}
										maxQuantity={product.quantity_in_stock}
										onConfirm={handleConfirmSale}
										onCancel={handleCancel}
										confirmLabel="Record Sale"
										isLoading={processingId === String(product.id)}
									/>
								</div>
							)}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
